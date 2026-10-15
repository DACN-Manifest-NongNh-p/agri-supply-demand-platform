import { Check } from "lucide-react";
import { formatKg } from "../../Producer/data/format";
import { DEMAND_STAGES, demandStageLabel, type DemandStatus, type Fulfilment } from "../data/demands";

/** How much of a demand is confirmed, reserved and still open, as one segmented bar. */
export function FulfilmentBar({ quantityKg, fulfilment, compact = false }: { quantityKg: number; fulfilment: Fulfilment; compact?: boolean }) {
  const { allocatedKg, heldKg, openKg } = fulfilment;
  const share = (kg: number) => `${Math.min(100, (kg / quantityKg) * 100)}%`;
  const percent = Math.min(100, Math.round((allocatedKg / quantityKg) * 100));

  return (
    <div className={compact ? "bu-fill bu-fill--compact" : "bu-fill"}>
      <div
        className="bu-fill-track"
        role="img"
        aria-label={`${formatKg(allocatedKg)} confirmed, ${formatKg(heldKg)} reserved, ${formatKg(openKg)} open of ${formatKg(quantityKg)}`}
      >
        <span className="bu-fill-done" style={{ width: share(allocatedKg) }} />
        <span className="bu-fill-held" style={{ width: share(heldKg) }} />
      </div>
      {compact ? (
        <p className="bu-fill-caption">
          <strong>{percent}%</strong> confirmed{heldKg > 0 && <> · {formatKg(heldKg)} reserved</>}
        </p>
      ) : (
        <ul className="bu-fill-legend">
          <li><span className="bu-key bu-key--done" />{formatKg(allocatedKg)} confirmed</li>
          {heldKg > 0 && <li><span className="bu-key bu-key--held" />{formatKg(heldKg)} reserved</li>}
          <li><span className="bu-key bu-key--open" />{formatKg(openKg)} open</li>
        </ul>
      )}
    </div>
  );
}

/** New → Sourcing → Partly covered → Fully covered → Completed. */
export function DemandSteps({ status }: { status: DemandStatus }) {
  const current = DEMAND_STAGES.findIndex((stage) => stage.status === status);
  return (
    <ol className="ph-offer-steps bu-steps" aria-label={`Demand status: ${demandStageLabel(status)}`}>
      {DEMAND_STAGES.map((stage, index) => {
        const done = index <= current;
        const next = index === current + 1;
        return (
          <li
            key={stage.status}
            className={done ? "ph-offer-step ph-offer-step--done" : next ? "ph-offer-step ph-offer-step--next" : "ph-offer-step"}
          >
            <span className="ph-offer-dot">{done && <Check size={12} strokeWidth={3} />}</span>
            <span className="ph-offer-step-label">{stage.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function DemandStatusPill({ status }: { status: DemandStatus }) {
  return <span className={`bu-status bu-status--${status}`}>{demandStageLabel(status)}</span>;
}
