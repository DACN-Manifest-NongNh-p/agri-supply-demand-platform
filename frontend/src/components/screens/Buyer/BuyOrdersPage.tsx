// B3.3 Agricultural Order Matching, the main channel: the buyer's buy orders, the sessions they join,
// and the match results waiting for confirmation.
import { CalendarClock, Check, Inbox, Lock, Plus, Zap } from "lucide-react";
import { MatchingDemo } from "../LandingPage/sections/Demos";
import { Link, useSearchParams } from "react-router-dom";
import { useNow } from "@/components/orders/useNow";
import { GRADE_LABEL, ORDER_LABEL, SESSION_TYPE_LABEL } from "./model/catalog";
import { demoRunNextSession, orderLocked, pendingActions, upcomingSlot, useBuyerData } from "./model/store";
import { addDays, formatDate, formatDateRange, formatLeft, formatTime, slotsOn, todayIso } from "./model/time";
import type { BuyOrder } from "./model/types";
import { MatchCard } from "./sections/MatchCard";
import { PageHead, Pill } from "./ui/parts";
import { kg } from "./ui/format";
import { ORDER_TONE } from "./ui/tones";

type Tab = "live" | "matches" | "closed";

export function FillBar({ order }: { order: BuyOrder }) {
  const filled = order.requested - order.remaining;
  return (
    <span className="bf-fill" aria-label={`${kg(filled)} of ${kg(order.requested)} matched`}>
      <span className="bf-meter">
        <span style={{ width: `${(filled / order.requested) * 100}%` }} />
      </span>
      <small>
        {kg(filled)} / {kg(order.requested)}
      </small>
    </span>
  );
}

/** One line for the sessions: what comes next, today's three slots, and the demo shortcut. */
function dayName(date: string) {
  if (date === todayIso()) return "Today";
  if (date === addDays(todayIso(), 1)) return "Tomorrow";
  return formatDate(date);
}

/** The matching schedule in plain words: the next session, when orders close, and the day's three sessions. */
function SessionBar() {
  const now = useNow(1000);
  const data = useBuyerData();
  const slot = upcomingSlot(now, data);
  const ran = new Set(data.sessions.map((session) => session.code));
  const closed = now >= slot.cutoff;
  return (
    <div className="bo-session">
      <span className="bo-session-next">
        <CalendarClock size={18} aria-hidden="true" />
        <span>
          Next matching{" "}
          <strong>
            {dayName(slot.date)} {formatTime(slot.scheduled)}
          </strong>
          <small>{closed ? "Orders closed, matching now" : `Orders close at ${formatTime(slot.cutoff)} · in ${formatLeft(slot.cutoff - now)}`}</small>
        </span>
      </span>
      <ol className="bo-slots" aria-label={`${dayName(slot.date)}'s sessions`}>
        {slotsOn(slot.date).map((item) => {
          const done = ran.has(item.code);
          const next = item.code === slot.code;
          return (
            <li key={item.code} className={done ? "is-done" : next ? "is-next" : undefined}>
              <i aria-hidden="true">{done && <Check size={10} />}</i>
              <span>
                {SESSION_TYPE_LABEL[item.type]} {formatTime(item.scheduled)}
                <small>{done ? "Done" : next ? "Next" : "Later"}</small>
              </span>
            </li>
          );
        })}
      </ol>
      <button type="button" className="bo-demo" onClick={demoRunNextSession} title="Demo only: run an extra matching session now, outside the schedule">
        <Zap size={13} /> Match now (demo)
      </button>
    </div>
  );
}

function OrderRow({ order }: { order: BuyOrder }) {
  const now = useNow(5000);
  const data = useBuyerData();
  const live = order.status === "OPEN" || order.status === "PARTIALLY_FILLED";
  const locked = orderLocked(order, now);
  const filled = order.requested - order.remaining;
  const toConfirm = data.matches.some((match) => match.buyOrderCode === order.code && match.buyer === "PENDING" && ["PENDING_CONFIRMATION", "PARTIALLY_CONFIRMED"].includes(match.status));
  const to = `/buyer/orders/${order.code}`;
  return (
    <tr className={toConfirm ? "is-attention" : undefined}>
      <td>
        <Link to={to} className="at-product">
          <strong>
            {order.crop}
            {order.variety && ` · ${order.variety}`}
          </strong>
          <span>
            {GRADE_LABEL[order.grade]} or better · {order.code}
          </span>
        </Link>
      </td>
      <td className="at-num">
        <strong>{order.maxPrice.toLocaleString("en-GB")}</strong> <small>₫/kg</small>
      </td>
      <td className="at-plain">{formatDateRange(order.deliveryStart, order.deliveryEnd)}</td>
      <td>
        <span className="at-fill">
          <span className="bf-meter">
            <span style={{ width: `${(filled / order.requested) * 100}%` }} />
          </span>
          <small>
            {kg(filled)} / {kg(order.requested)}
          </small>
        </span>
      </td>
      <td>
        {locked ? (
          <span className="at-time is-later">
            <Lock size={12} aria-hidden="true" /> Locked
          </span>
        ) : (
          <Pill tone={ORDER_TONE[order.status]}>{ORDER_LABEL[order.status]}</Pill>
        )}
      </td>
      <td className="at-action">
        <Link to={toConfirm ? `${to}#matches-title` : to} className={toConfirm ? "ph-btn ph-btn--primary" : "ph-btn"}>
          {toConfirm ? "Confirm" : live ? "Manage" : "View"}
        </Link>
      </td>
    </tr>
  );
}

export default function BuyOrdersPage() {
  const data = useBuyerData();
  const [params, setParams] = useSearchParams();
  const tab = (["live", "matches", "closed"].includes(params.get("tab") ?? "") ? params.get("tab") : "live") as Tab;
  const pending = pendingActions(data);
  const live = data.buyOrders.filter((order) => order.status === "OPEN" || order.status === "PARTIALLY_FILLED");
  const closed = data.buyOrders.filter((order) => !live.includes(order));
  const matches = [...data.matches].sort((a, b) => Number(b.buyer === "PENDING") - Number(a.buyer === "PENDING") || b.matchedAt - a.matchedAt);
  const tabs: { id: Tab; label: string; count: number; alert?: boolean }[] = [
    { id: "live", label: "Open", count: live.length },
    { id: "matches", label: "To confirm", count: pending.matches.length, alert: true },
    { id: "closed", label: "Done", count: closed.length },
  ];
  const rows = tab === "live" ? live : closed;

  return (
    <main className="ph-main bf-page">
      <PageHead
        eyebrow="Order matching"
        title="Buy orders"
        demo={<MatchingDemo />}
        help="You set the most you will pay. At 08:00, 11:00 and 14:00 Farmora matches buy and sell orders, at one price for each product group, which can be lower than your maximum. Each match waits for you and the supplier to confirm; then it becomes a transaction. Unmatched quantity carries over to the next session while the order is valid."
        actions={
          <Link to="/buyer/orders/new" className="ph-btn ph-btn--primary ph-btn--large">
            <Plus size={18} /> Place a buy order
          </Link>
        }
      />

      <SessionBar />

      <section className="ph-card bo-panel">
        <div className="bo-tabs" role="tablist" aria-label="Show">
          {tabs.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setParams({ tab: item.id }, { replace: true })}>
              {item.label}
              {item.count > 0 && <span className={item.alert ? "ph-count-badge is-alert" : "ph-count-badge"}>{item.count}</span>}
            </button>
          ))}
        </div>

        {tab === "matches" ? (
          matches.length === 0 ? (
            <div className="bo-empty">
              <Inbox size={28} aria-hidden="true" />
              <p>Nothing to confirm. Results appear here after a session matches one of your orders.</p>
            </div>
          ) : (
            <ul className="bf-list bo-matches">
              {matches.map((match) => (
                <MatchCard key={match.code} match={match} />
              ))}
            </ul>
          )
        ) : rows.length === 0 ? (
          <div className="bo-empty">
            <Inbox size={28} aria-hidden="true" />
            <p>{tab === "live" ? "No open buy orders." : "Nothing filled or closed yet."}</p>
            {tab === "live" && (
              <Link to="/buyer/orders/new" className="ph-btn ph-btn--primary">
                <Plus size={16} /> Place a buy order
              </Link>
            )}
          </div>
        ) : (
          <div className="ph-table-scroll">
            <table className="at-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="at-num">Max price</th>
                  <th>Receive</th>
                  <th>Matched</th>
                  <th>Status</th>
                  <th aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => (
                  <OrderRow key={order.code} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
