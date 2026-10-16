import { ArrowRight, TriangleAlert, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { SpoilageAlert } from "./useSpoilageAlerts";
import "./freshness.css";

/** At most this many toasts at once; the rest stay under the bell. */
const MAX_TOASTS = 3;

/** Floating alerts in the corner of the dashboard, newest risk first, each with a way to act. */
export function RiskToasts({ alerts, onDismiss, actionLabel = "Find a buyer" }: { alerts: SpoilageAlert[]; onDismiss: (id: string) => void; actionLabel?: string }) {
  if (alerts.length === 0) return null;
  return (
    <div className="fr-toasts" role="region" aria-label="Spoilage alerts" aria-live="assertive">
      {alerts.slice(0, MAX_TOASTS).map((alert) => (
        <div key={alert.id} className="fr-toast" role="alert">
          <TriangleAlert size={18} className="fr-toast-icon" aria-hidden="true" />
          <div className="fr-toast-body">
            <strong>{alert.title}</strong>
            <p>{alert.detail}</p>
            <Link to={alert.to} className="fr-toast-action" onClick={() => onDismiss(alert.id)}>
              {actionLabel} <ArrowRight size={14} />
            </Link>
          </div>
          <button type="button" className="fr-toast-close" aria-label={`Dismiss alert for ${alert.code}`} onClick={() => onDismiss(alert.id)}>
            <X size={15} />
          </button>
        </div>
      ))}
      {alerts.length > MAX_TOASTS && <p className="fr-toasts-more">+{alerts.length - MAX_TOASTS} more under the bell</p>}
    </div>
  );
}
