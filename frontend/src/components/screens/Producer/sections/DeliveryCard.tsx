import { ChevronRight, TriangleAlert, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import type { Delivery } from "../data/mockProducer";
import { DELIVERY_STATUS_LABEL, deliveryStatus, etaText, type DeliveryIssue } from "../data/deliveries";
import { formatKg } from "../data/format";
import { RouteProgress } from "./RouteProgress";

function problemOf(delivery: Delivery, reported?: DeliveryIssue) {
  return reported ? `You reported: ${reported.reason}` : delivery.issue;
}

/** Splits "Tomorrow, 09:00 (revised)" into its day, time and revised flag for the ticket stub. */
function splitEta(delivery: Delivery) {
  const revised = /\(revised\)/i.test(delivery.eta);
  const text = etaText(delivery).replace(/\s*\(revised\)/i, "");
  const [day, time] = text.includes(",") ? text.split(/,\s*/) : [text, ""];
  return { day, time, revised };
}

type Props = {
  delivery: Delivery;
  reported?: DeliveryIssue;
  /** Link target; defaults to the producer's delivery page. */
  to?: string;
  /** Headline; defaults to "batch → buyer" (the buyer area shows the producer instead). */
  title?: string;
};

/** Home "ticket": arrival time on the stub, shipment and route on the body. */
export function DeliveryCard({ delivery, reported, to, title }: Props) {
  const problem = problemOf(delivery, reported);
  const percent = Math.round(Math.min(1, Math.max(0, delivery.progress)) * 100);
  const { day, time, revised } = splitEta(delivery);

  return (
    <Link to={to ?? `/producer/deliveries/${delivery.id}`} className={problem ? "ph-ticket ph-ticket--issue" : "ph-ticket"}>
      <span className="ph-ticket-stub">
        <small>{day}</small>
        <strong>{time || "—"}</strong>
        {revised && <small className="ph-ticket-revised">revised</small>}
      </span>

      <span className="ph-ticket-body">
        <span className="ph-ticket-title">
          {title ?? `${delivery.batch} → ${delivery.buyer}`}
          {problem && <TriangleAlert size={16} className="ph-ticket-alert" aria-label="Needs attention" />}
        </span>

        <span className="ph-ticket-route" role="img" aria-label={`${percent}% of the way from ${delivery.fromShort} to ${delivery.toShort}`}>
          <span className="ph-ticket-place">{delivery.fromShort}</span>
          <span className="ph-ticket-track">
            <span className="ph-ticket-fill" style={{ width: `${percent}%` }} />
            <span className="ph-ticket-truck" style={{ left: `${percent}%` }}>
              <Truck size={12} strokeWidth={2.25} />
            </span>
          </span>
          <span className="ph-ticket-place">{delivery.toShort}</span>
        </span>

        <span className="ph-ticket-meta">
          {formatKg(delivery.quantityKg)} {delivery.product}
          {problem && <span className="ph-ticket-problem"> · {problem}</span>}
        </span>
      </span>
    </Link>
  );
}

/** List row for /producer/deliveries (and /buyer/deliveries, with `to` and `title`). */
export function DeliveryRow({ delivery, reported, to, title }: Props) {
  const status = deliveryStatus(delivery, reported);
  const problem = problemOf(delivery, reported);

  return (
    <Link to={to ?? `/producer/deliveries/${delivery.id}`} className={`ph-delivery-row ph-delivery-row--${status}`}>
      <span className="ph-delivery-row-main">
        <span className="ph-delivery-row-top">
          <span className={`ph-status-pill ph-status-pill--${status}`}>{DELIVERY_STATUS_LABEL[status]}</span>
          <span className="ph-delivery-id">{delivery.id}</span>
        </span>
        <span className="ph-delivery-title">{title ?? `${delivery.batch} → ${delivery.buyer}`}</span>
        <span className="ph-delivery-meta">
          {formatKg(delivery.quantityKg)} {delivery.product} · {delivery.carrier}
        </span>
        {problem && (
          <span className="ph-delivery-problem">
            <TriangleAlert size={14} /> {problem}
          </span>
        )}
      </span>
      <span className="ph-delivery-row-route">
        <RouteProgress delivery={delivery} status={status} />
      </span>
      <span className="ph-delivery-row-eta">
        <small>{delivery.step === 3 ? "Delivered" : "Arrives"}</small>
        <strong>{etaText(delivery)}</strong>
      </span>
      <ChevronRight size={18} className="ph-delivery-chevron" aria-hidden="true" />
    </Link>
  );
}
