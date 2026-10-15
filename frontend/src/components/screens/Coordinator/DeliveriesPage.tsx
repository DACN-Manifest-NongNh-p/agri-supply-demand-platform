import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { DeliveryRow } from "../Producer/sections/DeliveryCard";
import { DELIVERY_STATUS_LABEL, deliveryStatus, sortDeliveries, type DeliveryStatus } from "../Producer/data/deliveries";
import { deliveries } from "./data/mockCoordinator";

type Filter = "all" | DeliveryStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_transit", label: DELIVERY_STATUS_LABEL.in_transit },
  { id: "delivered", label: DELIVERY_STATUS_LABEL.delivered },
  { id: "issue", label: "Issues" },
];

export default function DeliveriesPage() {
  // Problems are what the coordinator is here for: open on them when there are any.
  const [filter, setFilter] = useState<Filter>(() => (deliveries.some((delivery) => deliveryStatus(delivery) === "issue") ? "issue" : "all"));

  const sorted = sortDeliveries(deliveries, {});
  const countOf = (id: Filter) => (id === "all" ? sorted.length : sorted.filter((delivery) => deliveryStatus(delivery) === id).length);
  const visible = sorted.filter((delivery) => filter === "all" || deliveryStatus(delivery) === filter);

  return (
    <main className="ph-main">
      <Link to="/coordinator" className="ph-back">
        <ArrowLeft size={16} /> Back to overview
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Logistics</p>
          <h1>Deliveries</h1>
          <p className="ph-hello-summary">
            Every shipment on the platform, problems first. You are the contact for carriers: open one for its route, cold chain and dispatch desk, and send both sides an
            update once it is sorted.
          </p>
        </div>
      </section>

      <section className="ph-card" aria-label="Delivery list">
        <div className="ph-cal-toolbar">
          <div className="ph-segmented" role="group" aria-label="Show">
            {FILTERS.map((option) => (
              <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
                {option.label} <span className="ph-count-badge">{countOf(option.id)}</span>
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="ph-empty">No deliveries here.</p>
        ) : (
          <ul className="ph-delivery-rows">
            {visible.map((delivery) => (
              <li key={delivery.id}>
                <DeliveryRow
                  delivery={delivery}
                  to={`/coordinator/deliveries/${delivery.id}`}
                  title={`${delivery.batch}: ${delivery.producer} → ${delivery.buyer}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
