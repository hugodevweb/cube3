# Spécifications Techniques : La Petite Maison de l'Épouvante

Ce document définit la stack et les règles d'architecture pour la génération de code (Front, Back, Infra).

## 1. Stack Technique Imposée
* **Backend :** NestJS (TypeScript) - Architecture modulaire (Modules, Controllers, Services).
* **Frontend :** Framework TypeScript (React) - Communication via API REST.
* **Base de Données :** PostgreSQL (Relationnel) + TypeORM ou Prisma.
* **Messaging :** RabbitMQ (Communication inter-services asynchrone).
* **Authentification :** Keycloak (OIDC) - Gestion via tokens JWT.
* **Infrastructure :** Docker & Kubernetes (use docker desktop kubernetes) (Manifestes YAML / Helm Charts).
* **CI/CD :** GitHub Actions (Workflows YAML).
--done

## 2. Architecture Logicielle
* **Pattern :** Micro-services découpés par domaine (Auth, Vente, Communauté, Média).
* **API Gateway :** Point d'entrée unique pour le Frontend.
* **Communication :** * Synchrone (REST/JSON) entre Front et Gateway.
    * Asynchrone (RabbitMQ) pour les événements métiers (ex: validation de commande -> notification).

## 3. Contraintes de Développement & Sécurité
* **Sécurité des Tokens :** Les JWT ne doivent **jamais** être stockés dans le `localStorage`. Utilisation de cookies `HttpOnly`, `Secure`, et `SameSite=Strict`.
* **Validation :** Utilisation systématique de `class-validator` et `class-transformer` côté Backend.
* **Base de données :** Utilisation du type `JSONB` pour les métadonnées de produits flexibles (films, BD, goodies).
* **Erreurs :** Gestion centralisée des exceptions via des filtres NestJS.

## 4. Spécifications Infrastructure (Kubernetes)
* **Orchestration :** Les déploiements doivent inclure :
    * `Probes` (Liveness & Readiness).
    * `Resources` (Limits & Requests).
    * `HPA` (Horizontal Pod Autoscaler) pour les services de streaming.
* **Réseau :** Services de type `ClusterIP`, exposition via un `Ingress Controller`.
* **Persistance :** Utilisation de `PersistentVolumeClaims` pour PostgreSQL et RabbitMQ.

## 5. Pipeline CI/CD (GitHub Actions)
Chaque micro-service doit posséder un workflow comprenant :
1.  **Linting & Tests :** Validation du code et tests unitaires.
2.  **Sécurité :** Scan de vulnérabilités via `npm audit`.
3.  **Build :** Création d'une image Docker multi-stage (optimisée).
4.  **Push :** Envoi vers la Registry.
5.  **Deploy :** Mise à jour du cluster Kubernetes.