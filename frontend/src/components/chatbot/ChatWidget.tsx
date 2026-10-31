import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Bot, MessageCircle, MousePointer2, Send, Square, Trash2, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AUTH_CALLBACK_PATH } from "@/lib/keycloak";
import { loadMessages, newMessage, resetMessages, saveMessages, suggestionsFor, type ChatMessage } from "./chatStore";
import { looksLikeCommand, runCommands } from "./agent/commands";
import { hideBadges, hideCursor } from "./agent/cursor";
import "./chatbot.css";

/** Sign-in screens have nothing for the assistant to do. */
const HIDDEN_ON = ["/login", "/signup", AUTH_CALLBACK_PATH];

/**
 * Assistant bubble in the bottom-right corner. Opened, it becomes a panel along the right edge
 * (a quarter of the width) and the page shrinks beside it, so what the assistant does stays visible.
 * Mounted once at the app root, so the conversation survives route changes.
 */
export function ChatWidget() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const runRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hidden = HIDDEN_ON.includes(pathname);
  const shown = open && !hidden;

  useEffect(() => saveMessages(messages), [messages]);

  // The page makes room for the panel (see html.chat-open in chatbot.css).
  useEffect(() => {
    document.documentElement.classList.toggle("chat-open", shown);
    return () => document.documentElement.classList.remove("chat-open");
  }, [shown]);

  useEffect(() => {
    if (shown) inputRef.current?.focus();
  }, [shown]);

  // Keep the newest message in view.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, shown]);

  useEffect(() => () => runRef.current?.abort(), []);

  if (hidden) return null;

  const log = (role: ChatMessage["role"], text: string) => setMessages((current) => [...current, newMessage(role, text)]);

  const send = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || busy) return;
    log("user", prompt);
    setDraft("");
    if (!looksLikeCommand(prompt)) {
      log("assistant", 'I only understand commands until the AI is connected. Type "help" to see them.');
      return;
    }
    const run = new AbortController();
    runRef.current = run;
    setBusy(true);
    hideBadges();
    try {
      await runCommands(prompt, { navigate, signal: run.signal }, log);
    } catch (error) {
      if (!run.signal.aborted) log("assistant", error instanceof Error ? error.message : String(error));
    } finally {
      if (runRef.current === run) runRef.current = null;
      setBusy(false);
      hideCursor();
    }
  };

  const stop = () => {
    runRef.current?.abort();
    log("action", "Stopped.");
  };

  const clear = () => {
    runRef.current?.abort();
    hideBadges();
    setMessages(resetMessages());
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(draft);
  };

  // Enter sends, Shift+Enter starts a new line.
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(draft);
    }
  };

  if (!shown) {
    return (
      <button type="button" className="cw-bubble" aria-label="Open assistant" onClick={() => setOpen(true)}>
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <aside
      className="cw-panel"
      aria-label="Assistant"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <header className="cw-head">
        <span className="cw-avatar">
          <Bot size={18} />
        </span>
        <div className="cw-title">
          <strong>Farm assistant</strong>
          <small>{busy ? "Working…" : "Ready"}</small>
        </div>
        {busy && (
          <button type="button" className="cw-icon cw-icon--stop" aria-label="Stop" title="Stop" onClick={stop}>
            <Square size={14} />
          </button>
        )}
        <button type="button" className="cw-icon" aria-label="Clear chat" title="Clear chat" onClick={clear}>
          <Trash2 size={16} />
        </button>
        <button type="button" className="cw-icon" aria-label="Close assistant" title="Close" onClick={() => setOpen(false)}>
          <X size={18} />
        </button>
      </header>

      <div className="cw-list" ref={listRef} aria-live="polite">
        {messages.map((message) =>
          message.role === "action" ? (
            <p key={message.id} className="cw-action">
              <MousePointer2 size={12} />
              {message.text}
            </p>
          ) : (
            <p key={message.id} className={`cw-msg cw-msg--${message.role}`}>
              {message.text}
            </p>
          ),
        )}
        {busy && (
          <p className="cw-msg cw-msg--assistant cw-typing" aria-label="Assistant is typing">
            <span />
            <span />
            <span />
          </p>
        )}
      </div>

      <div className="cw-chips">
        {suggestionsFor(pathname).map((text) => (
          <button key={text} type="button" className="cw-chip" disabled={busy} onClick={() => send(text)}>
            {text}
          </button>
        ))}
      </div>

      <form className="cw-form" onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          className="cw-input"
          rows={1}
          placeholder="Ask me to do something…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className="cw-send" aria-label="Send" disabled={busy || !draft.trim()}>
          <Send size={16} />
        </button>
      </form>
    </aside>
  );
}
