import { useState } from "react";
import { DeliveryRow } from "../../Producer/sections/DeliveryCard";
import { DELIVERY_STATUS_LABEL, deliveryStatus, sortDeliveries, type DeliveryStatus } from "../../Producer/data/deliveries";
import { deliveries } from "../data/mockBuyer";
import { useBuyer } from "../data/buyerContext";

type Filter = "all" | DeliveryStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_transit", label: DELIVERY_STATUS_LABEL.in_transit },
  { id: "delivered", label: DELIVERY_STATUS_LABEL.delivered },
  { id: "issue", label: "Issues" },
];

/** Shipments of confirmed orders, on the road or delivered, with route progress; problems first. */
export function DeliveriesList() {
  const { deliveryIssues } = useBuyer();
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = sortDeliveries(deliveries, deliveryIssues);
  const statusOf = (delivery: (typeof deliveries)[number]) => deliveryStatus(delivery, deliveryIssues[delivery.id]);
  const countOf = (id: Filter) => (id === "all" ? sorted.length : sorted.filter((delivery) => statusOf(delivery) === id).length);
  const visible = sorted.filter((delivery) => filter === "all" || statusOf(delivery) === filter);

  return (
    <section className="ph-card" aria-label="Deliveries">
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
              <DeliveryRow delivery={delivery} reported={deliveryIssues[delivery.id]} to={`/buyer/deliveries/${delivery.id}`} title={`${delivery.batch} from ${delivery.producer}`} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
