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

The API starts at `http://localhost:8080`. Check it with `GET /api/health`.

## Package layout

- `config`: application and framework configuration
- `controller`: REST endpoints
- `dto`: request and response models
- `entity`: persistence models
- `exception`: API exception handling
- `repository`: data access
- `service`: application and business logic

Persistence dependencies are intentionally omitted until the database is selected.