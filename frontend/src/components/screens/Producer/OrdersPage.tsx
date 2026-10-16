import { useEffect } from "react";
import { ArrowRight, Check, Clock, TriangleAlert } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { LifecycleSteps } from "@/components/orders/LifecycleSteps";
import { RULES } from "@/lib/site";
import { formatDay, formatDayInText, formatKg } from "./data/format";
import { deliveries, tasks } from "./data/mockProducer";
import {
  ORDER_STAGE_LABEL,
  PRODUCER_ORDER_TABS,
  producerNextStep,
  producerStepIndex,
  producerSteps,
  producerTabOf,
  producerTone,
  type ProducerOrder,
  type ProducerOrderTab,
} from "./data/orders";
import { useProducer } from "./data/producerContext";
import { DeliveriesList } from "./sections/DeliveriesList";

function placed(day: number, offered: boolean) {
  const verb = offered ? "Offered" : "Placed";
  if (day === 0) return `${verb} today`;
  if (day === -1) return `${verb} yesterday`;
  return `${verb} ${formatDayInText(day)}`;
}

function OrderCard({ order }: { order: ProducerOrder }) {
  const { resolveTask } = useProducer();
  const task = tasks.find((item) => item.id === order.taskId);
  const delivery = deliveries.find((item) => item.id === order.deliveryId);
  const problem = order.stage === "in_transit" ? delivery?.issue : undefined;
  const waiting = order.stage === "to_confirm" || order.stage === "offered";

  return (
    <li id={`order-${order.id}`} className={`ord-card ord-card--${producerTone(order.stage)}`}>
      <div className="ord-head">
        <span className="ord-what">
          <strong>
            {formatKg(order.quantityKg)} {order.product.toLowerCase()} for {order.buyer}
          </strong>
          <span>
            {order.buyerType} · from <Link to={`/producer/batches?batch=${order.batch}`}>{order.batch}</Link> ·{" "}
            {order.stage === "delivered" ? "delivered" : `needed ${formatDay(order.neededByDay).toLowerCase()}`} · {order.destination}
          </span>
          <small>
            {order.demandId} · {placed(order.placedDay, order.origin === "producer")}
          </small>
        </span>
        <span className={`po-pill po-pill--${problem ? "problem" : order.stage}`}>
          {problem && <TriangleAlert size={12} aria-hidden="true" />}
          {problem ? "Problem on the road" : ORDER_STAGE_LABEL[order.stage]}
        </span>
      </div>

      {order.stage !== "offered" && order.stage !== "declined" && (
        <p className="ord-money">
          {order.stage === "delivered" ? "Paid in full by the buyer" : `${order.buyer} paid a ${RULES.depositPercent}% deposit · the rest on delivery`}
        </p>
      )}
      {problem && (
        <p className="ph-delivery-problem">
          <TriangleAlert size={14} /> {problem}
        </p>
      )}

      <div className="ord-foot">
        <LifecycleSteps
          steps={producerSteps(order)}
          reached={producerStepIndex(order.stage)}
          closed={order.stage === "declined"}
          label={`Order status: ${ORDER_STAGE_LABEL[order.stage]}`}
        />
        <div className="ord-action">
          <span className={waiting ? "ord-next is-waiting" : "ord-next"}>
            {waiting && <Clock size={13} />} {producerNextStep(order)}
          </span>
          {order.stage === "to_confirm" && task && (
            <>
              <button type="button" className="ph-btn" onClick={() => resolveTask(task, "declined")}>
                Decline
              </button>
              <button type="button" className="ph-btn ph-btn--primary" onClick={() => resolveTask(task, "done")}>
                <Check size={15} /> Confirm
              </button>
            </>
          )}
          {(order.stage === "in_transit" || order.stage === "delivered") && order.deliveryId && (
            <Link to={`/producer/deliveries/${order.deliveryId}`} className="ph-link-btn">
              {order.stage === "delivered" ? "Proof of delivery" : `Track ${order.deliveryId}`} <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * Every sale on this farm's batches, one tab per stage: orders buyers placed that wait for you,
 * offers you sent that wait for the buyer, then confirmed, on the way, delivered and declined.
 */
export default function OrdersPage() {
  const { orders } = useProducer();
  const [params, setParams] = useSearchParams();
  const location = useLocation();

  const countOf = (id: ProducerOrderTab) => orders.filter((order) => producerTabOf(order.stage) === id).length;
  // A link to one order (#order-A-6) opens its tab; otherwise ?tab=, else the first tab with something in it.
  const linked = location.hash.startsWith("#order-") ? orders.find((order) => `#order-${order.id}` === location.hash) : undefined;
  const firstBusy = PRODUCER_ORDER_TABS.find((item) => item.id !== "declined" && countOf(item.id) > 0)?.id ?? "to_confirm";
  const tab: ProducerOrderTab =
    PRODUCER_ORDER_TABS.find((item) => item.id === params.get("tab"))?.id ?? (linked ? producerTabOf(linked.stage) : firstBusy);
  const current = PRODUCER_ORDER_TABS.find((item) => item.id === tab)!;
  const visible = orders
    .filter((order) => producerTabOf(order.stage) === tab)
    .sort((a, b) => a.neededByDay - b.neededByDay);

  const toConfirm = countOf("to_confirm");
  const offered = countOf("offered");

  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [location.hash, tab]);

  return (
    <main className="ph-main">
      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Sales</p>
          <h1>Orders</h1>
          <p className="ph-hello-summary">
            {toConfirm > 0 ? `${toConfirm} ${toConfirm === 1 ? "order waits" : "orders wait"} for your confirmation` : "Nothing waits for your confirmation"}
            {offered > 0 && `, ${offered} ${offered === 1 ? "offer waits" : "offers wait"} for a buyer`}. An order is confirmed once both sides agree; only then is a truck booked.
          </p>
        </div>
      </section>

      <nav className="ord-tabs" aria-label="Order stages">
        {PRODUCER_ORDER_TABS.map((item) => {
          const count = countOf(item.id);
          return (
            <button key={item.id} type="button" aria-current={tab === item.id ? "page" : undefined} onClick={() => setParams({ tab: item.id }, { replace: true })}>
              {item.label}
              {count > 0 && <span className={item.id === "to_confirm" ? "ph-count-badge is-alert" : "ph-count-badge"}>{count}</span>}
            </button>
          );
        })}
      </nav>

      <p className="ord-tab-hint">{current.hint}</p>

      {tab === "deliveries" ? (
        <DeliveriesList />
      ) : visible.length === 0 ? (
        <p className="ph-card ph-empty">{current.empty}</p>
      ) : (
        <ul className="ord-list">
          {visible.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ul>
      )}
    </main>
  );
}
