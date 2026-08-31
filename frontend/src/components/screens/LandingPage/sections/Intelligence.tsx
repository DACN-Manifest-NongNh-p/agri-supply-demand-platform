import { Reveal, Eyebrow } from "./Reveal";
import "../styles/Intelligence.css";

export function Intelligence() {
  return (
    <section id="intelligence" className="intelligence-section">
      <div className="intelligence-container">
        <Reveal className="intelligence-header">
          <Eyebrow>Intelligence</Eyebrow>
          <h2 className="editorial intelligence-title">
            See the imbalance before it becomes waste.
          </h2>
          <p className="intelligence-intro">
            Farmora uses historical supply, demand, seasonal, and transaction data to provide
            forecasts and risk signals that support coordination decisions.
          </p>
        </Reveal>

        <div className="intelligence-grid">
          <Reveal className="card card--bordered">
            <span className="label-eyebrow card-eyebrow">Demand forecasting</span>
            <p className="card-text">
              Forecast demand for the next 3–7 days using historical orders, seasonality, day of
              week, product type, price, and location.
            </p>
            <div className="stat-box">
              <p className="stat-box-label">Example — Ho Chi Minh City</p>
              <p className="editorial stat-box-value">6,200 kg</p>
              <p className="stat-box-caption">Expected watermelon demand in the next 3 days</p>
            </div>
          </Reveal>

          <Reveal delay={80} className="card card--bordered">
            <span className="label-eyebrow card-eyebrow">Supply forecasting</span>
            <p className="card-text">
              Estimate upcoming harvest volumes by region and time using historical harvest data,
              cultivated area, seasonality, and farmer-provided information.
            </p>
            <div className="stat-box">
              <p className="stat-box-label">Example — Long An</p>
              <p className="editorial stat-box-value">15,000 kg</p>
              <p className="stat-box-caption">Expected watermelon supply next week</p>
            </div>
          </Reveal>

          <Reveal delay={140} className="card card--dark">
            <span className="label-eyebrow card-eyebrow card-eyebrow--dark">Surplus risk</span>
            <div className="risk-rows">
              {[
                ["Expected supply", "15,000 kg"],
                ["Expected demand", "9,000 kg"],
                ["Expected surplus", "6,000 kg"],
              ].map(([k, v], i) => (
                <div key={k} className="risk-row">
                  <span className="risk-row-label">{k}</span>
                  <span className={i === 2 ? "risk-row-value risk-row-value--lime" : "risk-row-value"}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
            <div className="risk-pill risk-pill--high-dark">High surplus risk</div>
          </Reveal>

          <Reveal delay={200} className="card card--bordered">
            <span className="label-eyebrow card-eyebrow">Spoilage risk</span>
            <div className="spoilage-grid">
              {[
                ["Batch", "Batch B"],
                ["Quantity", "4,000 kg"],
                ["Shelf life left", "2 days"],
                ["Buyer", "None"],
                ["Est. transport", "1 day"],
                ["Demand", "Low"],
              ].map(([k, v]) => (
                <div key={k} className="spoilage-item">
                  <p className="spoilage-label">{k}</p>
                  <p className="spoilage-value">{v}</p>
                </div>
              ))}
            </div>
            <div className="risk-pill risk-pill--high">Risk: High</div>
            <p className="card-footnote">
              The model produces a risk signal — not a conversation. The coordination engine uses it
              to decide which batches deserve attention first.
            </p>
          </Reveal>
        </div>
        <p className="intelligence-disclaimer">All figures shown are example / demo data</p>
      </div>
    </section>
  );
}