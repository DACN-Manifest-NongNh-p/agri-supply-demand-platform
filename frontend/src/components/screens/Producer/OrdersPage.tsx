import { useState } from "react";
import { ArrowRight, Check, TriangleAlert } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { formatDay, formatDayInText, formatKg } from "./data/format";
import { deliveries, tasks } from "./data/mockProducer";
import { ORDER_STAGE_LABEL, type OrderStage, type ProducerOrder } from "./data/orders";
import { useProducer } from "./data/producerContext";

type Filter = "to_confirm" | "active" | "delivered" | "all";

const FILTERS: { id: Filter; label: string; stages: OrderStage[] }[] = [
  { id: "to_confirm", label: "To confirm", stages: ["to_confirm"] },
  { id: "active", label: "In progress", stages: ["offered", "confirmed", "in_transit"] },
  { id: "delivered", label: "Delivered", stages: ["delivered"] },
  { id: "all", label: "All", stages: ["offered", "to_confirm", "confirmed", "in_transit", "delivered", "declined"] },
];

const ORDER: Record<OrderStage, number> = { to_confirm: 0, in_transit: 1, confirmed: 2, offered: 3, delivered: 4, declined: 5 };

function placed(day: number, offered: boolean) {
  const verb = offered ? "offered" : "placed";
  if (day === 0) return `${verb} today`;
  if (day === -1) return `${verb} yesterday`;
  return `${verb} ${formatDayInText(day)}`;
}

function OrderRow({ order, stage }: { order: ProducerOrder; stage: OrderStage }) {
  const { resolveTask } = useProducer();
  const task = tasks.find((item) => item.id === order.taskId);
  const delivery = deliveries.find((item) => item.id === order.deliveryId);
  const problem = stage === "in_transit" && delivery?.issue;

  return (
    <li className="po-row">
      <div className="po-cell po-buyer">
        <strong>{order.buyer}</strong>
        <small>
          {order.demandId} · {placed(order.placedDay, stage === "offered")}
        </small>
      </div>
      <div className="po-cell">
        <strong>
          {formatKg(order.quantityKg)} {order.product.toLowerCase()}
        </strong>
        <small>
          from <Link to={`/producer/batches?batch=${order.batch}`}>{order.batch}</Link>
        </small>
      </div>
      <div className="po-cell">
        <strong>{stage === "delivered" ? "Delivered" : `Needed ${formatDay(order.neededByDay).toLowerCase()}`}</strong>
        <small>{order.destination}</small>
      </div>
      <div className="po-cell po-status">
        <span className={`po-pill po-pill--${problem ? "problem" : stage}`}>
          {problem && <TriangleAlert size={12} aria-hidden="true" />}
          {problem ? "Problem on the road" : ORDER_STAGE_LABEL[stage]}
        </span>
        {stage === "to_confirm" && order.confirmWithinHours !== undefined && <small className="po-due">{order.confirmWithinHours} h left to confirm</small>}
      </div>
      <div className="po-actions">
        {stage === "to_confirm" && task && (
          <>
            <button type="button" className="ph-btn ph-btn--primary" onClick={() => resolveTask(task, "done")}>
              <Check size={15} /> Confirm
            </button>
            <button type="button" className="ph-btn" onClick={() => resolveTask(task, "declined")}>
              Decline
            </button>
          </>
        )}
        {stage === "offered" && <span className="ph-muted">Waiting for the buyer</span>}
        {stage === "confirmed" && <span className="ph-muted">Waiting for pickup</span>}
        {(stage === "in_transit" || stage === "delivered") && order.deliveryId && (
          <Link to={`/producer/deliveries/${order.deliveryId}`} className="ph-link-btn">
            {stage === "delivered" ? "Proof of delivery" : `Track ${order.deliveryId}`} <ArrowRight size={14} />
          </Link>
        )}
        {stage === "declined" && <span className="ph-muted">Back to the market</span>}
      </div>
    </li>
  );
}

/**
 * Every sale on this farm's batches in one list, from offered to delivered: the ones waiting for
 * the producer first. Shipments are followed from here (Track, Proof of delivery).
 */
export default function OrdersPage() {
  const { orders } = useProducer();
  const [params] = useSearchParams();
  const rows = orders
    .map((order) => ({ order, stage: order.stage }))
    .sort((a, b) => ORDER[a.stage] - ORDER[b.stage] || a.order.neededByDay - b.order.neededByDay);
  const countOf = (filter: (typeof FILTERS)[number]) => rows.filter((row) => filter.stages.includes(row.stage)).length;
  const [filterId, setFilterId] = useState<Filter>(() => {
    const requested = FILTERS.find((item) => item.id === params.get("tab"));
    if (requested) return requested.id;
    return countOf(FILTERS[0]) > 0 ? "to_confirm" : "active";
  });
  const filter = FILTERS.find((item) => item.id === filterId)!;
  const visible = rows.filter((row) => filter.stages.includes(row.stage));

  const toConfirm = countOf(FILTERS[0]);
  const active = countOf(FILTERS[1]);

  return (
    <main className="ph-main">
      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Orders</p>
          <h1>Orders</h1>
          <p className="ph-hello-summary">
            {toConfirm > 0 ? `${toConfirm} ${toConfirm === 1 ? "order waits" : "orders wait"} for your confirmation` : "Nothing waits for your confirmation"}
            {active > 0 && `, ${active} in progress`}.
          </p>
        </div>
      </section>

      <section className="ph-card" aria-label="Orders">
        <div className="ph-cal-toolbar">
          <div className="ph-segmented" role="group" aria-label="Show">
            {FILTERS.map((option) => (
              <button key={option.id} type="button" aria-pressed={filterId === option.id} onClick={() => setFilterId(option.id)}>
                {option.label} <span className="ph-count-badge">{countOf(option)}</span>
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="ph-empty">No orders here.</p>
        ) : (
          <ul className="po-rows">
            {visible.map(({ order, stage }) => (
              <OrderRow key={order.id} order={order} stage={stage} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
