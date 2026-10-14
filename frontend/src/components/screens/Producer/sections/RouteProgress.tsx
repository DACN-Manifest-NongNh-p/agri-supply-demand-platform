import type { Delivery } from "../data/mockProducer";
import type { DeliveryStatus } from "../data/deliveries";

/** Thin origin → current position → destination bar; the marker sits at `delivery.progress`. */
export function RouteProgress({ delivery, status }: { delivery: Delivery; status: DeliveryStatus }) {
  const percent = Math.round(Math.min(1, Math.max(0, delivery.progress)) * 100);

  return (
    <div
      className={`ph-route-bar ph-route-bar--${status}`}
      role="img"
      aria-label={`${percent}% of the way from ${delivery.fromShort} to ${delivery.toShort}`}
    >
      <div className="ph-route-track">
        <span className="ph-route-fill" style={{ width: `${percent}%` }} />
        <span className="ph-route-end ph-route-end--origin" />
        <span className="ph-route-end ph-route-end--dest" />
        {percent < 100 && <span className="ph-route-now" style={{ left: `${percent}%` }} />}
      </div>
      <div className="ph-route-labels">
        <span>{delivery.fromShort}</span>
        <span>{delivery.toShort}</span>
      </div>
    </div>
  );
}
