"""One chat turn: the model may search the policies a few times, then answers with [n] citations."""
import logging
import re
from functools import lru_cache

from google import genai
from google.genai import types

from app.agent.prompts import system_prompt
from app.agent.tools import TOOLS, SourceBook, run_tool
from app.config import get_settings

log = logging.getLogger(__name__)

# Tool calls allowed per turn before the model must answer.
MAX_STEPS = 4
# Earlier messages sent along for context.
HISTORY_LIMIT = 10


class AgentError(Exception):
    pass


@lru_cache
def get_client() -> genai.Client:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise AgentError("GEMINI_API_KEY is not set (ai/.env).")
    # Without a timeout an overloaded model can hold the request for minutes.
    return genai.Client(api_key=settings.gemini_api_key, http_options=types.HttpOptions(timeout=60_000))


def _history(messages: list[dict]) -> list[types.Content]:
    return [
        types.Content(role="model" if message["role"] == "assistant" else "user", parts=[types.Part.from_text(text=message["text"])])
        for message in messages[-HISTORY_LIMIT:]
        if message.get("text")
    ]


def run_chat(message: str, history: list[dict], role: str | None) -> dict:
    settings = get_settings()
    client = get_client()
    book = SourceBook()
    contents = [*_history(history), types.Content(role="user", parts=[types.Part.from_text(text=message)])]
    config = types.GenerateContentConfig(
        system_instruction=system_prompt(role),
        tools=TOOLS,
        # Tools are run here, not by the SDK, so each call can be limited and logged.
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        temperature=0.2,
    )
    searches: list[str] = []

    for step in range(MAX_STEPS + 1):
        if step == MAX_STEPS:
            # Out of tool calls: ask for an answer from what was found.
            config = config.model_copy(update={"tools": None})
        try:
            response = client.models.generate_content(model=settings.gemini_model, contents=contents, config=config)
        except Exception as error:  # the SDK raises several error types for API failures
            raise AgentError(f"Gemini request failed: {error}") from error

        calls = response.function_calls or []
        if not calls:
            answer = (response.text or "").strip()
            return {"answer": answer, "sources": _cited(answer, book), "searches": searches, "model": settings.gemini_model}

        contents.append(response.candidates[0].content)
        results = []
        for call in calls:
            args = dict(call.args or {})
            if call.name == "search_policy":
                searches.append(str(args.get("query", "")))
            log.info("Tool %s %s", call.name, args)
            results.append(types.Part.from_function_response(name=call.name, response=run_tool(call.name, args, role, book)))
        contents.append(types.Content(role="user", parts=results))

    raise AgentError("No answer after the tool-call limit.")


def _cited(answer: str, book: SourceBook) -> list[dict]:
    """Sources the answer actually cites, in the order they were numbered."""
    # Models write both [1][2] and [1, 2].
    cited = {int(n) for group in re.findall(r"\[(\d+(?:\s*,\s*\d+)*)\]", answer) for n in re.findall(r"\d+", group)}
    return [source for source in book.sources if source["n"] in cited]
