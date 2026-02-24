# La Petite Maison de l'Épouvante — Implementation To-Do List

> Stack: NestJS · React · PostgreSQL/TypeORM · RabbitMQ · Keycloak · Kubernetes · GitHub Actions

---

## Phase 1 — Project Bootstrap

- [ ] Initialise mono-repo root (`package.json` with workspaces, `.gitignore`, `.editorconfig`)
- [ ] Create folder structure:
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
- [ ] Scaffold each NestJS service (`nest new` or manual) inside `/services/*`
- [ ] Scaffold React + TypeScript app inside `/frontend` (Vite or CRA)
- [ ] Initialise Git repository and make first commit

---

## Phase 2 — Infrastructure / DevOps Foundation

### Docker (local dev)

- [ ] Write `docker-compose.yml` at the root with:
  - [ ] PostgreSQL (port 5432, volume mount)
  - [ ] RabbitMQ with management UI (ports 5672 / 15672, volume mount)
  - [ ] Keycloak (port 8080, linked to PostgreSQL or its own DB)
- [ ] Write a multi-stage `Dockerfile` for each NestJS service
- [ ] Write a `Dockerfile` for the React frontend (build + nginx)

### Kubernetes manifests (`/infra/k8s`)

- [ ] Namespace manifest (`namespace.yaml`)
- [ ] PostgreSQL: Deployment, Service (ClusterIP), PersistentVolumeClaim
- [ ] RabbitMQ: Deployment, Service (ClusterIP), PersistentVolumeClaim
- [ ] Keycloak: Deployment, Service (ClusterIP)
- [ ] API Gateway: Deployment, Service (ClusterIP)
- [ ] Auth Service: Deployment, Service (ClusterIP)
- [ ] Vente Service: Deployment, Service (ClusterIP)
- [ ] Communauté Service: Deployment, Service (ClusterIP)
- [ ] Média Service: Deployment, Service (ClusterIP), HorizontalPodAutoscaler
- [ ] Frontend: Deployment, Service (ClusterIP)
- [ ] Ingress Controller manifest (route `/api` to gateway, `/` to frontend)
- [ ] Add Liveness & Readiness probes to every service Deployment
- [ ] Add resource requests & limits to every service Deployment
- [ ] (Optional) Create Helm chart wrapping the above manifests

---

## Phase 3 — Authentication (Keycloak + Auth Service)

### Keycloak Configuration

- [ ] Create realm (`maison-epouvante`)
- [ ] Create client for the backend (confidential, service-account enabled)
- [ ] Create client for the frontend (public, PKCE)
- [ ] Define roles: `admin`, `user`
- [ ] Create test users with assigned roles

### Auth NestJS Service (`/services/auth`)

- [ ] Install dependencies: `@nestjs/passport`, `passport-jwt`, `cookie-parser`
- [ ] Configure JWT strategy that reads token from `HttpOnly` cookie (NOT localStorage)
- [ ] Implement `POST /auth/login` — proxy to Keycloak token endpoint, set `HttpOnly`, `Secure`, `SameSite=Strict` cookie
- [ ] Implement `POST /auth/logout` — clear cookie
- [ ] Implement `GET /auth/me` — return current user from JWT
- [ ] Implement `POST /auth/refresh` — refresh token flow
- [ ] Create `JwtAuthGuard` and `RolesGuard` (reusable across services)
- [ ] Write unit tests for auth logic

---

## Phase 4 — API Gateway (`/services/gateway`)

- [ ] Install dependencies: `@nestjs/axios`, `cookie-parser`
- [ ] Configure proxy routes:
  - [ ] `/api/auth/*` → Auth Service
  - [ ] `/api/vente/*` → Vente Service
  - [ ] `/api/communaute/*` → Communauté Service
  - [ ] `/api/media/*` → Média Service
- [ ] Add JWT validation middleware (forward `HttpOnly` cookie to downstream)
- [ ] Add global exception filter (centralised error responses)
- [ ] Add rate limiting (`@nestjs/throttler`)
- [ ] Write unit tests

---

## Phase 5 — Domain Micro-services

### 5.1 — Vente Service (`/services/vente`)

- [ ] Configure TypeORM connection to PostgreSQL
- [ ] Create entities: `Product`, `Order`, `OrderItem`
  - [ ] Use `JSONB` column on `Product` for flexible metadata (films, BD, goodies)
- [ ] Create DTOs with `class-validator` and `class-transformer`
- [ ] Implement CRUD controllers:
  - [ ] `GET /products` — list products (with filters)
  - [ ] `GET /products/:id` — product detail
  - [ ] `POST /products` — create product (admin only)
  - [ ] `PUT /products/:id` — update product (admin only)
  - [ ] `DELETE /products/:id` — delete product (admin only)
  - [ ] `POST /orders` — place order
  - [ ] `GET /orders` — list user orders
- [ ] Publish RabbitMQ event on order creation (`order.created`)
- [ ] Add global exception filter
- [ ] Write unit tests

### 5.2 — Communauté Service (`/services/communaute`)

- [ ] Configure TypeORM connection to PostgreSQL
- [ ] Create entities: `Post`, `Comment`, `Like`
- [ ] Create DTOs with `class-validator` and `class-transformer`
- [ ] Implement CRUD controllers:
  - [ ] `GET /posts` — list posts
  - [ ] `GET /posts/:id` — post detail with comments
  - [ ] `POST /posts` — create post
  - [ ] `PUT /posts/:id` — update post
  - [ ] `DELETE /posts/:id` — delete post
  - [ ] `POST /posts/:id/comments` — add comment
  - [ ] `POST /posts/:id/like` — toggle like
- [ ] Consume RabbitMQ events if needed (e.g., notify on new order)
- [ ] Add global exception filter
- [ ] Write unit tests

### 5.3 — Média Service (`/services/media`)

- [ ] Configure TypeORM connection to PostgreSQL
- [ ] Create entities: `Media`, `Category`
- [ ] Create DTOs with `class-validator` and `class-transformer`
- [ ] Implement controllers:
  - [ ] `GET /media` — list/search media
  - [ ] `GET /media/:id` — media detail
  - [ ] `POST /media` — upload/create media entry (admin only)
  - [ ] `DELETE /media/:id` — delete media (admin only)
  - [ ] `GET /media/:id/stream` — stream media content
- [ ] Add HPA annotation/label for Kubernetes autoscaling
- [ ] Consume/publish RabbitMQ events as needed
- [ ] Add global exception filter
- [ ] Write unit tests

---

## Phase 6 — Frontend (React + TypeScript)

### Project Setup

- [ ] Scaffold with Vite + React + TypeScript
- [ ] Install dependencies: `axios`, `react-router-dom`, `@tanstack/react-query` (or similar)
- [ ] Configure `axios` with `withCredentials: true` (for HttpOnly cookies)

### Authentication

- [ ] Login page — call `/api/auth/login`, cookie is set automatically
- [ ] Logout button — call `/api/auth/logout`
- [ ] Auth context / hook (`useAuth`) that calls `/api/auth/me`
- [ ] Protected route wrapper (redirect to login if unauthenticated)

### Pages

- [ ] **Home** — landing page
- [ ] **Catalogue (Vente)** — product listing, product detail, cart, order placement
- [ ] **Community (Communauté)** — forum: post list, post detail, create post, comments
- [ ] **Media** — media browser, streaming player
- [ ] **Admin Dashboard** — manage products, media, users (admin role only)

### Cross-cutting

- [ ] Global error handling (toast / error boundary)
- [ ] Responsive layout and navigation
- [ ] Loading states and skeleton screens

---

## Phase 7 — CI/CD (GitHub Actions)

- [ ] Create a reusable workflow template (`.github/workflows/ci-template.yml`):
  - [ ] Step 1: Checkout code
  - [ ] Step 2: Install dependencies
  - [ ] Step 3: Lint (`eslint`)
  - [ ] Step 4: Run unit tests
  - [ ] Step 5: Security scan (`npm audit`)
  - [ ] Step 6: Build multi-stage Docker image
  - [ ] Step 7: Push image to container registry
  - [ ] Step 8: Deploy to Kubernetes cluster (`kubectl rollout`)
- [ ] Create per-service workflow calling the template:
  - [ ] `gateway.yml`
  - [ ] `auth.yml`
  - [ ] `vente.yml`
  - [ ] `communaute.yml`
  - [ ] `media.yml`
  - [ ] `frontend.yml`
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
