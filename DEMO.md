# Demo Guide — La Petite Maison de l'Épouvante

> **Audience:** Technical reviewers / evaluators  
> **Duration:** ~20–30 minutes  
> **Goal:** Walk through the full microservices stack — infrastructure, auth, APIs, frontend, CI/CD, and Kubernetes.

---

## Prerequisites checklist

Before starting, confirm everything is in place:

- [ ] Docker Desktop running
- [ ] Node.js 20 LTS installed
- [ ] `.env` file at the root (`cp .env.example .env`)
- [ ] All `npm install` done in each service and the frontend

---

## Part 1 — Start the Infrastructure (5 min)

### 1.1 Spin up PostgreSQL, RabbitMQ, and Keycloak

```bash
docker compose up -d
docker compose ps        # all three containers should be healthy
```

**What to show:**
- Three containers: `maison_postgres`, `maison_rabbitmq`, `maison_keycloak`
- PostgreSQL has an init script (`infra/docker/postgres-init.sql`) that pre-creates the `keycloak` database alongside the app database
- Keycloak is configured with `--import-realm` and automatically loads `infra/keycloak/realm-export.json`

> Keycloak takes ~60 seconds on first boot. Wait until `docker compose ps` shows `healthy`.

### 1.2 Open the RabbitMQ Management UI

`http://localhost:15672` — login: `maison` / `changeme`

**What to show:**
- The management dashboard with queues and exchange overview
- Point out that the `order.created` event will appear here when an order is placed (later in the demo)

### 1.3 Open the Keycloak Admin Console

`http://localhost:8080` — login: `admin` / `changeme_admin`

**What to show:**
- Realm `maison-epouvante` was automatically imported
- Navigate to **Clients** → show the backend confidential client and the frontend public client (PKCE)
- Navigate to **Realm roles** → `admin`, `user`
- Navigate to **Users** → pre-created `testuser` (role: `user`) and `admin` (role: `admin`)
- Point out **"HttpOnly cookie" design** — no JWT ever reaches `localStorage`

---

## Part 2 — Start the Microservices (3 min)

Open five terminals (or use a split-pane terminal):

```bash
# Terminal 1 — Auth Service   → :3001
cd services/auth       && npm run start:dev

# Terminal 2 — API Gateway    → :3000
cd services/gateway    && npm run start:dev

# Terminal 3 — Vente Service  → :3002
cd services/vente      && npm run start:dev

# Terminal 4 — Communauté     → :3003
cd services/communaute && npm run start:dev

# Terminal 5 — Frontend       → :5173
cd frontend            && npm run dev
```

**What to show:**
- Each NestJS service announces its port on startup
- The Gateway is the **single entry point** — it proxies every `/api/*` route to the right downstream service
- The frontend Vite dev server proxies `/api/*` to `http://localhost:3000`

---

## Part 3 — API Gateway & Swagger (5 min)

### 3.1 Gateway Swagger

`http://localhost:3000/api/docs`

**What to show:**
- All routes are prefixed `/api/...`
- Rate limiting is enforced at this layer (`@nestjs/throttler`)
- JWT validation middleware reads the `access_token` **HttpOnly cookie** and forwards it downstream — no Bearer header needed from the browser

### 3.2 Auth Service Swagger

`http://localhost:3001/auth/docs`

**Key endpoints to highlight:**

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/auth/login` | Proxies to Keycloak, sets `HttpOnly` cookie |
| `GET` | `/auth/me` | Returns the decoded JWT payload |
| `POST` | `/auth/refresh` | Rotates the access token using the refresh token |
| `POST` | `/auth/logout` | Clears both cookies |

**Live demo — login via Swagger:**
1. `POST /auth/login` with body `{ "username": "testuser", "password": "testpassword" }`
2. Show the response: `200 OK`, no token in the body
3. Open browser DevTools → **Application → Cookies**: `access_token` and `refresh_token` are `HttpOnly`, `Secure`, `SameSite=Strict`
4. `GET /auth/me` — the cookie is sent automatically, returns `{ sub, preferred_username, roles, ... }`

### 3.3 Vente Service Swagger

`http://localhost:3002/vente/docs`

**Key endpoints:**

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/products` | Any authenticated user |
| `GET` | `/products/:id` | Any authenticated user |
| `POST` | `/products` | `admin` role only |
| `POST` | `/orders` | Any authenticated user |
| `GET` | `/orders` | Returns caller's orders only |

**Live demo — create a product (admin flow):**
1. Log in as `admin` (re-run the login endpoint or switch user in Swagger)
2. `POST /products` with a sample body (film, BD, or goodie)
3. Show `403 Forbidden` when attempting the same call with a `user`-role token → **`RolesGuard` in action**

### 3.4 Communauté Service Swagger

`http://localhost:3003/communaute/docs`

**Key endpoints:**

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/posts` | Any authenticated user |
| `POST` | `/posts` | Any authenticated user |
| `POST` | `/posts/:id/comments` | Any authenticated user |
| `POST` | `/posts/:id/like` | Any authenticated user (toggle) |
| `DELETE` | `/posts/:id` | Post owner or `admin` |

---

## Part 4 — Frontend Walkthrough (8 min)

Open `http://localhost:5173`.

### 4.1 Login

- Navigate to `/login`
- Log in as `testuser` / `testpassword`
- Show that the URL does **not** contain a token, and `localStorage` is empty (DevTools)
- The cookie is set automatically and used for every subsequent request

### 4.2 Home page

- Hero section with calls-to-action → Boutique / Streaming
- Three showcase sections: Boutique categories, Communauté features, Streaming showcase (static, no API call)

### 4.3 Boutique (Catalogue)

- Navigate to `/catalogue`
- Product list fetched from `GET /api/vente/products`
- Click a product → `/catalogue/:id` → product detail with "Ajouter au panier"
- Add an item to the cart: the cart icon in the navbar updates (cart state managed client-side via `CartContext`)
- Navigate to `/cart` → review items → "Passer la commande" → triggers `POST /api/vente/orders`
- Navigate to `/orders` → `GET /api/vente/orders` → the new order appears

**RabbitMQ side-effect:** switch back to `http://localhost:15672` and show the `order.created` message in the queue.

### 4.4 Community

- Navigate to `/community`
- Post list from `GET /api/communaute/posts`
- Click a post → `/community/:id` → comments and like button
- Navigate to `/community/new` → create a post → `POST /api/communaute/posts`

### 4.5 Streaming / Média

- Navigate to `/media`
- Static showcase page (the Média service is the backend for uploads/streaming; the UI demonstrates the design)

### 4.6 Admin Panel (role-protected)

- Log out, then log back in as `admin` / (admin password from Keycloak)
- The **Admin** link appears in the navbar (hidden for `user` role)
- Navigate to `/admin` → product and user management panel
- Attempt to access `/admin` while logged in as `testuser` → redirect or `403`

---

## Part 5 — E2E Smoke Test (2 min)

With the full stack running, execute the automated smoke test:

```powershell
# PowerShell
.\scripts\smoke-test.ps1
```

```bash
# Bash (Linux / macOS / WSL)
bash scripts/smoke-test.sh
```

**What the script tests:**

| Step | Action | Expected |
|------|--------|---------|
| 1 | `POST /api/auth/login` | `200` |
| 2 | `GET /api/auth/me` | `200` |
| 3 | `GET /api/vente/products` | `200` |
| 4 | `GET /api/vente/products/:id` | `200` |
| 5 | `POST /api/vente/orders` | `201` |
| 6 | `GET /api/vente/orders` | `200` |
| 7 | `GET /api/communaute/posts` | `200` |
| 8 | `POST /api/communaute/posts` | `201` |
| 9 | `POST /api/auth/logout` | `204` |

All cookies are managed by a `WebRequestSession` — the same HttpOnly flow as the browser.

---

## Part 6 — CI/CD Pipeline (3 min)

### 6.1 Workflow structure

```
.github/workflows/
  ci-template.yml   ← reusable template (8 steps)
  auth.yml          ← calls template with service=auth
  gateway.yml
  vente.yml
  communaute.yml
  media.yml
  frontend.yml
```

### 6.2 Pipeline steps (show `ci-template.yml`)

| Step | Action |
|------|--------|
| 1 | `actions/checkout@v4` |
| 2 | `actions/setup-node@v4` — Node 20, npm cache |
| 3 | `npm ci` |
| 4 | `npm run lint` (ESLint) |
| 5 | `npm test` (Jest, `--passWithNoTests`) |
| 6 | `npm audit --audit-level=high` |
| 7 | `docker/build-push-action@v5` — multi-stage build, pushed to `ghcr.io` |
| 8 | `kubectl set image` + `kubectl rollout status` — zero-downtime deploy |

**Key design points:**
- Steps 7 and 8 run only on `push` to `main` — PRs only run CI
- GHA layer cache is scoped per service to accelerate rebuilds
- A single `KUBECONFIG` secret is the only required repository secret

---

## Part 7 — Kubernetes Manifests (2 min)

```
infra/k8s/
  namespace.yaml    ← maison-epouvante namespace
  postgres.yaml     ← Deployment + ClusterIP + PVC
  rabbitmq.yaml     ← Deployment + ClusterIP + PVC
  keycloak.yaml     ← Deployment + ClusterIP
  auth.yaml         ← Deployment + ClusterIP (liveness/readiness probes + resource limits)
  gateway.yaml
  vente.yaml
  communaute.yaml
  media.yaml        ← Deployment + HorizontalPodAutoscaler
  frontend.yaml     ← Deployment + ClusterIP (nginx)
  ingress.yaml      ← /* → frontend, /api/* → gateway
```

**What to highlight:**

- Every service manifest includes **liveness** and **readiness probes** pointing to `/health`
- Every service has **CPU/memory requests and limits**
- The `media` service has a `HorizontalPodAutoscaler` — scales on CPU usage (simulate with `kubectl top pods`)
- **All services are ClusterIP** — nothing is exposed directly to the internet; the Ingress is the only public entry point
- Zero-downtime rolling updates (`RollingUpdate` strategy on every Deployment)

### Quick Kubernetes demo (if cluster available)

```bash
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/
kubectl get pods -n maison-epouvante
kubectl rollout status deployment -n maison-epouvante
```

---

## Part 8 — Security Highlights (1 min)

| Concern | Implementation |
|---------|---------------|
| Token storage | `HttpOnly`, `Secure`, `SameSite=Strict` cookies — never `localStorage` |
| Token lifetime | `access_token` 5 min, `refresh_token` 30 min |
| Refresh token scope | Cookie scoped to `path: /auth/refresh` only |
| Auth provider | Keycloak — JWKS endpoint used for signature validation |
| Role enforcement | `RolesGuard` on every admin endpoint |
| Rate limiting | `@nestjs/throttler` at the Gateway level |
| Dependency audit | `npm audit --audit-level=high` in every CI run |

---

## Quick Reference — URLs

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:5173` |
| API Gateway (Swagger) | `http://localhost:3000/api/docs` |
| Auth Service (Swagger) | `http://localhost:3001/auth/docs` |
| Vente Service (Swagger) | `http://localhost:3002/vente/docs` |
| Communauté Service (Swagger) | `http://localhost:3003/communaute/docs` |
| Keycloak Admin | `http://localhost:8080` |
| RabbitMQ Management | `http://localhost:15672` |

---

## Teardown

```bash
# Stop all NestJS services (Ctrl+C in each terminal)

# Stop and remove Docker containers
docker compose down

# To also wipe volumes (database data, RabbitMQ data)
docker compose down -v
```
