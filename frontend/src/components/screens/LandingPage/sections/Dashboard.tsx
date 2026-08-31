import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";
import "../styles/Dashboard.css";

const metrics = [
  ["Total supply", "42,500 kg"],
  ["Total demand", "31,200 kg"],
  ["Expected surplus", "11,300 kg"],
  ["Batches at risk", "7"],
  ["Reserved", "8,900 kg"],
  ["Rescued", "3,400 kg"],
];

const regions = [
  { name: "Long An", supply: 92, demand: 38, tone: "high" },
  { name: "TP. Hồ Chí Minh", supply: 18, demand: 96, tone: "demand" },
  { name: "Tiền Giang", supply: 64, demand: 52, tone: "mid" },
  { name: "Bình Thuận", supply: 74, demand: 30, tone: "high" },
];

const atRisk = [
  { name: "Watermelon — Batch C", qty: "6,000 kg", left: "1 day remaining", level: "High" },
  { name: "Dragon Fruit — Batch F", qty: "2,500 kg", left: "2 days remaining", level: "Medium" },
];

export function Dashboard() {
  return (
    <section id="coordination" className="coordination-section">
      <div className="coordination-container">
        <Reveal delay={80} className="coordination-card">
          <div className="card-topbar">
            <div className="card-topbar-left">
              <span className="status-dot" />
              <p className="card-topbar-title">Coordination Overview</p>
              <span className="card-topbar-sub">Mekong Delta · Last 7 days</span>
            </div>
            <span className="demo-badge">Demo data</span>
          </div>

          <div className="metrics-grid">
            {metrics.map(([k, v]) => (
              <div key={k} className="metric-item">
                <p className="metric-label">{k}</p>
                <p className="metric-value">{v}</p>
              </div>
            ))}
          </div>

          <div className="content-grid">
            <div className="panel">
              <p className="panel-title">Regional supply vs demand</p>
              <div className="region-list">
                {regions.map((r) => (
                  <div key={r.name} className="region-item">
                    <div className="region-head">
                      <span className="region-name">{r.name}</span>
                      <span className="region-status">
                        {r.tone === "demand"
                          ? "Demand exceeds supply"
                          : r.tone === "high"
                            ? "Surplus building"
                            : "Balanced"}
                      </span>
                    </div>
                    <div className="bar-group">
                      <div className="bar-row">
                        <span className="bar-label">Supply</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill bar-fill--primary"
                            style={{ width: `${r.supply}%` }}
                          />
                        </div>
                      </div>
                      <div className="bar-row">
                        <span className="bar-label">Demand</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill bar-fill--lime"
                            style={{ width: `${r.demand}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <p className="panel-title">Batches at risk</p>
              <ul className="risk-list">
                {atRisk.map((b) => (
                  <li key={b.name} className="risk-item">
                    <div className="risk-item-head">
                      <p className="risk-name">{b.name}</p>
                      <span
                        className={cn(
                          "risk-badge",
                          b.level === "High" ? "risk-badge--high" : "risk-badge--medium",
                        )}
                      >
                        {b.level} risk
                      </span>
                    </div>
                    <p className="risk-meta">
                      {b.qty} · {b.left}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="risk-note">
                Risk-ranked batches move to the top of the coordination queue automatically.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}