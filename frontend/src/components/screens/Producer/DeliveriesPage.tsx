import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { DeliveryRow } from "./sections/DeliveryCard";
import { deliveries } from "./data/mockProducer";
import { DELIVERY_STATUS_LABEL, deliveryStatus, sortDeliveries, type DeliveryStatus } from "./data/deliveries";
import { useProducer } from "./data/producerContext";

type Filter = "all" | DeliveryStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_transit", label: DELIVERY_STATUS_LABEL.in_transit },
  { id: "delivered", label: DELIVERY_STATUS_LABEL.delivered },
  { id: "issue", label: "Issues" },
];

export default function DeliveriesPage() {
  const { deliveryIssues } = useProducer();
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = sortDeliveries(deliveries, deliveryIssues);
  const countOf = (id: Filter) =>
    id === "all" ? sorted.length : sorted.filter((delivery) => deliveryStatus(delivery, deliveryIssues[delivery.id]) === id).length;
  const visible = sorted.filter(
    (delivery) => filter === "all" || deliveryStatus(delivery, deliveryIssues[delivery.id]) === filter,
  );

  return (
    <main className="ph-main">
      <Link to="/producer" className="ph-back">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Logistics</p>
          <h1>Deliveries</h1>
          <p className="ph-hello-summary">
            Every shipment of your batches, from packing to proof of delivery. Select one for its timeline, cold-chain readings and carrier details.
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
                <DeliveryRow delivery={delivery} reported={deliveryIssues[delivery.id]} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
