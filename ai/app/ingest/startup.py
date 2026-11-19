"""Builds the index when the service starts, so a fresh checkout only needs `docker compose up`.

Runs in a background thread: the API answers /health at once, and /health reports how it went.
"""
import logging
import threading
import time

from elasticsearch import ConnectionError as ESConnectionError

from app.config import get_settings
from app.es import get_es
from app.ingest.pipeline import run_ingest

log = logging.getLogger(__name__)

# Elasticsearch may still be starting (compose waits for it, a host run may not).
ES_WAIT_SECONDS = 180

status: dict = {"state": "off"}


def _wait_for_es() -> bool:
    deadline = time.monotonic() + ES_WAIT_SECONDS
    while time.monotonic() < deadline:
        try:
            get_es().cluster.health(wait_for_status="yellow", timeout="5s")
            return True
        except ESConnectionError:
            time.sleep(3)
    return False


def _run(mode: str) -> None:
    status.update(state="waiting for elasticsearch")
    if not _wait_for_es():
        status.update(state="failed", error=f"Elasticsearch not reachable after {ES_WAIT_SECONDS} s")
        log.error("Auto-ingest: %s", status["error"])
        return
    if mode == "missing" and get_es().indices.exists_alias(name=get_settings().es_index):
        status.update(state="skipped", reason="index already exists")
        return
    status.update(state="running", started_at=time.time())
    try:
        status.update(state="done", result=run_ingest())
    except Exception as error:  # a bad policy file or the model download; the API keeps running
        status.update(state="failed", error=str(error))
        log.exception("Auto-ingest failed")


def start_auto_ingest() -> None:
    mode = get_settings().auto_ingest
    if mode == "off":
        return
    threading.Thread(target=_run, args=(mode,), name="auto-ingest", daemon=True).start()
