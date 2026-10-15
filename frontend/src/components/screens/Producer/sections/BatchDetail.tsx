import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { BATCH_STAGES, type Batch, type BatchStatus } from "../data/mockProducer";
import { formatDay, formatKg, nextStatus, stageLabel } from "../data/format";

const ISSUE_REASONS = ["Lower yield than declared", "Quality problem", "Batch no longer available", "Harvest delayed"];

type Props = {
  batch: Batch;
  issue?: string;
  onAdvance: (code: string, status: BatchStatus) => void;
  onReport: (code: string, reason: string) => void;
};

export function BatchDetail({ batch, issue, onAdvance, onReport }: Props) {
  const [reporting, setReporting] = useState(false);
  const next = nextStatus(batch.status);
  const current = BATCH_STAGES.findIndex((stage) => stage.status === batch.status);

  return (
    <article className="ph-batch-detail" aria-live="polite">
      <header>
        <div>
          <p className="ph-eyebrow">{batch.code} · {batch.plot}</p>
          <h3>{batch.product} <span>{batch.variety}, grade {batch.grade}</span></h3>
        </div>
        <dl className="ph-batch-facts">
          <div><dt>Declared</dt><dd>{formatKg(batch.quantityKg)}</dd></div>
          <div><dt>Allocated</dt><dd>{formatKg(batch.allocatedKg)}</dd></div>
          <div><dt>Still open</dt><dd>{formatKg(batch.quantityKg - batch.allocatedKg)}</dd></div>
          <div><dt>Harvest</dt><dd>{formatDay(batch.harvestDay)}</dd></div>
          <div><dt>Sell by</dt><dd>{formatDay(batch.sellByDay)}</dd></div>
        </dl>
      </header>

      <ol className="ph-stepper">
        {BATCH_STAGES.map((stage, index) => {
          const state = index < current ? "done" : index === current ? "current" : "todo";
          return (
            <li key={stage.status} className={`ph-step ph-step--${state}`}>
              <span className="ph-step-dot" />
              {stage.label}
            </li>
          );
        })}
      </ol>

      <div className="ph-batch-actions">
        {next && (
          <button type="button" className="ph-btn ph-btn--primary" onClick={() => onAdvance(batch.code, next)}>
            Move to “{stageLabel(next)}”
          </button>
        )}
        {issue ? (
          <span className="ph-reported">
            <TriangleAlert size={16} /> Reported: {issue}. A coordinator will follow up.
          </span>
        ) : (
          <button type="button" className="ph-btn ph-btn--warn" onClick={() => setReporting((value) => !value)} aria-expanded={reporting}>
            <TriangleAlert size={16} /> Report an issue
          </button>
        )}
      </div>

      {reporting && !issue && (
        <form
          className="ph-issue-form"
          onSubmit={(event) => {
            event.preventDefault();
            onReport(batch.code, new FormData(event.currentTarget).get("reason") as string);
            setReporting(false);
          }}
        >
          <fieldset>
            <legend>What is wrong with {batch.code}?</legend>
            {ISSUE_REASONS.map((reason, index) => (
              <label key={reason}>
                <input type="radio" name="reason" value={reason} defaultChecked={index === 0} /> {reason}
              </label>
            ))}
          </fieldset>
          <button type="submit" className="ph-btn ph-btn--primary">Send to coordinator</button>
        </form>
      )}
    </article>
  );
}
