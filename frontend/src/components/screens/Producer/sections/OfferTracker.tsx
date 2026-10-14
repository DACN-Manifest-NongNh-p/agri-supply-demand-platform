import { Link } from "react-router-dom";
import { OFFER_STAGES, type Offer } from "../data/mockProducer";
import { formatDay, formatKg } from "../data/format";

const NEXT_STEP: Record<Offer["status"], string> = {
  sent: "Waiting for the buyer to respond",
  accepted: "Waiting for a coordinator to allocate",
  allocated: "Waiting for your confirmation",
  confirmed: "Allocation confirmed",
  declined: "You declined this allocation",
};

// "today" / "yesterday" read better in lower case mid-sentence; dates like "Sun 11 Oct" keep their capitals.
function sentLabel(day: number) {
  const label = formatDay(day);
  return label.includes(" ") ? label : label.toLowerCase();
}

/** Follows each offer from "sent" to "confirmed by you". */
export function OfferTracker({ offers }: { offers: Offer[] }) {
  const sorted = [...offers].sort((a, b) => b.sentDay - a.sentDay);

  return (
    <section id="offers" className="ph-card ph-offers" aria-labelledby="offers-title">
      <div className="ph-section-head">
        <div>
          <h2 id="offers-title">Your offers</h2>
          <p className="ph-section-sub">Follow each offer from the buyer’s response to the final allocation.</p>
        </div>
      </div>

      <ul className="ph-offer-list">
        {sorted.map((item) => {
          const current = OFFER_STAGES.findIndex((stage) => stage.status === item.status);
          return (
            <li key={`${item.demandId}-${item.batch}`} className="ph-offer-item">
              <div className="ph-offer-head">
                <p>
                  <strong>{item.batch}</strong> → {item.buyer}
                  <small>
                    {formatKg(item.quantityKg)} {item.product} · sent {sentLabel(item.sentDay)}
                  </small>
                </p>
                {item.status === "allocated" ? (
                  <Link to="/producer#attention" className="ph-btn ph-btn--primary">Confirm on home</Link>
                ) : (
                  <span className={item.status === "declined" ? "ph-offer-state ph-offer-state--declined" : "ph-offer-state"}>
                    {NEXT_STEP[item.status]}
                  </span>
                )}
              </div>
              {item.status !== "declined" && (
                <ol className="ph-track ph-track--offer" aria-label={`Offer progress: ${NEXT_STEP[item.status]}`}>
                  {OFFER_STAGES.map((stage, index) => (
                    <li key={stage.status} className={index <= current ? "ph-track-step ph-track-step--done" : "ph-track-step"}>
                      <span>{stage.label}</span>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
