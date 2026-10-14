import { useState } from "react";
import { ArrowLeft, CircleCheck, TriangleAlert, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { RouteMap } from "./sections/RouteMap";
import { TemperatureGauge, TemperatureTrend } from "./sections/TemperatureCharts";
import { DELIVERY_STEPS, deliveries, type Delivery } from "./data/mockProducer";
import { TEMPERATURE_RANGE, deliveryStatus, etaText, type DeliveryIssue } from "./data/deliveries";
import { formatKg } from "./data/format";
import { useProducer } from "./data/producerContext";

const ISSUE_REASONS = ["Delivery delayed", "Goods damaged", "Quantity mismatch", "Temperature problem", "Other"];

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

function Timeline({ delivery }: { delivery: Delivery }) {
  return (
    <ol className="ph-timeline">
      {DELIVERY_STEPS.map((label, index) => {
        const event = delivery.events.find((item) => item.step === index);
        const state = index < delivery.step || (index === 3 && delivery.step === 3) ? "done" : index === delivery.step ? "current" : "todo";
        return (
          <li key={label} className={`ph-timeline-step ph-timeline-step--${state}`}>
            <span className="ph-timeline-dot" aria-hidden="true" />
            <div>
              <p className="ph-timeline-label">{label}</p>
              {event ? (
                <p className="ph-timeline-meta">
                  {event.time} · {event.place}
                  {event.note && <span>{event.note}</span>}
                </p>
              ) : (
                <p className="ph-timeline-meta">{index === 3 ? `Expected ${delivery.eta}` : "Pending"}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const minutesOf = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

function formatDuration(minutes: number) {
  if (minutes < 60) return `about ${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return `about ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

/** Plain-language verdict first, then the chart; written for a farmer, not a logistics engineer. */
function TemperatureLog({ delivery }: { delivery: Delivery }) {
  const readings = delivery.temperatures;
  const { min, max } = TEMPERATURE_RANGE;
  const isOut = (celsius: number) => celsius < min || celsius > max;
  const delivered = delivery.step === 3;

  const latest = readings.at(-1)!;
  const peak = readings.reduce((top, reading) => (reading.celsius > top.celsius ? reading : top), readings[0]);
  const lowest = readings.reduce((low, reading) => (reading.celsius < low.celsius ? reading : low), readings[0]);
  const outside = readings.filter((reading) => isOut(reading.celsius));
  // Each reading stands for the interval until the next one (the sensor logs about hourly).
  const interval = readings.length > 1 ? (minutesOf(latest.time) - minutesOf(readings[0].time)) / (readings.length - 1) : 60;
  const outsideMinutes = Math.round(outside.length * interval);
  const tooWarm = outside.some((reading) => reading.celsius > max);

  const verdict =
    outside.length === 0
      ? { ok: true, title: "Kept cold the whole way", text: `Every reading stayed inside the safe range.` }
      : tooWarm
        ? {
            ok: false,
            title: `Got slightly too warm ${outside.length === 1 ? `once, at ${peak.time}` : `${outside.length} times`}`,
            text: "Short spikes rarely damage fruit, but the buyer may check it on arrival.",
          }
        : {
            ok: false,
            title: `Got too cold ${outside.length === 1 ? `once, at ${lowest.time}` : `${outside.length} times`}`,
            text: "Cold damage can show as dark spots; the buyer may check it on arrival.",
          };

  return (
    <div className="ph-temp">
      <div className="ph-gauge-wrap">
        <TemperatureGauge value={latest.celsius} range={TEMPERATURE_RANGE} caption={delivered ? "last reading" : "now"} />
        <p className="ph-gauge-note">Safe {min}–{max} °C</p>
      </div>

      <div className="ph-temp-side">
        <p className={verdict.ok ? "ph-temp-title" : "ph-temp-title ph-temp-title--warn"}>
          {verdict.ok ? <CircleCheck size={18} /> : <TriangleAlert size={18} />} {verdict.title}
        </p>
        <p className="ph-temp-text">{verdict.text}</p>

        <TemperatureTrend readings={readings} range={TEMPERATURE_RANGE} />

        <p className="ph-temp-facts">
          Highest {peak.celsius.toFixed(1)} °C at {peak.time}
          {outside.length > 0 && <> · {formatDuration(outsideMinutes)} outside the safe range</>}
        </p>
      </div>
    </div>
  );
}

function ReportProblem({ reported, onReport }: { reported?: DeliveryIssue; onReport: (issue: DeliveryIssue) => void }) {
  if (reported) {
    return (
      <div className="ph-reported-box">
        <p className="ph-offered"><CircleCheck size={16} /> You reported: {reported.reason}. A coordinator has been notified.</p>
        {reported.note && <p className="ph-muted">“{reported.note}”</p>}
      </div>
    );
  }

  return (
    <form
      className="ph-problem-form"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onReport({ reason: String(data.get("reason")), note: String(data.get("note") ?? "").trim() });
      }}
    >
      <p className="ph-section-sub">A coordinator will follow up with you and the carrier.</p>
      <fieldset>
        <legend>What happened?</legend>
        {ISSUE_REASONS.map((reason, index) => (
          <label key={reason}>
            <input type="radio" name="reason" value={reason} defaultChecked={index === 0} /> {reason}
          </label>
        ))}
      </fieldset>
      <label className="ph-problem-note">
        Details (optional)
        <textarea name="note" rows={3} placeholder="For example: buyer counted 110 crates instead of 120." />
      </label>
      <div className="ph-problem-actions">
        <button type="submit" className="ph-btn ph-btn--primary">Send to coordinator</button>
      </div>
    </form>
  );
}
