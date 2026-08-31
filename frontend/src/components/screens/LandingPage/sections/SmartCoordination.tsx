import { Check, ArrowRight } from "lucide-react";
import { Reveal, Eyebrow } from "./Reveal";
import "../styles/SmartCoordination.css";

export function SmartCoordination() {
  return (
    <section className="smart-section">
      <div className="smart-container">
        <div className="smart-grid">
          <Reveal>
            <Eyebrow>Smart coordination</Eyebrow>
            <h2 className="editorial smart-title">Find where the produce should go next.</h2>
            <p className="smart-intro">
              When multiple supply batches can satisfy the same demand, the system can consider
              remaining shelf life, distance, transportation time, quality, and demand to prioritize
              suitable coordination options.
            </p>
          </Reveal>

          <Reveal delay={100} className="smart-card">
            <div className="smart-card-head">
              <div>
                <p className="smart-card-label">Demand</p>
                <p className="smart-card-value">Buyer X — 5,000 kg Watermelon</p>
              </div>
              <ArrowRight className="smart-card-arrow" />
            </div>

            <div className="batch-box batch-box--recommended">
              <div className="batch-box-head">
                <p className="batch-box-name">Batch B</p>
                <span className="batch-badge batch-badge--recommended">
                  <Check className="batch-badge-icon" /> Recommended
                </span>
              </div>
              <div className="batch-stats">
                {[
                  ["Shelf life", "1 day"],
                  ["Distance", "100 km"],
                  ["Est. transport", "1 day"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="batch-stat-label">{k}</p>
                    <p className="batch-stat-value">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="batch-box batch-box--alternative">
              <div className="batch-box-head">
                <p className="batch-box-name batch-box-name--muted">Batch A</p>
                <span className="batch-badge batch-badge--alternative">Alternative</span>
              </div>
              <div className="batch-stats batch-stats--muted">
                {[
                  ["Shelf life", "5 days"],
                  ["Distance", "30 km"],
                  ["Est. transport", "< 1 day"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="batch-stat-label batch-stat-label--plain">{k}</p>
                    <p className="batch-stat-value batch-stat-value--muted">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="smart-footnote">
              Recommended because <span className="smart-footnote-strong">Batch B</span> has a
              higher urgency and can still reach the buyer within its remaining shelf life.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Reservation() {
  return (
    <section className="reservation-section">
      <div className="reservation-container">
        <div className="reservation-grid">
          <Reveal>
            <Eyebrow>Reservation</Eyebrow>
            <h2 className="editorial reservation-title">One batch. One reliable inventory.</h2>
            <p className="reservation-intro">
              When a buyer places an order, the requested quantity is temporarily reserved so
              multiple buyers cannot claim the same available supply.
            </p>
          </Reveal>

          <Reveal delay={100} className="reservation-card">
            <div className="reservation-card-head">
              <p className="reservation-card-label">Available</p>
              <p className="editorial reservation-card-value">5,000 kg</p>
            </div>

            <div className="reservation-bar">
              <div className="reservation-bar-segment reservation-bar-segment--primary" style={{ width: "40%" }} />
              <div className="reservation-bar-segment reservation-bar-segment--sage" style={{ width: "30%" }} />
              <div className="reservation-bar-segment reservation-bar-segment--lime" style={{ width: "30%" }} />
            </div>

            <ul className="reservation-list">
              {[
                ["Buyer A", "2,000 kg", "Reserved", "dot--primary"],
                ["Buyer B", "1,500 kg", "Reserved", "dot--sage"],
                ["Remaining", "1,500 kg", "Available", "dot--lime"],
              ].map(([who, qty, state, dot]) => (
                <li key={who} className="reservation-row">
                  <span className="reservation-row-left">
                    <span className={`reservation-dot ${dot}`} />
                    {who}
                  </span>
                  <span className="reservation-row-right">
                    <span className="reservation-qty">{qty}</span>
                    <span className="reservation-state">{state}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}