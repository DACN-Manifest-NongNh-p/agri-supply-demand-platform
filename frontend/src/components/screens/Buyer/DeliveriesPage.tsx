import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { DeliveryRow } from "../Producer/sections/DeliveryCard";
import { DELIVERY_STATUS_LABEL, deliveryStatus, sortDeliveries, type DeliveryStatus } from "../Producer/data/deliveries";
import { deliveries } from "./data/mockBuyer";
import { useBuyer } from "./data/buyerContext";

type Filter = "all" | DeliveryStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_transit", label: DELIVERY_STATUS_LABEL.in_transit },
  { id: "delivered", label: DELIVERY_STATUS_LABEL.delivered },
  { id: "issue", label: "Issues" },
];

export default function DeliveriesPage() {
  const { deliveryIssues } = useBuyer();
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = sortDeliveries(deliveries, deliveryIssues);
  const countOf = (id: Filter) =>
    id === "all" ? sorted.length : sorted.filter((delivery) => deliveryStatus(delivery, deliveryIssues[delivery.id]) === id).length;
  const visible = sorted.filter(
    (delivery) => filter === "all" || deliveryStatus(delivery, deliveryIssues[delivery.id]) === filter,
  );

  return (
    <main className="ph-main">
      <Link to="/buyer" className="ph-back">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Logistics</p>
          <h1>Deliveries</h1>
          <p className="ph-hello-summary">
            Supply allocated to your demands, from pickup at the farm to proof of delivery at your DC. Select one for its route and cold-chain readings.
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
                  reported={deliveryIssues[delivery.id]}
                  to={`/buyer/deliveries/${delivery.id}`}
                  title={`${delivery.batch} from ${delivery.producer}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
