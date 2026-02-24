# La Petite Maison de l'Épouvante — Implementation To-Do List

> Stack: NestJS · React · PostgreSQL/TypeORM · RabbitMQ · Keycloak · Kubernetes · GitHub Actions

---

## Phase 1 — Project Bootstrap

- [X] Initialise mono-repo root (`package.json` with workspaces, `.gitignore`, `.editorconfig`)
- [X] Create folder structure:
  ```
  /services
    /gateway
    /auth
    /vente
    /communaute
    /media
  /frontend
  /infra
    /docker
    /k8s
  /.github/workflows
  ```
- [X] Scaffold each NestJS service (`nest new` or manual) inside `/services/*`
- [X] Scaffold React + TypeScript app inside `/frontend` (Vite or CRA)
- [X] Initialise Git repository and make first commit

---

## Phase 2 — Infrastructure / DevOps Foundation

### Docker (local dev)

- [X] Write `docker-compose.yml` at the root with:
  - [X] PostgreSQL (port 5432, volume mount)
  - [X] RabbitMQ with management UI (ports 5672 / 15672, volume mount)
  - [X] Keycloak (port 8080, linked to PostgreSQL or its own DB)
- [X] Write a multi-stage `Dockerfile` for each NestJS service
- [X] Write a `Dockerfile` for the React frontend (build + nginx)

### Kubernetes manifests (`/infra/k8s`)

- [X] Namespace manifest (`namespace.yaml`)
- [X] PostgreSQL: Deployment, Service (ClusterIP), PersistentVolumeClaim
- [X] RabbitMQ: Deployment, Service (ClusterIP), PersistentVolumeClaim
- [X] Keycloak: Deployment, Service (ClusterIP)
- [X] API Gateway: Deployment, Service (ClusterIP)
- [X] Auth Service: Deployment, Service (ClusterIP)
- [X] Vente Service: Deployment, Service (ClusterIP)
- [X] Communauté Service: Deployment, Service (ClusterIP)
- [X] Média Service: Deployment, Service (ClusterIP), HorizontalPodAutoscaler
- [X] Frontend: Deployment, Service (ClusterIP)
- [X] Ingress Controller manifest (route `/api` to gateway, `/` to frontend)
- [X] Add Liveness & Readiness probes to every service Deployment
- [X] Add resource requests & limits to every service Deployment
- [ ] (Optional) Create Helm chart wrapping the above manifests

---

## Phase 3 — Authentication (Keycloak + Auth Service)

### Keycloak Configuration

- [X] Create realm (`maison-epouvante`)
- [X] Create client for the backend (confidential, service-account enabled)
- [X] Create client for the frontend (public, PKCE)
- [X] Define roles: `admin`, `user`
- [X] Create test users with assigned roles

### Auth NestJS Service (`/services/auth`)

- [X] Install dependencies: `@nestjs/passport`, `passport-jwt`, `cookie-parser`, `axios`, `jwks-rsa`
- [X] Configure JWT strategy that reads token from `HttpOnly` cookie (NOT localStorage)
- [X] Implement `POST /auth/login` — proxy to Keycloak token endpoint, set `HttpOnly`, `Secure`, `SameSite=Strict` cookie
- [X] Implement `POST /auth/logout` — clear cookie
- [X] Implement `GET /auth/me` — return current user from JWT
- [X] Implement `POST /auth/refresh` — refresh token flow
- [X] Create `JwtAuthGuard` and `RolesGuard` (reusable across services)
- [X] Write unit tests for auth logic

---

## Phase 4 — API Gateway (`/services/gateway`)

- [X] Install dependencies: `@nestjs/axios`, `cookie-parser`
- [X] Configure proxy routes:
  - [X] `/api/auth/*` → Auth Service
  - [X] `/api/vente/*` → Vente Service
  - [X] `/api/communaute/*` → Communauté Service
  - [X] `/api/media/*` → Média Service
- [X] Add JWT validation middleware (forward `HttpOnly` cookie to downstream)
- [X] Add global exception filter (centralised error responses)
- [X] Add rate limiting (`@nestjs/throttler`)
- [X] Write unit tests

---

## Phase 5 — Domain Micro-services

### 5.1 — Vente Service (`/services/vente`)

- [X] Configure TypeORM connection to PostgreSQL
- [X] Create entities: `Product`, `Order`, `OrderItem`
  - [X] Use `JSONB` column on `Product` for flexible metadata (films, BD, goodies)
- [X] Create DTOs with `class-validator` and `class-transformer`
- [X] Implement CRUD controllers:
  - [X] `GET /products` — list products (with filters)
  - [X] `GET /products/:id` — product detail
  - [X] `POST /products` — create product (admin only)
  - [X] `PUT /products/:id` — update product (admin only)
  - [X] `DELETE /products/:id` — delete product (admin only)
  - [X] `POST /orders` — place order
  - [X] `GET /orders` — list user orders
- [X] Publish RabbitMQ event on order creation (`order.created`)
- [X] Add global exception filter
- [X] Write unit tests


### 5.2 — Communauté Service (`/services/communaute`)

- [X] Configure TypeORM connection to PostgreSQL
- [X] Create entities: `Post`, `Comment`, `Like`
- [X] Create DTOs with `class-validator` and `class-transformer`
- [X] Implement CRUD controllers:
  - [X] `GET /posts` — list posts
  - [X] `GET /posts/:id` — post detail with comments
  - [X] `POST /posts` — create post
  - [X] `PUT /posts/:id` — update post
  - [X] `DELETE /posts/:id` — delete post
  - [X] `POST /posts/:id/comments` — add comment
  - [X] `POST /posts/:id/like` — toggle like
- [X] Consume RabbitMQ events if needed (e.g., notify on new order)
- [X] Add global exception filter
- [X] Write unit tests


## Phase 6 — Frontend (React + TypeScript)

### Project Setup

- [X] Scaffold with Vite + React + TypeScript
- [X] Install dependencies: `axios`, `react-router-dom`, `@tanstack/react-query` (or similar)
- [X] Configure `axios` with `withCredentials: true` (for HttpOnly cookies)

### Authentication

- [X] Login page — call `/api/auth/login`, cookie is set automatically
- [X] Logout button — call `/api/auth/logout`
- [X] Auth context / hook (`useAuth`) that calls `/api/auth/me`
- [X] Protected route wrapper (redirect to login if unauthenticated)

### Pages

- [X] **Home** — landing page
- [X] **Catalogue (Vente)** — product listing, product detail, cart, order placement
- [X] **Community (Communauté)** — forum: post list, post detail, create post, comments
- [X] **Media** — media browser, streaming player
- [X] **Admin Dashboard** — manage products, media, users (admin role only)

---

## Phase 7 — CI/CD (GitHub Actions)

- [X] Create a reusable workflow template (`.github/workflows/ci-template.yml`):
  - [X] Step 1: Checkout code
  - [X] Step 2: Install dependencies
  - [X] Step 3: Lint (`eslint`)
  - [X] Step 4: Run unit tests
  - [X] Step 5: Security scan (`npm audit`)
  - [X] Step 6: Build multi-stage Docker image
  - [X] Step 7: Push image to container registry (ghcr.io via `GITHUB_TOKEN`)
  - [X] Step 8: Deploy to Kubernetes cluster (`kubectl rollout`)
- [X] Create per-service workflow calling the template:
  - [X] `gateway.yml`
  - [X] `auth.yml`
  - [X] `vente.yml`
  - [X] `communaute.yml`
  - [X] `media.yml`
  - [X] `frontend.yml`
- [ ] Configure GitHub secrets: registry credentials, kubeconfig

---

## Phase 8 — Final Checks

- [ ] End-to-end smoke test (login → browse products → place order → check community)
- [ ] Verify all Kubernetes probes are healthy
- [ ] Verify HPA triggers on Média Service under load
- [ ] Run `npm audit` on every service and fix critical vulnerabilities
- [ ] Review cookie security settings (`HttpOnly`, `Secure`, `SameSite=Strict`)
- [ ] Verify no JWT is stored in `localStorage` anywhere in the frontend code
- [ ] Write project-level README with setup instructions
- [ ] Document API endpoints (Swagger / OpenAPI on each service)
