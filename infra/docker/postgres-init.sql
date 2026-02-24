-- Création de la base de données et de l'utilisateur pour Keycloak
CREATE USER keycloak WITH PASSWORD 'changeme_keycloak';
CREATE DATABASE keycloak OWNER keycloak;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;
