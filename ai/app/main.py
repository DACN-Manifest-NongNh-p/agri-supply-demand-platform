"""Farmora AI service. Called by the Spring Boot API only, never by the browser directly."""
import logging
from typing import Literal

from elasticsearch import ConnectionError as ESConnectionError
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.agent.loop import AgentError, run_chat
from app.agent.step import continue_turn, start_turn
from app.config import get_settings
from app.es import get_es
from app.ingest.pipeline import run_ingest
from app.retrieval.search import search

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

app = FastAPI(title="Farmora AI service")

Role = Literal["public", "producer", "buyer", "coordinator", "logistics", "admin"]


@app.get("/health")
def health():
    """Up only when Elasticsearch answers; also says whether the knowledge index exists yet."""
    settings = get_settings()
    es = get_es()
    try:
        cluster = es.cluster.health()
        indexed = bool(es.indices.exists_alias(name=settings.es_index))
    except ESConnectionError:
        return JSONResponse(status_code=503, content={"status": "down", "elasticsearch": "unreachable"})
    return {
        "status": "ok",
        "elasticsearch": cluster["status"],
        "index": settings.es_index,
        "indexed": indexed,
        "embedding_model": settings.embedding_model,
        "gemini_model": settings.gemini_model,
        "gemini_configured": bool(settings.gemini_api_key),
    }


@app.post("/ingest")
def ingest():
    """Rebuild the policy index from docs/policy. Call again after editing a policy or a rule."""
    try:
        return run_ingest()
    except ValueError as error:
        # A malformed policy file: say which one instead of a bare 500.
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.get("/search")
def search_policies(
    q: str = Query(min_length=2, description="The user's question"),
    role: Role | None = Query(default=None, description="Caller's role; limits which documents can match"),
    k: int = Query(default=5, ge=1, le=20),
):
    if not get_es().indices.exists_alias(name=get_settings().es_index):
        raise HTTPException(status_code=409, detail="Index not built yet; POST /ingest first.")
    return {"query": q, "role": role, "results": search(q, role, k)}


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = []
    # Set by the Spring API from the caller's token, never taken from the browser as-is.
    role: Role | None = None


@app.post("/chat")
def chat(request: ChatRequest):
    """One assistant turn: searches the policies as needed and answers with [n] citations."""
    try:
        return run_chat(request.message, [message.model_dump() for message in request.history], request.role)
    except AgentError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


class ActionResult(BaseModel):
    ok: bool
    summary: str = ""
    error: str | None = None


class AgentStepRequest(BaseModel):
    # Set by the Spring API from the caller's token: turns belong to one user.
    user: str = Field(min_length=1)
    role: Role | None = None
    # A new turn sends message (+ history); a continuing one sends turn_id + results.
    message: str | None = Field(default=None, max_length=2000)
    history: list[ChatMessage] = []
    turn_id: str | None = None
    results: list[ActionResult] = []
    # formatSnapshot() of the page as it is now.
    page: str = Field(default="", max_length=40000)


@app.post("/agent/step")
def agent_step(request: AgentStepRequest):
    """One round trip of an agent turn: returns page actions for the browser to run, or the answer."""
    try:
        if request.turn_id:
            return continue_turn(request.user, request.turn_id, [r.model_dump() for r in request.results], request.page)
        if not request.message:
            raise HTTPException(status_code=422, detail="Send a message to start a turn, or a turn_id to continue one.")
        history = [message.model_dump() for message in request.history]
        return start_turn(request.user, request.role, request.message, history, request.page)
    except AgentError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
