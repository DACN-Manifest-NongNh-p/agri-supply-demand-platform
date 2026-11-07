# Farmora AI service

Python (FastAPI) service behind the Spring Boot API: builds the knowledge index the assistant answers
from, searches it, and (later) runs the Gemini agent. The browser never calls it directly — Spring
checks the Keycloak token and forwards.

```
Frontend chat ─▶ Spring Boot (JWT, rate limit, user role) ─▶ ai service ─▶ Elasticsearch
                                                                     └─▶ Gemini
```

## Layout

| Path | Purpose |
|---|---|
| `app/main.py` | FastAPI app and endpoints (`/health` now; `/ingest`, `/search`, `/chat` next) |
| `app/config.py` | Settings from environment variables |
| `app/es.py` | Shared Elasticsearch client |
| `app/ingest/` | Knowledge pipeline: load → chunk → embed → index |
| `app/retrieval/` | Hybrid search filtered by role |
| `app/agent/` | Gemini prompts, tools and tool-calling loop |
| `eval/` | Question set for measuring retrieval and answers |

What goes where: written guides and policies are indexed here. Numbers an admin can change
(operating rules) are read live from the API when answering, and per-user data (orders, bids) is
never indexed — the agent reads it through API tools.

## Run with Docker

From the repository root (add `GEMINI_API_KEY` to `.env` first, copied from `.env.example`):

```bash
docker compose up -d --build elasticsearch ai
curl http://localhost:8000/health
```

Elasticsearch is on `http://localhost:9200`. To browse it in Kibana: `docker compose --profile dev up -d kibana`,
then open `http://localhost:5601`.

## Run on the host

```bash
cd ai
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Elasticsearch still runs in Docker (`docker compose up -d elasticsearch`).
