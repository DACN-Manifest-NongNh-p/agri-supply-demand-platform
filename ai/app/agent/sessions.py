"""Agent turns in progress, kept in memory between the browser's round trips.

A turn holds the Gemini conversation (function calls included, which the browser never sees) while
the page actions run. One process only: with several workers this would need a shared store.
"""
import secrets
import threading
import time
from dataclasses import dataclass, field

from google.genai import types

from app.agent.tools import SourceBook

TTL_SECONDS = 10 * 60


@dataclass
class Turn:
    id: str
    user: str
    role: str | None
    contents: list[types.Content]
    book: SourceBook = field(default_factory=SourceBook)
    # Replies owed for the model's last function calls, in call order: a finished Part for calls run
    # here, or (call id, name) for a browser call still waiting on its result.
    pending: list[types.Part | tuple[str | None, str]] = field(default_factory=list)
    browser_steps: int = 0
    plan: list[str] = field(default_factory=list)
    touched: float = field(default_factory=time.monotonic)


_turns: dict[str, Turn] = {}
_lock = threading.Lock()


def _expire(now: float) -> None:
    for turn_id in [key for key, turn in _turns.items() if now - turn.touched > TTL_SECONDS]:
        del _turns[turn_id]


def start(user: str, role: str | None, contents: list[types.Content]) -> Turn:
    with _lock:
        _expire(time.monotonic())
        turn = Turn(id=secrets.token_urlsafe(16), user=user, role=role, contents=contents)
        _turns[turn.id] = turn
        return turn


def resume(turn_id: str, user: str) -> Turn | None:
    """The turn, only for the user who started it."""
    with _lock:
        now = time.monotonic()
        _expire(now)
        turn = _turns.get(turn_id)
        if turn is None or turn.user != user:
            return None
        turn.touched = now
        return turn


def finish(turn_id: str) -> None:
    with _lock:
        _turns.pop(turn_id, None)
