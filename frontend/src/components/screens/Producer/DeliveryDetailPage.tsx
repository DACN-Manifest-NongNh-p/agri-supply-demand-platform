import { useState } from "react";
import { ArrowLeft, TriangleAlert, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { RouteMap } from "./sections/RouteMap";
import { ReportProblem, TemperatureLog, Timeline } from "./sections/DeliveryPanels";
import { DELIVERY_STEPS, deliveries } from "./data/mockProducer";
import { deliveryStatus, etaText } from "./data/deliveries";
import { formatKg } from "./data/format";
import { useProducer } from "./data/producerContext";

type Tab = "timeline" | "temperature" | "proof" | "report";

export default function DeliveryDetailPage() {
  const { id } = useParams();
  const { batches, deliveryIssues, reportDeliveryIssue } = useProducer();
  const [tab, setTab] = useState<Tab>("timeline");
  const delivery = deliveries.find((item) => item.id === id);

  if (!delivery) {
    return (
      <main className="ph-main">
        <Link to="/producer/deliveries" className="ph-back"><ArrowLeft size={16} /> All deliveries</Link>
        <p className="ph-empty">Delivery {id} was not found.</p>
      </main>
    );
  }

  const reported = deliveryIssues[delivery.id];
  const status = deliveryStatus(delivery, reported);
  const delivered = delivery.step === 3;
  const batchOnCalendar = batches.some((batch) => batch.code === delivery.batch);

  const tabs: { id: Tab; label: string }[] = [
    { id: "timeline", label: "Timeline" },
    { id: "temperature", label: "Temperature" },
    ...(delivery.receipt ? [{ id: "proof" as const, label: "Proof of delivery" }] : []),
    { id: "report", label: reported ? "Reported problem" : "Report a problem" },
  ];

  return (
    <main className="ph-main">
      <Link to="/producer/deliveries" className="ph-back">
        <ArrowLeft size={16} /> All deliveries
      </Link>

      <RouteMap delivery={delivery} status={status}>
        {(delivery.issue || reported) && (
          <p className="ph-map-alert">
            <TriangleAlert size={16} />
            <span>{reported ? `You reported: ${reported.reason}` : delivery.issue}</span>
          </p>
        )}

        <aside className="ph-map-panel" aria-label="Shipment summary">
        
          <p className="ph-map-panel-label">{delivered ? "Delivered" : "Estimated arrival"}</p>
          <p className="ph-map-panel-eta">{etaText(delivery)}</p>

          <h1 className="ph-map-panel-title">{delivery.batch} → {delivery.buyer}</h1>
          <p className="ph-map-panel-meta">
            {formatKg(delivery.quantityKg)} {delivery.product} · {delivery.lastSeen}
          </p>

          <ol className="ph-mini-steps" aria-label={`Progress: ${DELIVERY_STEPS[delivery.step]}`}>
            {DELIVERY_STEPS.map((step, index) => (
              <li key={step} className={index <= delivery.step ? "ph-mini-step ph-mini-step--done" : "ph-mini-step"}>
                <span />
                {step}
              </li>
            ))}
          </ol>

          <ol className="ph-panel-route" aria-label="Route">
            <li>
              <span className="ph-panel-route-dot" aria-hidden="true" />
              <span><small>From</small>{delivery.origin}</span>
            </li>
            <li>
              <span className="ph-panel-route-dot ph-panel-route-dot--dest" aria-hidden="true" />
              <span><small>To</small>{delivery.destination}</span>
            </li>
          </ol>

          {/* Carrier only: producers don't contact drivers directly (problems go through a coordinator). */}
          <div className="ph-carrier">
            <Truck size={16} aria-hidden="true" />
            <span>
              <small>Carrier</small>
              <strong>{delivery.carrier}</strong>
            </span>
          </div>
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
            className={item.id === "report" && !reported ? "ph-detail-tab ph-detail-tab--warn" : "ph-detail-tab"}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
        <span className="ph-detail-links">
          {batchOnCalendar && <Link to={`/producer/batches?batch=${delivery.batch}`}>Batch {delivery.batch}</Link>}
          <Link to="/producer/demand#offers">Offer &amp; allocation</Link>
        </span>
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
        {tab === "report" && (
          <ReportProblem reported={reported} onReport={(issue) => reportDeliveryIssue(delivery.id, issue)} />
        )}
      </section>
    </main>
  );
}
