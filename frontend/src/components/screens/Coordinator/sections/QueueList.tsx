import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { QueueGroup, QueueItem } from "../data/queue";

/** Where each kind of work is handled, and how to name several of it. Order is the order shown. */
const GROUPS: { id: QueueGroup; label: string; many: string; to: string }[] = [
  { id: "gap", label: "No supply", many: "demands with no supply", to: "/coordinator/matching?tab=gaps" },
  { id: "delivery", label: "Delivery problem", many: "delivery problems", to: "/coordinator/deliveries" },
  { id: "hold", label: "Hold expiring", many: "holds about to lapse", to: "/coordinator/matching?tab=holds" },
  { id: "decision", label: "Needs your decision", many: "matches to decide", to: "/coordinator/matching" },
  { id: "request", label: "Requests", many: "open requests", to: "/coordinator/requests" },
];

type Row = { id: string; urgent: boolean; label: string; title: string; caption: string; to: string };

function QueueRow({ row }: { row: Row }) {
  return (
    <li>
      <Link to={row.to} className={row.urgent ? "co-queue-row co-queue-row--urgent" : "co-queue-row"}>
        <span className="co-queue-meta">{row.urgent ? `${row.label} · urgent` : row.label}</span>
        <span className="co-queue-title">{row.title}</span>
        <span className="co-queue-caption">{row.caption}</span>
        <ChevronRight size={16} className="co-queue-go" aria-hidden="true" />
      </Link>
    </li>
  );
}

/**
 * Everything waiting on the coordinator. Urgent items are listed one by one; the rest are folded
 * into one row per kind of work, so the panel stays readable when a lot is going on.
 */
export function QueueList({ items }: { items: QueueItem[] }) {
  if (items.length === 0) return <p className="co-queue-empty">Nothing is waiting on you right now.</p>;

  const urgent: Row[] = items
    .filter((item) => item.tone === "urgent")
    .map((item) => ({ id: item.id, urgent: true, label: item.label, title: item.title, caption: item.caption, to: item.link.to }));

  const grouped: Row[] = GROUPS.flatMap((group) => {
    const list = items.filter((item) => item.tone !== "urgent" && item.group === group.id);
    if (list.length === 0) return [];
    if (list.length === 1) {
      const [item] = list;
      return [{ id: item.id, urgent: false, label: item.label, title: item.title, caption: item.caption, to: item.link.to }];
    }
    return [{ id: group.id, urgent: false, label: group.label, title: `${list.length} ${group.many}`, caption: list.map((item) => item.title).join(" · "), to: group.to }];
  });

  return (
    <ul className="co-queue">
      {[...urgent, ...grouped].map((row) => (
        <QueueRow key={row.id} row={row} />
      ))}
    </ul>
  );
}
