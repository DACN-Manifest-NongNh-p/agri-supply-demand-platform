import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, Phone, TriangleAlert, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { RouteMap } from "../Producer/sections/RouteMap";
import { Timeline } from "../Producer/sections/DeliveryPanels";
import { DELIVERY_STEPS } from "../Producer/data/mockProducer";
import { deliveryStatus, etaText } from "../Producer/data/deliveries";
import { formatKg } from "../Producer/data/format";
import type { MarketDelivery } from "../Coordinator/data/mockCoordinator";
import { INCIDENT_TYPES } from "./data/mockLogistics";
import { useLogistics } from "./data/logisticsContext";

/** Farmora's coordination desk; carriers call it, never the producer or buyer. */
const COORDINATION_DESK = "1900 6868";

type Tab = "status" | "incidents" | "timeline" | "proof";

/** The one thing to do next on the trip, as a single form. */
function NextStep({ trip }: { trip: MarketDelivery }) {
  const { advanceTrip, completeTrip } = useLogistics();
  const [error, setError] = useState("");

  if (trip.step === 3) {
    return (
      <p className="co-done">
        <Check size={14} aria-hidden="true" /> Delivered. {trip.receipt && `Received by ${trip.receipt.receivedBy}, ${formatKg(trip.receipt.receivedKg)}.`}
      </p>
    );
  }

  if (trip.step === 2) {
    const submit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const receivedBy = String(data.get("receivedBy") ?? "").trim();
      const receivedKg = Number(data.get("receivedKg"));
      if (!receivedBy || !Number.isFinite(receivedKg) || receivedKg <= 0) {
        setError("Enter who received the goods and how many kilograms they signed for.");
        return;
      }
      const note = String(data.get("note") ?? "").trim();
      completeTrip(trip.id, { receivedBy, receivedKg, note: note || undefined });
    };
    return (
      <form className="lg-step-form" onSubmit={submit} noValidate>
        <h3>Mark delivered</h3>
        <div className="ph-field-row">
          <label className="ph-field">
            <span>Received by</span>
            <input name="receivedBy" placeholder="Name and role at the receiving dock" onChange={() => setError("")} />
          </label>
          <label className="ph-field">
            <span>Quantity signed for (kg)</span>
            <input name="receivedKg" type="number" min="1" defaultValue={trip.quantityKg} onChange={() => setError("")} />
          </label>
        </div>
        <label className="ph-field">
          <span>Note (optional)</span>
          <input name="note" placeholder="For example: 2 crates rejected for bruising." />
        </label>
        {error && <p className="ph-field-error">{error}</p>}
        <div className="co-resolve-actions">
          <button type="submit" className="ph-btn ph-btn--primary">
            <Check size={16} /> Mark delivered
          </button>
        </div>
      </form>
    );
  }

  const pickup = trip.step === 0;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    advanceTrip(trip.id, String(new FormData(event.currentTarget).get("note") ?? "").trim());
    event.currentTarget.reset();
  };
  return (
    <form className="lg-step-form" onSubmit={submit}>
      <h3>{pickup ? "Confirm pickup" : "Start the route"}</h3>
      <label className="ph-field">
        <span>Note (optional)</span>
        <input name="note" placeholder={pickup ? "For example: 120 crates, sealed, reefer set to 4 °C." : "For example: left on time."} />
      </label>
      <div className="co-resolve-actions">
        <button type="submit" className="ph-btn ph-btn--primary">
          <Check size={16} /> {pickup ? "Picked up" : "On the road"}
        </button>
      </div>
    </form>
  );
}

function Incidents({ trip }: { trip: MarketDelivery }) {
  const { incidents, reportIncident, clearIncident } = useLogistics();
  const list = incidents[trip.id] ?? [];
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const type = String(data.get("type"));
    const note = String(data.get("note") ?? "").trim();
    const newEta = String(data.get("eta") ?? "").trim();
    if (!note) {
      setError("Say what happened and what you are doing about it.");
      return;
    }
    reportIncident(trip.id, { type, note, newEta: newEta || undefined });
    event.currentTarget.reset();
  };

  return (
    <div className="lg-incidents">
      {trip.issue && (
        <div className="co-match-warn">
          <TriangleAlert size={15} aria-hidden="true" />
          <div>
            <p>{trip.issue}</p>
            <p className="ph-muted">Sent to the Farmora coordinator.</p>
            <button type="button" className="ph-btn lg-clear" onClick={() => clearIncident(trip.id)}>
              Back on schedule
            </button>
          </div>
        </div>
      )}

      {list.length > 0 && (
        <ul className="co-update-list">
          {list.map((item, index) => (
            <li key={index}>
              <span className="ph-muted">
                {item.time} · {item.type}
                {item.cleared && " · resolved"}
              </span>
              <p>
                {item.note}
                {item.newEta && ` New arrival: ${item.newEta}.`}
              </p>
            </li>
          ))}
        </ul>
      )}

      {trip.step < 3 && (
        <form className="lg-step-form" onSubmit={submit} noValidate>
          <h3>Report an incident</h3>
          <p className="ph-section-sub">Goes to the Farmora coordinator, who updates the producer and buyer. Urgent: {COORDINATION_DESK}.</p>
          <div className="ph-field-row">
            <label className="ph-field">
              <span>What happened</span>
              <select name="type" defaultValue={INCIDENT_TYPES[0]}>
                {INCIDENT_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="ph-field">
              <span>New arrival (optional)</span>
              <input name="eta" placeholder="For example: Tomorrow, 09:00" />
            </label>
          </div>
          <label className="ph-field">
            <span>Details</span>
            <textarea name="note" rows={3} placeholder="For example: tyre blowout near Dau Giay, replacement truck leaves Bien Hoa at 15:00." onChange={() => setError("")} />
          </label>
          {error && <p className="ph-field-error">{error}</p>}
          <div className="co-resolve-actions">
            <button type="submit" className="ph-btn ph-btn--primary">
              Send to coordinator
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function TripDetailPage() {
  const { id } = useParams();
  const { trips } = useLogistics();
  const [tab, setTab] = useState<Tab>("status");
  const trip = trips.find((item) => item.id === id);

  if (!trip) {
    return (
      <main className="ph-main">
        <Link to="/logistics/trips" className="ph-back">
          <ArrowLeft size={16} /> All trips
        </Link>
        <p className="ph-empty">Trip {id} was not found.</p>
      </main>
    );
  }

  const status = deliveryStatus(trip);
  const delivered = trip.step === 3;
  const tabs: { id: Tab; label: string }[] = [
    { id: "status", label: delivered ? "Status" : "Update status" },
    { id: "incidents", label: trip.issue ? "Incident (open)" : "Incidents" },
    { id: "timeline", label: "Timeline" },
    ...(trip.receipt ? [{ id: "proof" as const, label: "Proof of delivery" }] : []),
  ];

  return (
    <main className="ph-main">
      <Link to="/logistics/trips" className="ph-back">
        <ArrowLeft size={16} /> All trips
      </Link>

      <RouteMap delivery={trip} status={status}>
        {(coldChain) => (
          <>
        {trip.issue && (
          <p className="ph-map-alert">
            <TriangleAlert size={16} />
            <span>{trip.issue}</span>
          </p>
        )}

        <aside className="ph-map-panel" aria-label="Trip summary">
          <p className="ph-map-panel-label">{delivered ? "Delivered" : "Due at drop-off"}</p>
          <p className="ph-map-panel-eta">{etaText(trip)}</p>

          <h1 className="ph-map-panel-title">
            {trip.id}, {trip.product}
          </h1>
          <p className="ph-map-panel-meta">
            {formatKg(trip.quantityKg)} · {trip.lastSeen}
          </p>
          <p className="co-parties">
            {trip.origin} <span aria-label="to">→</span> {trip.destination}
          </p>

          <ol className="ph-mini-steps" aria-label={`Progress: ${DELIVERY_STEPS[trip.step]}`}>
            {DELIVERY_STEPS.map((step, index) => (
              <li key={step} className={index <= trip.step ? "ph-mini-step ph-mini-step--done" : "ph-mini-step"}>
                <span />
                {step}
              </li>
            ))}
          </ol>

          {coldChain}

          <div className="ph-carrier">
            <Truck size={16} aria-hidden="true" />
            <span>
              <small>Vehicle</small>
              <strong>{trip.vehiclePlate}</strong>
              <span className="co-driver">{trip.driver.name}</span>
            </span>
          </div>
          {!delivered && (
            <a className="ph-btn co-call" href={`tel:${COORDINATION_DESK.replace(/\s/g, "")}`}>
              <Phone size={15} /> Farmora coordination {COORDINATION_DESK}
            </a>
          )}
        </aside>
          </>
        )}
      </RouteMap>

      <div className="ph-detail-tabs" role="tablist" aria-label="Trip details">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            className="ph-detail-tab"
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="ph-card ph-detail-panel" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "status" && <NextStep trip={trip} />}
        {tab === "incidents" && <Incidents trip={trip} />}
        {tab === "timeline" && <Timeline delivery={trip} />}
        {tab === "proof" && trip.receipt && (
          <dl className="ph-proof">
            <div>
              <dt>Received by</dt>
              <dd>{trip.receipt.receivedBy}</dd>
            </div>
            <div>
              <dt>Quantity received</dt>
              <dd>
                {formatKg(trip.receipt.receivedKg)} <small>of {formatKg(trip.quantityKg)}</small>
              </dd>
            </div>
            {trip.receipt.note && (
              <div>
                <dt>Note</dt>
                <dd>{trip.receipt.note}</dd>
              </div>
            )}
          </dl>
        )}
      </section>
    </main>
  );
}
