// Tab panels of a delivery's detail page, shared by the producer and buyer areas.
import { CircleCheck, TriangleAlert } from "lucide-react";
import { TemperatureGauge, TemperatureTrend } from "./TemperatureCharts";
import { DELIVERY_STEPS, type Delivery } from "../data/mockProducer";
import { TEMPERATURE_RANGE, type DeliveryIssue } from "../data/deliveries";

const ISSUE_REASONS = ["Delivery delayed", "Goods damaged", "Quantity mismatch", "Temperature problem", "Other"];

export function Timeline({ delivery }: { delivery: Delivery }) {
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
export function TemperatureLog({ delivery }: { delivery: Delivery }) {
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

type ReportProps = {
  reported?: DeliveryIssue;
  onReport: (issue: DeliveryIssue) => void;
  /** Example note, worded for whoever is reporting. */
  placeholder?: string;
};

export function ReportProblem({ reported, onReport, placeholder = "For example: buyer counted 110 crates instead of 120." }: ReportProps) {
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
        <textarea name="note" rows={3} placeholder={placeholder} />
      </label>
      <div className="ph-problem-actions">
        <button type="submit" className="ph-btn ph-btn--primary">Send to coordinator</button>
      </div>
    </form>
  );
}
