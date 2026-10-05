# Local Setup and Run

Use this guide to run the React app, Spring Boot API, and local Keycloak stack on Windows/PowerShell.

## Requirements

- Docker Desktop using Linux containers, with Docker Compose available
- JDK 21
- Maven 3.9+
- Node.js supported by the installed Vite 8 release (Node 20.19+ or 22.12+)

## 1. Configure local environment

From the repository root, copy the example files once:

```powershell
Copy-Item .env.example .env
Copy-Item frontend/.env.example frontend/.env.local
```

The examples use local-only defaults. `.env` configures Keycloak/PostgreSQL; `frontend/.env.local` configures the Keycloak URL, realm, client ID, and API URL. Do not commit real secrets or expose the default admin credentials outside local development.

## 2. Start Keycloak and PostgreSQL

From the repository root:

```powershell
docker compose up -d
docker compose ps
```

Wait until `keycloak-db` is `healthy` and `keycloak` is `Up`. On first startup, Keycloak imports `docker/keycloak/realms/agri-platform-realm.json`. Open the admin console at `http://localhost:8081/admin`; default local credentials are `admin` / `admin` unless overridden in `.env`.

### Apply the registration account-type field

Keycloak stores User Profile configuration separately from the realm import JSON. Apply `account_type` once after the realm exists:

```powershell
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh update users/profile -r agri-platform -f /opt/keycloak/user-profile.json
```

If `KEYCLOAK_ADMIN` or `KEYCLOAK_ADMIN_PASSWORD` differs in `.env`, substitute those values in the credentials command. The profile JSON is mounted separately at `/opt/keycloak/user-profile.json`; it is intentionally outside the realm-import folder.

The login theme and realm/client are imported from files. Because the Keycloak database persists, editing the realm import JSON does not overwrite an existing realm. Use the Admin Console or `kcadm.sh` for live realm changes. The theme directory is mounted with caching disabled for local development, so CSS/JS edits can be checked by refreshing the browser.

## 3. Start the Spring Boot API

Open a terminal at `backend/` and run:

```powershell
mvn spring-boot:run
```

The API listens on `http://localhost:8082`. Verify its public health endpoint from another terminal:

```powershell
Invoke-RestMethod http://localhost:8082/api/health
```

Expected response:

```json
{"status":"UP"}
```

Port `8080` is not the host API port: it is Keycloak's port inside the Docker network. The machine running this project already had another process on host `8080`, so the Spring API is configured for `8082`. Keep `VITE_API_URL` and `server.port` in sync if changing it.

## 4. Start the React frontend

Open another terminal at `frontend/`:

```powershell
npm install
npm run dev
```

Vite uses strict port `5173`; open `http://localhost:5173`. Keycloak's client only allows this redirect origin. If the port is occupied, stop the other Vite process rather than changing the port without also updating the client redirect URIs, web origins, and CORS origin.

From the landing page, **Log in** and **Sign Up** go directly to Keycloak. Registration includes the required Buyer / Producer / Logistics choice. Forgot Password uses Keycloak's reset flow; actual email delivery needs SMTP configuration.

## Ports

| Host port | Service | Notes |
| --- | --- | --- |
| `5173` | React / Vite | Keycloak redirect URI and backend CORS origin |
| `8081` | Keycloak | Docker maps host `8081` to container `8080` |
| `8082` | Spring Boot API | `server.port` in `backend/src/main/resources/application.yml` |
| `5432` | PostgreSQL | Internal to Compose; not published to the host |
| `8080` | Keycloak container port | Use `http://keycloak:8080` from sibling containers or `http://localhost:8081` from the host |

## Verify and stop

Useful checks from the repository root:

```powershell
docker compose config --quiet
docker compose ps
mvn -q -f backend/pom.xml test
```

Frontend checks from `frontend/`:

```powershell
npm run build
npm run lint
```

Stop services but keep the database volume with:

```powershell
docker compose down
```

`docker compose down -v` deletes the Keycloak PostgreSQL volume, including local users and realm state. Use it only when intentionally resetting local identity data; after re-importing the realm, apply `user-profile.json` again.

## Troubleshooting

- **Spring Whitelabel page at `localhost:8081`:** the request reached Spring instead of Keycloak. Confirm Compose maps `8081:8080` and do not set Spring to host port `8081`.
- **Backend fails with “Port already in use”:** check host port `8082`. The API is configured for `8082`; stop the process using that port or update both the backend and `VITE_API_URL`.
- **Keycloak login says invalid redirect URI:** use the Vite origin `http://localhost:5173`; update the `farmora-web` client if intentionally using another port.
- **Signup has no account-type choices:** apply the User Profile JSON using the kcadm commands above. Importing an existing realm does not automatically reapply it.
- **Forgot Password does not send an email:** configure SMTP under the realm's email settings; no local mail server is included.
- **API returns 401:** ensure the backend is running, initialize/login through the SPA, and call protected APIs through `apiFetch()` so it attaches a current Bearer token.