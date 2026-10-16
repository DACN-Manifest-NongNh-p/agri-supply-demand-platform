import { Check, X } from "lucide-react";
import "./orders.css";

/** How an order card is tinted: needs you, waits for the other side, moving, finished, or ended. */
export type OrderTone = "attention" | "waiting" | "active" | "done" | "closed";

type Props = {
  /** The four step names, e.g. You reserved → Both agreed → On the way → Delivered. */
  steps: string[];
  /** Index of the last step reached (0–3). */
  reached: number;
  /** The order ended at the agreement step (declined); that step shows as such. */
  closed?: boolean;
  /** What the second step reads when closed. */
  closedLabel?: string;
  label: string;
};

/** Four dots joined by a line: done steps filled, the next one dashed. Shared by buyer and producer orders. */
export function LifecycleSteps({ steps, reached, closed = false, closedLabel = "Declined", label }: Props) {
  return (
    <ol className={closed ? "ord-steps is-closed" : "ord-steps"} aria-label={label}>
      {steps.map((step, index) => {
        const done = !closed && index <= reached;
        const now = !closed && index === reached + 1;
        return (
          <li key={step} className={done ? "is-done" : now ? "is-now" : undefined}>
            <span className="ord-dot" aria-hidden="true">
              {done ? <Check size={11} strokeWidth={3} /> : closed && index === 1 ? <X size={11} strokeWidth={3} /> : null}
            </span>
            <span className="ord-step-label">{closed && index === 1 ? closedLabel : step}</span>
          </li>
        );
      })}
    </ol>
  );
}
