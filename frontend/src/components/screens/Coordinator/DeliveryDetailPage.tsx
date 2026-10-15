import { useState, type FormEvent } from "react";
import { ArrowLeft, Phone, TriangleAlert, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { RouteMap } from "../Producer/sections/RouteMap";
import { TemperatureLog, Timeline } from "../Producer/sections/DeliveryPanels";
import { DELIVERY_STEPS } from "../Producer/data/mockProducer";
import { deliveryStatus, etaText } from "../Producer/data/deliveries";
import { formatKg } from "../Producer/data/format";
import { CARRIER_DESKS, deliveries } from "./data/mockCoordinator";
import { useCoordinator } from "./data/coordinatorContext";
import { deliveryIncident } from "./data/queue";

type Tab = "timeline" | "temperature" | "proof" | "updates";

function Updates({ deliveryId, buyer, producer }: { deliveryId: string; buyer: string; producer: string }) {
  const { deliveryUpdates, postDeliveryUpdate } = useCoordinator();
  const updates = deliveryUpdates[deliveryId] ?? [];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const text = String(new FormData(form).get("text") ?? "").trim();
    if (!text) return;
    postDeliveryUpdate(deliveryId, text);
    form.reset();
  };

  return (
    <div className="co-updates">
      {updates.length > 0 && (
        <ul className="co-update-list">
          {updates.map((update, index) => (
            <li key={index}>
              <span className="ph-muted">{update.time}</span>
              <p>{update.text}</p>
            </li>
          ))}
        </ul>
      )}
      <form className="co-resolve" onSubmit={submit}>
        <label htmlFor="update-text">Update for {buyer} and {producer}</label>
        <textarea id="update-text" name="text" rows={3} placeholder="For example: replacement truck left Phan Thiet at 14:20, new arrival tomorrow 09:00." />
        <div className="co-resolve-actions">
          <button type="submit" className="ph-btn ph-btn--primary">Send update</button>
          <span className="ph-muted">Sent to both sides as a notification.</span>
        </div>
      </form>
    </div>
  );
}

export default function DeliveryDetailPage() {
  const { id } = useParams();
  const [tab, setTab] = useState<Tab>("timeline");
  const delivery = deliveries.find((item) => item.id === id);

  if (!delivery) {
    return (
      <main className="ph-main">
        <Link to="/coordinator/deliveries" className="ph-back"><ArrowLeft size={16} /> All deliveries</Link>
        <p className="ph-empty">Delivery {id} was not found.</p>
      </main>
    );
  }

  const status = deliveryStatus(delivery);
  const delivered = delivery.step === 3;
  const desk = CARRIER_DESKS[delivery.carrier];
  const incident = deliveryIncident(delivery);

  const tabs: { id: Tab; label: string }[] = [
    { id: "timeline", label: "Timeline" },
    { id: "temperature", label: "Temperature" },
    ...(delivery.receipt ? [{ id: "proof" as const, label: "Proof of delivery" }] : []),
    { id: "updates", label: "Updates to both sides" },
  ];

  return (
    <main className="ph-main">
      <Link to="/coordinator/deliveries" className="ph-back">
        <ArrowLeft size={16} /> All deliveries
      </Link>

      <RouteMap delivery={delivery} status={status}>
        {incident && (
          <p className="ph-map-alert">
            <TriangleAlert size={16} />
            <span>{incident}</span>
          </p>
        )}

        <aside className="ph-map-panel" aria-label="Shipment summary">
          <p className="ph-map-panel-label">{delivered ? "Delivered" : "Estimated arrival"}</p>
          <p className="ph-map-panel-eta">{etaText(delivery)}</p>

          <h1 className="ph-map-panel-title">{delivery.batch}, {delivery.product}</h1>
          <p className="ph-map-panel-meta">
            {formatKg(delivery.quantityKg)} · {delivery.lastSeen}
          </p>
          <p className="co-parties">
            {delivery.producer} <span aria-label="to">→</span> {delivery.buyer}
          </p>

          <ol className="ph-mini-steps" aria-label={`Progress: ${DELIVERY_STEPS[delivery.step]}`}>
            {DELIVERY_STEPS.map((step, index) => (
              <li key={step} className={index <= delivery.step ? "ph-mini-step ph-mini-step--done" : "ph-mini-step"}>
                <span />
                {step}
              </li>
            ))}
          </ol>

          {/* Only the coordinator sees the driver and the dispatch desk. */}
          <div className="ph-carrier">
            <Truck size={16} aria-hidden="true" />
            <span>
              <small>Carrier</small>
              <strong>{delivery.carrier}</strong>
              <span className="co-driver">
                {delivery.driver.name} · {delivery.vehiclePlate}
              </span>
            </span>
          </div>
          {desk && !delivered && (
            <a className="ph-btn co-call" href={`tel:${desk.replace(/\s/g, "")}`}>
              <Phone size={15} /> Dispatch desk {desk}
            </a>
          )}
        </aside>
      </RouteMap>

      <div className="ph-detail-tabs" role="tablist" aria-label="Delivery details">
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
        {tab === "timeline" && <Timeline delivery={delivery} />}
        {tab === "temperature" && <TemperatureLog delivery={delivery} />}
        {tab === "proof" && delivery.receipt && (
          <dl className="ph-proof">
            <div><dt>Received by</dt><dd>{delivery.receipt.receivedBy}</dd></div>
            <div><dt>Quantity received</dt><dd>{formatKg(delivery.receipt.receivedKg)} <small>of {formatKg(delivery.quantityKg)}</small></dd></div>
            {delivery.receipt.note && <div><dt>Note</dt><dd>{delivery.receipt.note}</dd></div>}
          </dl>
        )}
        {tab === "updates" && <Updates deliveryId={delivery.id} buyer={delivery.buyer} producer={delivery.producer} />}
      </section>
    </main>
  );
}
