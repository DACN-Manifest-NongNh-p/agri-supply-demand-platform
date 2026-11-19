import { useEffect, useState } from "react";
import { ArrowRight, ChevronRight, ClipboardList, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { QueueGroup, QueueItem } from "../data/queue";

const STORAGE_KEY = "farmora-coordinator-needs-open";

/** Where each kind of work is handled, and how to name several of it. */
const GROUPS: { id: QueueGroup; label: string; many: string; to: string }[] = [
  { id: "gap", label: "No supply", many: "demands with no supply", to: "/coordinator/matching?tab=gaps" },
  { id: "delivery", label: "Delivery problem", many: "delivery problems", to: "/coordinator/deliveries" },
  { id: "hold", label: "Hold expiring", many: "holds about to lapse", to: "/coordinator/matching?tab=holds" },
  { id: "decision", label: "Needs your decision", many: "matches to decide", to: "/coordinator/matching" },
  { id: "request", label: "Requests", many: "open requests", to: "/coordinator/requests" },
];

type Row = { id: string; tone: QueueItem["tone"]; label: string; title: string; caption: string; to: string };

function remember(open: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {
    // Not remembered on this browser; the panel still works.
  }
}

function readOpen() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function Item({ row }: { row: Row }) {
  return (
    <li>
      <Link to={row.to} className="co-needs-row">
        <span className={`co-needs-dot co-needs-dot--${row.tone}`} aria-hidden="true" />
        <span className="co-needs-text">
          <span className="co-needs-title">{row.title}</span>
          <span className="co-needs-caption">
            {row.label} · {row.caption}
          </span>
        </span>
        <ChevronRight size={16} className="co-needs-go" aria-hidden="true" />
      </Link>
    </li>
  );
}

/**
 * What waits on the coordinator, behind a button on the map so the map stays clear. Urgent items
 * are listed one by one; the rest fold into one row per kind of work. The open/closed choice is
 * remembered on this browser.
 */
export function NeedsPanel({ items, greeting }: { items: QueueItem[]; greeting: string }) {
  const [open, setOpen] = useState(readOpen);
  const urgentCount = items.filter((item) => item.tone === "urgent").length;

  const toggle = (next: boolean) => {
    setOpen(next);
    remember(next);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      remember(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const urgent: Row[] = items
    .filter((item) => item.tone === "urgent")
    .map((item) => ({ id: item.id, tone: item.tone, label: item.label, title: item.title, caption: item.caption, to: item.link.to }));
  const rest: Row[] = GROUPS.flatMap((group) => {
    const list = items.filter((item) => item.tone !== "urgent" && item.group === group.id);
    if (list.length === 0) return [];
    if (list.length === 1) {
      const [item] = list;
      return [{ id: item.id, tone: item.tone, label: item.label, title: item.title, caption: item.caption, to: item.link.to }];
    }
    const tone = list.some((item) => item.tone === "warning") ? "warning" : "info";
    return [{ id: group.id, tone, label: group.label, title: `${list.length} ${group.many}`, caption: list.map((item) => item.title).join(" · "), to: group.to }];
  });

  if (!open) {
    return (
      <button type="button" className="co-needs-toggle" aria-expanded={false} aria-controls="co-needs" onClick={() => toggle(true)}>
        <ClipboardList size={16} aria-hidden="true" />
        {items.length === 0 ? "All clear" : `${items.length} things need you`}
        {urgentCount > 0 && <span className="co-needs-badge">{urgentCount} urgent</span>}
      </button>
    );
  }

  return (
    <aside className="co-needs" id="co-needs" aria-labelledby="co-needs-title">
      <header className="co-needs-head">
        <div>
          <p>{greeting}</p>
          <h2 id="co-needs-title">
            {items.length === 0 ? "All clear" : `${items.length} things need you`}
          </h2>
        </div>
        <button type="button" className="co-needs-close" aria-label="Hide the list" title="Hide (Esc)" onClick={() => toggle(false)}>
          <X size={18} />
        </button>
      </header>

      {items.length === 0 ? (
        <p className="co-needs-empty">Nothing is waiting on you right now.</p>
      ) : (
        <div className="co-needs-body">
          {urgent.length > 0 && (
            <section aria-label="Urgent">
              <p className="co-needs-group co-needs-group--urgent">Urgent · {urgent.length}</p>
              <ul>
                {urgent.map((row) => (
                  <Item key={row.id} row={row} />
                ))}
              </ul>
            </section>
          )}
          {rest.length > 0 && (
            <section aria-label="To do">
              <p className="co-needs-group">To do · {rest.length}</p>
              <ul>
                {rest.map((row) => (
                  <Item key={row.id} row={row} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <Link to="/coordinator/matching" className="co-needs-cta">
        Open matching <ArrowRight size={15} />
      </Link>
    </aside>
  );
}
