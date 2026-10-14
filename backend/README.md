# Backend API

Spring Boot REST API for the agri supply-demand platform.

## Requirements

- JDK 21
- Maven 3.9+

## Run

From this directory:

```powershell
mvn spring-boot:run
```

The API starts at `http://localhost:8082`. Check it with `GET /api/health`.
Protected `/api/**` endpoints require a Keycloak access token. The local issuer defaults to `http://localhost:8081/realms/agri-platform`; override it with `KEYCLOAK_ISSUER_URI` when needed.

## Package layout

- `config`: application and framework configuration
- `controller`: REST endpoints
- `dto`: request and response models
- `entity`: persistence models
- `exception`: API exception handling
- `repository`: data access
- `service`: application and business logic

Persistence dependencies are intentionally omitted until the database is selected.