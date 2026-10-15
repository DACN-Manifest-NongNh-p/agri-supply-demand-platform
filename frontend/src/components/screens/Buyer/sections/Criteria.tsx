import { Check, Minus, X } from "lucide-react";
import type { Criterion, CriterionState } from "../../Producer/data/matching";

const CRITERION_ICON: Record<CriterionState, typeof Check> = { pass: Check, partial: Minus, fail: X };

/** One chip per matching rule; the tooltip carries the detail. */
export function CriteriaChips({ criteria }: { criteria: Criterion[] }) {
  return (
    <ul className="ph-featured-criteria" aria-label="Why it matches">
      {criteria.map((criterion) => {
        const Icon = CRITERION_ICON[criterion.state];
        return (
          <li key={criterion.name} className={`ph-chip-criterion ph-chip-criterion--${criterion.state}`} title={criterion.detail}>
            <Icon size={12} strokeWidth={3} /> {criterion.name}
          </li>
        );
      })}
    </ul>
  );
}

/** The same rules written out, for the "see why" view. */
export function CriteriaList({ criteria }: { criteria: Criterion[] }) {
  return (
    <ul className="ph-criteria">
      {criteria.map((criterion) => {
        const Icon = CRITERION_ICON[criterion.state];
        return (
          <li key={criterion.name} className={`ph-criterion ph-criterion--${criterion.state}`}>
            <span className="ph-criterion-icon"><Icon size={14} strokeWidth={2.5} /></span>
            <strong>{criterion.name}</strong>
            <span>{criterion.detail}</span>
          </li>
        );
      })}
    </ul>
  );
}
