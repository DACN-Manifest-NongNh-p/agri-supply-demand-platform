// Tab panels of a delivery's detail page, shared by every area. Temperature lives on the map (LiveTemperature).
import { CircleCheck } from "lucide-react";
import { DELIVERY_STEPS, type Delivery } from "../data/mockProducer";
import type { DeliveryIssue } from "../data/deliveries";

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
