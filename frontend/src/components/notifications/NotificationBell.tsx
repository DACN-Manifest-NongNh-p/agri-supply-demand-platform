import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./notifications.css";

/** One notification: what is wrong, one line of facts, and where to fix it. */
export type Notice = {
  id: string;
  tone: "urgent" | "warning" | "info";
  title: string;
  detail: string;
  link: { label: string; to: string };
};

type Props = {
  items: Notice[];
  /** Persist dismissals in the caller; without it the bell remembers them itself. */
  onDismiss?: (id: string) => void;
  /** Which side the panel lines up with: "right" under a top bar, "left" from a sidebar. */
  align?: "left" | "right";
};

/** Bell with a count; notifications open in a panel under it. Shared by every role's area. */
export function NotificationBell({ items, onDismiss, align = "right" }: Props) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const shown = onDismiss ? items : items.filter((item) => !hidden.has(item.id));
  const urgent = shown.filter((item) => item.tone === "urgent").length;

  const dismiss = (id: string) => {
    if (onDismiss) onDismiss(id);
    else setHidden((current) => new Set(current).add(id));
  };

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="nb" ref={rootRef}>
      <button
        type="button"
        className="nb-button"
        aria-label={`Notifications, ${shown.length} open`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} />
        {shown.length > 0 && <span className={urgent > 0 ? "nb-count is-urgent" : "nb-count"}>{shown.length}</span>}
      </button>

      {open && (
        <div className={`nb-panel nb-panel--${align}`} role="dialog" aria-label="Notifications">
          <div className="nb-head">
            <strong>Notifications</strong>
            {shown.length > 0 && <small>{urgent > 0 ? `${urgent} urgent · ${shown.length} open` : `${shown.length} open`}</small>}
          </div>

          {shown.length === 0 ? (
            <p className="nb-empty">You're all caught up.</p>
          ) : (
            <ul className="nb-list">
              {shown.map((item) => (
                <li key={item.id} className={`nb-item nb-item--${item.tone}`}>
                  <button
                    type="button"
                    className="nb-main"
                    onClick={() => {
                      setOpen(false);
                      navigate(item.link.to);
                    }}
                  >
                    <span className="nb-dot" aria-hidden="true" />
                    <span className="nb-text">
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                      <em>{item.link.label} →</em>
                    </span>
                  </button>
                  <button type="button" className="nb-dismiss" aria-label={`Dismiss: ${item.title}`} title="Dismiss" onClick={() => dismiss(item.id)}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
