import { ArrowRight, MapPin, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import type { Delivery } from "../data/mockProducer";
import { deliveryStatus, sortDeliveries, type DeliveryIssue } from "../data/deliveries";
import { DeliveryCard } from "./DeliveryCard";

type Farm = { name: string; contact: string; region: string; hectares: number; products: string[] };

export function FarmCard({ farm }: { farm: Farm }) {
  return (
    <section className="ph-farm" aria-labelledby="farm-title">
      <p className="ph-eyebrow">Your farm</p>
      <h2 id="farm-title">{farm.name}</h2>
      <p className="ph-farm-meta">
        <MapPin size={14} /> {farm.region} · {farm.hectares} ha
      </p>
      <ul className="ph-tags">
        {farm.products.map((product) => (
          <li key={product}>{product}</li>
        ))}
      </ul>
      <p className="ph-farm-contact">Contact: {farm.contact}</p>
      <button type="button" className="ph-link-btn">
        <Pencil size={14} /> Edit profile and growing areas
      </button>
    </section>
  );
}

const HOME_COUNT = 2;

/** Home block: shipments still on their way, problems first. */
export function Deliveries({ deliveries, reported }: { deliveries: Delivery[]; reported: Record<string, DeliveryIssue> }) {
  const active = sortDeliveries(deliveries, reported).filter(
    (delivery) => deliveryStatus(delivery, reported[delivery.id]) !== "delivered",
  );

  return (
    <section id="deliveries" className="ph-deliveries" aria-labelledby="deliveries-title">
      <div className="ph-section-head">
        <div>
          <h2 id="deliveries-title">On the road</h2>
          <p className="ph-section-sub">{active.length} {active.length === 1 ? "shipment" : "shipments"} on the way</p>
        </div>
        <Link to="/producer/orders?tab=deliveries" className="ph-btn">
          All orders <ArrowRight size={16} />
        </Link>
      </div>
      {active.length === 0 ? (
        <p className="ph-muted">Nothing on the road right now.</p>
      ) : (
        <ul className="ph-trips">
          {active.slice(0, HOME_COUNT).map((delivery) => (
            <li key={delivery.id}>
              <DeliveryCard delivery={delivery} reported={reported[delivery.id]} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
