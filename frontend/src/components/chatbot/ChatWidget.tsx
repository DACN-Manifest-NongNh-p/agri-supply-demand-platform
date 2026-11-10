import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Bot, Check, Circle, LoaderCircle, MessageCircle, MousePointer2, Send, Square, Trash2, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "@/lib/api";
import { AUTH_CALLBACK_PATH, isKeycloakAuthenticated } from "@/lib/keycloak";
import { historyFor, loadMessages, newMessage, resetMessages, saveMessages, suggestionsFor, type ChatMessage, type ChatSource } from "./chatStore";
import { looksLikeCommand, runCommands } from "./agent/commands";
import { hideBadges, hideCursor } from "./agent/cursor";
import { runAgentTurn } from "./agent/runner";
import { RichText } from "./RichText";
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

  const log = (role: ChatMessage["role"], text: string, sources?: ChatSource[]) =>
    setMessages((current) => [...current, newMessage(role, text, sources)]);

  const send = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || busy) return;
    // Taken before this question is added, so it is not sent twice.
    const history = historyFor(messages);
    log("user", prompt);
    setDraft("");
    const command = looksLikeCommand(prompt);
    if (!command && !isKeycloakAuthenticated()) {
      log("action", "Đăng nhập để hỏi trợ lý.");
      return;
    }
    const run = new AbortController();
    runRef.current = run;
    setBusy(true);
    hideBadges();
    try {
      if (command) {
        // Typed page commands (help, read, click…) for testing the page actions.
        await runCommands(prompt, { navigate, signal: run.signal }, log);
      } else {
        // The assistant may answer straight away or work the page first (agent/runner.ts).
        const planId = newMessage("plan", "").id;
        const reply = await runAgentTurn(prompt, history, { navigate, signal: run.signal }, {
          onAction: (summary) => log("action", summary),
          onNarration: (text) => log("action", text),
          onPlan: (steps, current) => {
            if (!steps.length) return;
            setMessages((list) =>
              list.some((message) => message.id === planId)
                ? list.map((message) => (message.id === planId ? { ...message, plan: { steps, current } } : message))
                : [...list, { id: planId, role: "plan", text: "", plan: { steps, current } }],
            );
          },
        });
        log("assistant", reply.answer, reply.sources);
      }
    } catch (error) {
      if (run.signal.aborted) return;
      // Errors are status lines, not answers, so they never go back to the model as history.
      if (error instanceof ApiError) log("action", error.message);
      else if (error instanceof TypeError) log("action", "Không kết nối được máy chủ. Thử lại sau.");
      else log(command ? "assistant" : "action", error instanceof Error ? error.message : String(error));
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
          message.role === "plan" && message.plan ? (
            <ol key={message.id} className="cw-plan" aria-label="Kế hoạch">
              {message.plan.steps.map((step, index) => {
                const state = index + 1 < message.plan!.current ? "done" : index + 1 === message.plan!.current ? "now" : "todo";
                return (
                  <li key={index} className={`cw-plan-step is-${state}`}>
                    {state === "done" ? <Check size={14} /> : state === "now" ? <LoaderCircle size={14} className="cw-spin" /> : <Circle size={14} />}
                    <span>{step}</span>
                  </li>
                );
              })}
            </ol>
          ) : message.role === "action" ? (
            <p key={message.id} className="cw-action">
              <MousePointer2 size={12} />
              {message.text}
            </p>
          ) : message.role === "assistant" ? (
            <div key={message.id} className="cw-msg cw-msg--assistant">
              <RichText text={message.text} />
              {message.sources && (
                <details className="cw-sources">
                  <summary>Nguồn ({message.sources.length})</summary>
                  <ol>
                    {message.sources.map((source) => (
                      <li key={source.n} value={source.n} title={source.text}>
                        {source.headingPath}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
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
          placeholder="Hỏi về quy định của Farmora…"
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
