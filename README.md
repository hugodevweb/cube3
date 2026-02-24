# La Petite Maison de l'Épouvante

E-commerce and community platform for horror enthusiasts — films, comics, and collectibles.

## Architecture

```
Browser
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│  Ingress (Nginx)                                        │
│  /        → Frontend (React + Vite, port 80)           │
│  /api/*   → API Gateway (NestJS, port 3000)            │
└─────────────────────────────────────────────────────────┘
                          │
              ┌───────────┼───────────────┐
              ▼           ▼               ▼
         Auth (3001) Vente (3002)  Communauté (3003)
              │           │               │
              └─────── PostgreSQL ────────┘
                          │
                       Keycloak (8080)
                       RabbitMQ (5672)
                    Média Service (3004)
```

All inter-service communication is internal (ClusterIP / Docker network). The browser never contacts a service directly — all traffic goes through the API Gateway.

Authentication uses **HttpOnly cookies** (no JWT in `localStorage`).

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 20 LTS |
| Docker + Docker Compose | 24 / 2.24 |
| kubectl | 1.29 |
| A Kubernetes cluster | minikube / kind / cloud |

## Local Development (Docker Compose)

The Compose file starts the infrastructure layer (PostgreSQL, RabbitMQ, Keycloak). Each NestJS service is run locally with `npm run start:dev`.

```bash
# 1. Copy and configure environment variables
cp .env.example .env
# Edit .env if you need non-default passwords

# 2. Start infrastructure
docker compose up -d

# 3. Wait for Keycloak to be healthy (~60 s on first boot)
docker compose ps

# 4. Start each service in a separate terminal
cd services/auth      && npm install && npm run start:dev   # :3001
cd services/gateway   && npm install && npm run start:dev   # :3000
cd services/vente     && npm install && npm run start:dev   # :3002
cd services/communaute && npm install && npm run start:dev  # :3003
cd services/media     && npm install && npm run start:dev   # :3004

# 5. Start the frontend
cd frontend && npm install && npm run dev                    # :5173
```

Open `http://localhost:5173`. The Vite dev proxy forwards `/api/*` to `http://localhost:3000`.

### Keycloak Admin Console

`http://localhost:8080` — login with `admin` / `changeme_admin` (or your `.env` values).

The realm `maison-epouvante` is automatically imported from `infra/keycloak/realm-export.json`.

## Kubernetes Deployment

```bash
# 1. Build and push images (replace <registry> with your registry)
docker build -t <registry>/maison-auth:latest       services/auth
docker build -t <registry>/maison-gateway:latest    services/gateway
docker build -t <registry>/maison-vente:latest      services/vente
docker build -t <registry>/maison-communaute:latest services/communaute
docker build -t <registry>/maison-media:latest      services/media
docker build -t <registry>/maison-frontend:latest   frontend

docker push <registry>/maison-auth:latest
# ... push remaining images

# 2. Apply manifests
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/

# 3. Check rollout
kubectl rollout status deployment -n maison-epouvante

# 4. Verify probes
kubectl get pods -n maison-epouvante
```

### Ingress

The Ingress manifest (`infra/k8s/ingress.yaml`) routes:
- `/*` → frontend
- `/api/*` → gateway

Configure your DNS or `/etc/hosts` to point the hostname to your cluster IP.

## Service Port Map

| Service | Internal port | Swagger UI |
|---------|--------------|-----------|
| API Gateway | 3000 | `http://localhost:3000/api/docs` |
| Auth Service | 3001 | `http://localhost:3001/auth/docs` |
| Vente Service | 3002 | `http://localhost:3002/vente/docs` |
| Communauté Service | 3003 | `http://localhost:3003/communaute/docs` |
| Média Service | 3004 | — |
| Frontend (dev) | 5173 | — |
| Frontend (prod) | 80 | — |
| PostgreSQL | 5432 | — |
| RabbitMQ | 5672 / 15672 | `http://localhost:15672` |
| Keycloak | 8080 | `http://localhost:8080` |

## Environment Variables

Copy `.env.example` to `.env` and adjust the values. Never commit `.env`.

| Variable | Description |
|----------|-------------|
| `POSTGRES_USER` | PostgreSQL superuser name |
| `POSTGRES_PASSWORD` | PostgreSQL superuser password |
| `POSTGRES_DB` | Main application database name |
| `KEYCLOAK_DB` | Keycloak dedicated database name |
| `KEYCLOAK_DB_USER` | Keycloak DB user |
| `KEYCLOAK_DB_PASSWORD` | Keycloak DB password |
| `KEYCLOAK_ADMIN` | Keycloak admin username |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak admin password |
| `RABBITMQ_DEFAULT_USER` | RabbitMQ default user |
| `RABBITMQ_DEFAULT_PASS` | RabbitMQ default password |
| `KEYCLOAK_URL` | Keycloak base URL (seen by Auth Service) |
| `KEYCLOAK_REALM` | Keycloak realm name |
| `KEYCLOAK_CLIENT_ID` | Backend confidential client ID |
| `KEYCLOAK_CLIENT_SECRET` | Backend confidential client secret |
| `AUTH_SERVICE_URL` | Auth Service URL (seen by Gateway) |
| `VENTE_SERVICE_URL` | Vente Service URL (seen by Gateway) |
| `COMMUNAUTE_SERVICE_URL` | Communauté Service URL (seen by Gateway) |
| `MEDIA_SERVICE_URL` | Média Service URL (seen by Gateway) |

## CI/CD (GitHub Actions)

Each service has a dedicated workflow in `.github/workflows/` that calls the reusable template `.github/workflows/ci-template.yml`. The pipeline runs on every push and pull request:

1. Checkout code
2. Install dependencies (`npm ci`)
3. Lint (`eslint`)
4. Unit tests (`jest`)
5. Security scan (`npm audit`)
6. Build multi-stage Docker image
7. Push to `ghcr.io` (requires `GITHUB_TOKEN` — no extra secret needed)
8. Deploy to Kubernetes (`kubectl rollout`)

Required GitHub secrets:
- `KUBECONFIG` — base64-encoded kubeconfig for your cluster

## Security Notes

- JWTs are stored exclusively in **HttpOnly, Secure, SameSite=Strict** cookies — never in `localStorage`.
- The `access_token` cookie expires after 5 minutes; `refresh_token` after 30 minutes.
- The `refresh_token` cookie is scoped to `path: /auth/refresh` to limit its exposure.
- All authenticated routes are protected by `JwtAuthGuard` (validates the token against Keycloak's JWKS endpoint).
- Rate limiting is enforced at the Gateway level via `@nestjs/throttler`.

## Running Tests

```bash
# Run tests for a single service
cd services/auth && npm test

# Run with coverage
cd services/vente && npm run test:cov
```

## Running the E2E Smoke Test

```bash
# Bash (requires curl and a running stack at http://localhost:3000)
bash scripts/smoke-test.sh

# PowerShell (Windows)
.\scripts\smoke-test.ps1
```

The smoke test exercises the full happy path: login → browse products → place an order → read community posts.
