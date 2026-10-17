import { ArrowRight, MapPin, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import type { Delivery } from "../data/mockProducer";
import { isIncomplete, useProfile } from "@/components/profile/profileStore";
import { deliveryStatus, sortDeliveries, type DeliveryIssue } from "../data/deliveries";
import { DeliveryCard } from "./DeliveryCard";

export function FarmCard() {
  const profile = useProfile("producer");
  const farm = profile.org;
  if (isIncomplete(profile)) {
    return (
      <section className="ph-farm" aria-labelledby="farm-title">
        <p className="ph-eyebrow">Your farm</p>
        <h2 id="farm-title">Add your farm</h2>
        <p className="ph-farm-contact">Buyers see your farm name, region and crops.</p>
        <Link to="/producer/profile" className="ph-link-btn">
          <Pencil size={14} /> Complete your profile
        </Link>
      </section>
    );
  }
  return (
    <section className="ph-farm" aria-labelledby="farm-title">
      <p className="ph-eyebrow">Your farm</p>
      <h2 id="farm-title">{farm.name}</h2>
      {(farm.region || farm.hectares !== null) && (
        <p className="ph-farm-meta">
          <MapPin size={14} /> {[farm.region, farm.hectares !== null && `${farm.hectares} ha`].filter(Boolean).join(" · ")}
        </p>
      )}
      {farm.products.length > 0 && (
        <ul className="ph-tags">
          {farm.products.map((product) => (
            <li key={product}>{product}</li>
          ))}
        </ul>
      )}
      <p className="ph-farm-contact">Contact: {[profile.name, profile.phone].filter(Boolean).join(" · ")}</p>
      <Link to="/producer/profile" className="ph-link-btn">
        <Pencil size={14} /> Edit profile and growing areas
      </Link>
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
