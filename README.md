# Agri Supply-Demand Platform

Farmora is a React SPA backed by a Spring Boot API. Keycloak provides identity, login, registration, password reset, and account-type selection.

## Handover docs

- [Authentication architecture and request flow](docs/auth/README.md)
- [Local setup, ports, and run instructions](docs/setup/README.md)

## Main folders

- `frontend/`: React, Vite, and the Keycloak JavaScript adapter
- `backend/`: Spring Boot REST API and Keycloak JWT validation
- `docker/keycloak/`: realm import, user-profile configuration, and Farmora login theme
- `compose.yml`: local Keycloak and PostgreSQL services