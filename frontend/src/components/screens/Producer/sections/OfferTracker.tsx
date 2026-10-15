import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { OFFER_STAGES, type Offer } from "../data/mockProducer";
import { formatDay, formatKg } from "../data/format";

const STATE: Record<Offer["status"], { label: string; tone: "wait" | "action" | "done" | "declined" }> = {
  sent: { label: "Waiting for buyer", tone: "wait" },
  accepted: { label: "Waiting for allocation", tone: "wait" },
  allocated: { label: "Your confirmation needed", tone: "action" },
  confirmed: { label: "Confirmed", tone: "done" },
  declined: { label: "Declined", tone: "declined" },
};

// "today" / "yesterday" read better in lower case mid-sentence; dates like "Sun 11 Oct" keep their capitals.
function sentLabel(day: number) {
  const label = formatDay(day);
  return label.includes(" ") ? label : label.toLowerCase();
}

/** Follows each offer from "sent" to "confirmed by you". Offers needing the producer come first. */
export function OfferTracker({ offers }: { offers: Offer[] }) {
  const rank = (item: Offer) => ({ action: 0, wait: 1, done: 2, declined: 3 })[STATE[item.status].tone];
  const sorted = [...offers].sort((a, b) => rank(a) - rank(b) || b.sentDay - a.sentDay);

  return (
    <section id="offers" className="ph-card ph-offers" aria-labelledby="offers-title">
      <div className="ph-section-head">
        <div>
          <h2 id="offers-title">Your offers</h2>
          <p className="ph-section-sub">From the buyer's response to the final allocation.</p>
        </div>
      </div>

      <ul className="ph-offer-cards">
        {sorted.map((item) => {
          const state = STATE[item.status];
          const current = OFFER_STAGES.findIndex((stage) => stage.status === item.status);
          return (
            <li key={`${item.demandId}-${item.batch}`} className={`ph-offer-card ph-offer-card--${state.tone}`}>
              <div className="ph-offer-card-head">
                <div>
                  <p className="ph-offer-card-title">
                    {item.batch} <span>→</span> {item.buyer}
                  </p>
                  <p className="ph-offer-card-meta">
                    {formatKg(item.quantityKg)} {item.product} · sent {sentLabel(item.sentDay)}
                  </p>
                </div>
                {state.tone === "action" ? (
                  <Link to="/producer#attention" className="ph-btn ph-btn--primary">
                    Confirm <ArrowRight size={16} />
                  </Link>
                ) : (
                  <span className={`ph-offer-chip ph-offer-chip--${state.tone}`}>{state.label}</span>
                )}
              </div>

              {item.status !== "declined" && (
                <ol className="ph-offer-steps" aria-label={`Offer progress: ${state.label}`}>
                  {OFFER_STAGES.map((stage, index) => {
                    // The step the offer is waiting on is the one after the last completed stage.
                    const done = index <= current;
                    const next = index === current + 1;
                    return (
                      <li
                        key={stage.status}
                        className={done ? "ph-offer-step ph-offer-step--done" : next ? "ph-offer-step ph-offer-step--next" : "ph-offer-step"}
                      >
                        <span className="ph-offer-dot">{done && <Check size={12} strokeWidth={3} />}</span>
                        <span className="ph-offer-step-label">{stage.label}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
