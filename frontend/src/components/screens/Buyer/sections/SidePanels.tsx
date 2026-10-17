import { ArrowRight, MapPin, Pencil } from "lucide-react";
import { useBuyer } from "../data/buyerContext";
import { Link } from "react-router-dom";
import { DeliveryCard } from "../../Producer/sections/DeliveryCard";
import { deliveryStatus, sortDeliveries, type DeliveryIssue } from "../../Producer/data/deliveries";
import { DEMAND_STAGES, type DemandStatus } from "../data/demands";
import type { BuyerDelivery } from "../data/mockBuyer";
import { isIncomplete, useProfile } from "@/components/profile/profileStore";

export function CompanyCard() {
  const { addresses } = useBuyer();
  const profile = useProfile("buyer");
  const company = profile.org;
  const main = addresses[0];
  if (isIncomplete(profile)) {
    return (
      <section className="ph-farm" aria-labelledby="company-title">
        <p className="ph-eyebrow">Your company</p>
        <h2 id="company-title">Add your company</h2>
        <p className="ph-farm-contact">Producers see who they are selling to.</p>
        <Link to="/buyer/profile" className="ph-link-btn">
          <Pencil size={14} /> Complete your profile
        </Link>
      </section>
    );
  }
  const place = main ? `${main.label}, ${main.district}, ${main.province}` : company.region;
  return (
    <section className="ph-farm" aria-labelledby="company-title">
      <p className="ph-eyebrow">Your company</p>
      <h2 id="company-title">{company.name}</h2>
      {place && (
        <p className="ph-farm-meta">
          <MapPin size={14} /> {place}
          {addresses.length > 1 && ` +${addresses.length - 1} more`}
        </p>
      )}
      {company.products.length > 0 && (
        <ul className="ph-tags">
          {company.products.map((product) => (
            <li key={product}>{product}</li>
          ))}
        </ul>
      )}
      <p className="ph-farm-contact">
        {[profile.name, profile.title.toLowerCase()].filter(Boolean).join(", ")}
      </p>
      <Link to="/buyer/profile" className="ph-link-btn">
        <Pencil size={14} /> Edit profile and company
      </Link>
    </section>
  );
}

/** Count of demands per status; each row filters the demand list. */
export function DemandPipeline({ counts }: { counts: Record<DemandStatus, number> }) {
  const max = Math.max(1, ...Object.values(counts));
  return (
    <section className="ph-card bu-pipeline" aria-labelledby="pipeline-title">
      <div className="ph-section-head">
        <h2 id="pipeline-title">Demand pipeline</h2>
      </div>
      <ul>
        {DEMAND_STAGES.map((stage) => (
          <li key={stage.status}>
            <Link to={`/buyer/demands?status=${stage.status}`}>
              <span className="bu-pipeline-label">{stage.label}</span>
              <span className="bu-pipeline-bar" aria-hidden="true">
                <span style={{ width: `${(counts[stage.status] / max) * 100}%` }} />
              </span>
              <strong>{counts[stage.status]}</strong>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const HOME_COUNT = 2;

/** Home block: allocated supply on its way to you, problems first. */
export function IncomingDeliveries({ deliveries, reported }: { deliveries: BuyerDelivery[]; reported: Record<string, DeliveryIssue> }) {
  const active = sortDeliveries(deliveries, reported).filter(
    (delivery) => deliveryStatus(delivery, reported[delivery.id]) !== "delivered",
  );

  return (
    <section id="deliveries" className="ph-deliveries" aria-labelledby="deliveries-title">
      <div className="ph-section-head">
        <div>
          <h2 id="deliveries-title">On the way to you</h2>
          <p className="ph-section-sub">{active.length} {active.length === 1 ? "shipment" : "shipments"} in transit</p>
        </div>
        <Link to="/buyer/orders?tab=deliveries" className="ph-btn">
          View all deliveries <ArrowRight size={16} />
        </Link>
      </div>
      {active.length === 0 ? (
        <p className="ph-muted">Nothing on the road right now.</p>
      ) : (
        <ul className="ph-trips">
          {active.slice(0, HOME_COUNT).map((delivery) => (
            <li key={delivery.id}>
              <DeliveryCard
                delivery={delivery}
                reported={reported[delivery.id]}
                to={`/buyer/deliveries/${delivery.id}`}
                title={`${delivery.batch} from ${delivery.producer}`}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
