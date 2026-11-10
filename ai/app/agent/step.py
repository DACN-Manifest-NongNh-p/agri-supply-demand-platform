"""Agent turns that act on the page. The browser runs the page actions, so a turn is a series of
round trips: each /agent/step call returns either actions for the browser or the final answer.

    start:    message + page snapshot           → actions | answer
    continue: turn_id + action results + page   → actions | answer
"""
import logging

from google.genai import types

from app.agent import sessions
from app.agent.loop import AgentError, _cited, _history, get_client
from app.agent.prompts import agent_prompt
from app.agent.tools import AGENT_TOOLS, BROWSER_TOOLS, run_tool
from app.config import get_settings

log = logging.getLogger(__name__)

# Page actions per turn, and model calls per round trip (searches and plans run here).
MAX_BROWSER_STEPS = 15
MAX_SERVER_CALLS = 6
# A big page is cut so the prompt stays small; the agent can scroll for more.
MAX_PAGE_CHARS = 8000


def _page(page: str) -> str:
    page = page.strip()
    if len(page) > MAX_PAGE_CHARS:
        page = page[:MAX_PAGE_CHARS] + "\n… (còn nữa, cuộn trang để xem thêm)"
    return f"Ảnh chụp trang hiện tại:\n{page}" if page else "Ảnh chụp trang: (trống)"


def _response_part(call_id: str | None, name: str, response: dict) -> types.Part:
    return types.Part(function_response=types.FunctionResponse(id=call_id, name=name, response=response))


def start_turn(user: str, role: str | None, message: str, history: list[dict], page: str) -> dict:
    prompt = types.Content(role="user", parts=[types.Part.from_text(text=f"{message}\n\n{_page(page)}")])
    turn = sessions.start(user, role, [*_history(history), prompt])
    return _advance(turn)


def continue_turn(user: str, turn_id: str, results: list[dict], page: str) -> dict:
    turn = sessions.resume(turn_id, user)
    if turn is None:
        raise AgentError("This assistant turn has expired; ask again.")
    if not turn.pending:
        raise AgentError("This turn is not waiting for page results.")

    browser_slots = [slot for slot in turn.pending if isinstance(slot, tuple)]
    replies: dict[int, types.Part] = {}
    for index, slot in enumerate(browser_slots):
        result = results[index] if index < len(results) else {"ok": False, "error": "skipped"}
        response = {key: value for key, value in result.items() if key in ("ok", "summary", "error")}
        if index == len(browser_slots) - 1:
            # The page as it is now goes with the last result, so the model's next refs are current.
            response["page"] = _page(page)
        replies[id(slot)] = _response_part(slot[0], slot[1], response)
    # Every call of the model's last reply is answered in one message, in call order.
    parts = [replies[id(slot)] if isinstance(slot, tuple) else slot for slot in turn.pending]
    turn.contents.append(types.Content(role="user", parts=parts))
    turn.pending = []
    return _advance(turn)


def _advance(turn: sessions.Turn) -> dict:
    settings = get_settings()
    client = get_client()

    for _ in range(MAX_SERVER_CALLS):
        out_of_steps = turn.browser_steps >= MAX_BROWSER_STEPS
        config = types.GenerateContentConfig(
            system_instruction=agent_prompt(turn.role),
            # Out of page actions: no tools, so the model has to answer.
            tools=None if out_of_steps else AGENT_TOOLS,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            temperature=0.2,
        )
        try:
            response = client.models.generate_content(model=settings.gemini_model, contents=turn.contents, config=config)
        except Exception as error:  # the SDK raises several error types for API failures
            sessions.finish(turn.id)
            raise AgentError(f"Gemini request failed: {error}") from error

        calls = response.function_calls or []
        if not calls:
            sessions.finish(turn.id)
            answer = (response.text or "").strip()
            return {"type": "answer", "turn_id": turn.id, "answer": answer, "sources": _cited(answer, turn.book), "plan": turn.plan}

        content = response.candidates[0].content
        turn.contents.append(content)
        slots: list[types.Part | tuple[str | None, str]] = []
        browser_calls = []
        for call in calls:
            args = dict(call.args or {})
            log.info("Tool %s %s", call.name, args)
            if call.name in BROWSER_TOOLS:
                slots.append((call.id, call.name))
                browser_calls.append({"name": call.name, "args": args})
                continue
            if call.name == "plan":
                turn.plan = [str(step) for step in args.get("steps") or []][:6]
                result = {"ok": True}
            else:
                result = run_tool(call.name, args, turn.role, turn.book)
            slots.append(_response_part(call.id, call.name, result))

        if not browser_calls:
            turn.contents.append(types.Content(role="user", parts=slots))
            continue

        # Answered once the browser sends its results (continue_turn).
        turn.pending = slots
        turn.browser_steps += len(browser_calls)
        narration = " ".join(part.text.strip() for part in content.parts or [] if part.text and not part.thought)
        return {"type": "actions", "turn_id": turn.id, "actions": browser_calls, "plan": turn.plan, "narration": narration}

    sessions.finish(turn.id)
    raise AgentError("The assistant kept calling tools without answering.")
