import { useState } from "react";
import { ArrowRight, ChevronRight, Clock, PackageX, Thermometer, TriangleAlert, Truck, X, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { BuyerAlert } from "../data/alerts";

const PREVIEW_COUNT = 4;

const KIND: Record<BuyerAlert["kind"], { Icon: LucideIcon; label: string }> = {
  at_risk: { Icon: TriangleAlert, label: "Demand at risk" },
  supply_issue: { Icon: PackageX, label: "Supply problem" },
  hold_expiring: { Icon: Clock, label: "Hold expiring" },
  freshness: { Icon: Thermometer, label: "Short shelf life" },
  delivery_issue: { Icon: Truck, label: "Delivery" },
};

/** Notification list: one row per alert, coloured by urgency, most urgent first. */
export function AlertList({ alerts, onDismiss }: { alerts: BuyerAlert[]; onDismiss: (id: string) => void }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? alerts : alerts.slice(0, PREVIEW_COUNT);

  return (
    <section id="alerts" className="ph-attention" aria-labelledby="alerts-title">
      <div className="ph-section-head">
        <div>
          <h2 id="alerts-title">Alerts</h2>
          <p className="ph-section-sub">{alerts.length === 0 ? "All clear for now." : `${alerts.length} open, most urgent first.`}</p>
        </div>
        {alerts.length > PREVIEW_COUNT && (
          <button type="button" className="ph-link-btn" onClick={() => setShowAll((value) => !value)} aria-expanded={showAll}>
            {showAll ? "Show less" : `View all (${alerts.length})`} <ArrowRight size={16} className={showAll ? "ph-rotate-up" : undefined} />
          </button>
        )}
      </div>

      {alerts.length > 0 && (
        <ul className="ph-card bu-alerts">
          {shown.map((alert) => {
            const { Icon, label } = KIND[alert.kind];
            return (
              <li key={alert.id} className={`bu-alert bu-alert--${alert.tone}`}>
                <span className="bu-alert-icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <div className="bu-alert-body">
                  <p className="bu-alert-title">
                    <span className="bu-alert-kind">{label}</span>
                    <strong>{alert.figure}</strong>
                  </p>
                  <p className="bu-alert-text">{alert.caption}</p>
                </div>
                <div className="bu-alert-actions">
                  <button type="button" className="bu-alert-go" onClick={() => navigate(alert.link.to)}>
                    {alert.link.label} <ChevronRight size={15} />
                  </button>
                  <button type="button" className="bu-alert-dismiss" onClick={() => onDismiss(alert.id)} aria-label={`Dismiss: ${label}`} title="Dismiss">
                    <X size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
