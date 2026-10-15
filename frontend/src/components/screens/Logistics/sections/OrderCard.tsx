import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Snowflake, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDay, formatKg } from "../../Producer/data/format";
import { blockersFor, fitsFor, formatVnd, orderWarnings } from "../data/capacity";
import { DECLINE_REASONS, type TransportOrder } from "../data/mockLogistics";
import { useLogistics } from "../data/logisticsContext";

type Mode = "idle" | "accept" | "decline";

/** One transport order and the provider's answer: accept with a vehicle, or decline. */
export function OrderCard({ order }: { order: TransportOrder }) {
  const { fleet, serviceAreas, operatingRoutes, schedule, acceptOrder, declineOrder } = useLogistics();
  const [mode, setMode] = useState<Mode>("idle");
  const fits = fitsFor(order, fleet);
  const usable = fits.filter((fit) => fit.fits);
  const [plate, setPlate] = useState(usable[0]?.vehicle.plate ?? "");
  const chosen = usable.find((fit) => fit.vehicle.plate === plate)?.vehicle ?? usable[0]?.vehicle;
  const [driver, setDriver] = useState(chosen?.driver ?? "");
  const warnings = orderWarnings(order, { areas: serviceAreas, routes: operatingRoutes, schedule });
  const open = order.status === "new";

  const accept = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chosen) return;
    acceptOrder(order.id, chosen.plate, driver.trim() || "Driver to be named");
    setMode("idle");
  };

  const decline = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const reason = String(data.get("reason"));
    const note = String(data.get("note") ?? "").trim();
    declineOrder(order.id, note ? `${reason}: ${note}` : reason);
    setMode("idle");
  };

  const defaultReason =
    usable.length === 0
      ? DECLINE_REASONS[0]
      : warnings.some((warning) => warning.kind !== "schedule")
        ? DECLINE_REASONS[1]
        : DECLINE_REASONS[2];

  return (
    <article id={order.id} className="ph-card lg-order">
      <div className="lg-order-top">
        <div className="lg-order-title">
          <h3>
            {order.pickup.short} → {order.dropoff.short}
          </h3>
          <p>
            {order.id} · {order.producer} → {order.buyer}
          </p>
        </div>
        <div className="lg-order-pay">
          <strong>{formatVnd(order.payVnd)}</strong>
          {open && <span className={order.respondWithinHours <= 6 ? "lg-due lg-due--soon" : "lg-due"}>{order.respondWithinHours} h to answer</span>}
          {order.status === "accepted" && <span className="lg-due lg-due--ok">Accepted</span>}
          {order.status === "declined" && <span className="lg-due">Declined</span>}
        </div>
      </div>

      <dl className="lg-facts">
        <div>
          <dt>Load</dt>
          <dd>
            {formatKg(order.quantityKg)} {order.product.toLowerCase()}
            {order.needsCold && <Snowflake size={13} className="lg-cold" aria-label="needs cold chain" />}
          </dd>
        </div>
        <div>
          <dt>Pickup</dt>
          <dd>
            {formatDay(order.pickup.day)}, {order.pickup.window}
          </dd>
        </div>
        <div>
          <dt>Drop-off</dt>
          <dd>
            {formatDay(order.dropoff.day)}, {order.dropoff.window}
          </dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>{order.distanceKm} km</dd>
        </div>
      </dl>

      {order.note && <p className="lg-note">{order.note}</p>}

      {open && usable.length === 0 && (
        <div className="lg-nofit" role="note">
          <p className="lg-nofit-title">
            <TriangleAlert size={15} aria-hidden="true" /> No vehicle can take this order
          </p>
          <dl>
            {blockersFor(fits).map((blocker) => (
              <div key={blocker.label}>
                <dt>{blocker.label}</dt>
                <dd>
                  {blocker.vehicles.map((vehicle) => (
                    <span key={vehicle}>{vehicle}</span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      {open && warnings.length > 0 && (
        <p className="lg-flag">
          {warnings
            .map((warning) => warning.text)
            .join("; ")
            .replace(/^./, (letter) => letter.toUpperCase())}
          .
        </p>
      )}

      {open && mode === "idle" && (
        <div className="lg-order-actions">
          {chosen && (
            <button type="button" className="ph-btn ph-btn--primary" onClick={() => setMode("accept")}>
              Accept
            </button>
          )}
          <button type="button" className="ph-btn" onClick={() => setMode("decline")}>
            Decline
          </button>
          {chosen ? (
            <span className="ph-muted">
              {chosen.plate}
              {usable.length > 1 && ` or ${usable.length - 1} more`}
            </span>
          ) : (
            <Link to="/logistics/fleet" className="ph-link-btn">
              Fleet <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}

      {open && mode === "accept" && chosen && (
        <form className="lg-answer" onSubmit={accept}>
          <label className="ph-field">
            <span>Vehicle</span>
            <select
              value={chosen.plate}
              onChange={(event) => {
                setPlate(event.target.value);
                setDriver(usable.find((fit) => fit.vehicle.plate === event.target.value)?.vehicle.driver ?? "");
              }}
            >
              {usable.map(({ vehicle }) => (
                <option key={vehicle.plate} value={vehicle.plate}>
                  {vehicle.plate} · {formatKg(vehicle.capacityKg)}
                </option>
              ))}
            </select>
          </label>
          <label className="ph-field">
            <span>Driver</span>
            <input value={driver} onChange={(event) => setDriver(event.target.value)} />
          </label>
          <div className="lg-order-actions">
            <button type="submit" className="ph-btn ph-btn--primary">
              Confirm
            </button>
            <button type="button" className="ph-btn" onClick={() => setMode("idle")}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {open && mode === "decline" && (
        <form className="lg-answer" onSubmit={decline}>
          <label className="ph-field">
            <span>Reason</span>
            <select name="reason" defaultValue={defaultReason}>
              {DECLINE_REASONS.map((reason) => (
                <option key={reason}>{reason}</option>
              ))}
            </select>
          </label>
          <label className="ph-field">
            <span>Note (optional)</span>
            <input name="note" />
          </label>
          <div className="lg-order-actions">
            <button type="submit" className="ph-btn ph-btn--primary">
              Decline
            </button>
            <button type="button" className="ph-btn" onClick={() => setMode("idle")}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {order.status === "accepted" && (
        <div className="lg-order-actions">
          <span className="co-done">
            <Check size={14} aria-hidden="true" /> {order.vehiclePlate} · {order.driver}
          </span>
          {order.deliveryId && (
            <Link to={`/logistics/trips/${order.deliveryId}`} className="ph-link-btn co-push-right">
              Trip {order.deliveryId} <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}

      {order.status === "declined" && <p className="lg-note">{order.declineReason}</p>}
    </article>
  );
}
