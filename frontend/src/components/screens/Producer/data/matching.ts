// Demo matching engine. In production the backend generates matches; the UI only renders them.
// Hard rules (a batch is not a match if any fails): same product, accepted grade, sellable on the
// needed-by day, some open quantity. Soft scoring: quantity coverage, freshness margin, distance.
import type { Batch, Demand } from "./mockProducer";
import { formatDay, formatKg } from "./format";

export type CriterionState = "pass" | "partial" | "fail";

export type Criterion = {
  name: "Product" | "Quantity" | "Grade" | "Timing" | "Location";
  state: CriterionState;
  detail: string;
};

export type Candidate = {
  batch: Batch;
  score: number;
  coverage: number;
  criteria: Criterion[];
  eligible: boolean;
};

export type MatchResult = {
  demand: Demand;
  best?: Candidate;
  /** Eligible batches, best first. */
  candidates: Candidate[];
  /** Every batch of the same product, eligible ones first, for the "batches considered" view. */
  considered: Candidate[];
  /** Why nothing matched, when `best` is undefined. */
  reason?: string;
};

const WEIGHTS = { quantity: 30, grade: 25, timing: 30, location: 15 };
const UNAVAILABLE: Batch["status"][] = ["in_transit", "delivered"];

function acceptedGrades(gradeWanted: string) {
  return gradeWanted.replace("Grade", "").split(/[–-]/).map((grade) => grade.trim());
}

/** Scores one batch against one demand. Exported so the buyer area ranks supply with the same rules. */
export function evaluate(demand: Demand, batch: Batch): Candidate {
  const open = UNAVAILABLE.includes(batch.status) ? 0 : batch.quantityKg - batch.allocatedKg;
  const coverage = Math.min(1, open / demand.quantityKg);
  const gradeOk = acceptedGrades(demand.gradeWanted).includes(batch.grade);
  const margin = batch.sellByDay - demand.neededByDay;
  const timingOk = batch.readyDay <= demand.neededByDay && margin >= 0;
  const freshness = Math.min(1, 0.55 + margin * 0.09);
  const locationFactor = Math.min(1, Math.max(0.5, 1 - demand.distanceKm / 1000));

  const criteria: Criterion[] = [
    {
      name: "Product",
      state: batch.product === demand.product ? "pass" : "fail",
      detail: `${batch.product} ${batch.product === demand.product ? "=" : "≠"} ${demand.product}`,
    },
    {
      name: "Quantity",
      state: open === 0 ? "fail" : coverage >= 1 ? "pass" : "partial",
      detail:
        open === 0
          ? `Nothing open on ${batch.code} (${batch.status.replace("_", " ")})`
          : coverage >= 1
            ? `${formatKg(open)} open covers ${formatKg(demand.quantityKg)}`
            : `${formatKg(open)} open covers ${Math.round(coverage * 100)}% of ${formatKg(demand.quantityKg)}`,
    },
    {
      name: "Grade",
      state: gradeOk ? "pass" : "fail",
      detail: `Grade ${batch.grade} ${gradeOk ? "is" : "is not"} accepted (${demand.gradeWanted})`,
    },
    {
      name: "Timing",
      state: !timingOk ? "fail" : margin >= 3 ? "pass" : "partial",
      detail:
        batch.readyDay > demand.neededByDay
          ? `Ready ${formatDay(batch.readyDay)}, after the ${formatDay(demand.neededByDay)} deadline`
          : margin < 0
            ? `Past sell-by (${formatDay(batch.sellByDay)}) before ${formatDay(demand.neededByDay)}`
            : `Ready ${formatDay(batch.readyDay)}, ${margin} ${margin === 1 ? "day" : "days"} of freshness left on delivery`,
    },
    {
      name: "Location",
      state: demand.distanceKm <= 250 ? "pass" : "partial",
      detail: `About ${demand.distanceKm} km to ${demand.destination}`,
    },
  ];

  const eligible = batch.product === demand.product && gradeOk && timingOk && open > 0;
  const score = eligible
    ? Math.round(WEIGHTS.quantity * coverage + WEIGHTS.grade + WEIGHTS.timing * freshness + WEIGHTS.location * locationFactor)
    : 0;

  return { batch, score, coverage, criteria, eligible };
}

function noMatchReason(demand: Demand, evaluated: Candidate[]) {
  const sameProduct = evaluated.filter((candidate) => candidate.batch.product === demand.product);
  if (sameProduct.length === 0) return `You have no ${demand.product.toLowerCase()} batches declared.`;
  const blocker = sameProduct[0].criteria.find((criterion) => criterion.state === "fail");
  return blocker ? `${sameProduct[0].batch.code}: ${blocker.detail}.` : "No batch meets every requirement.";
}

export function matchDemand(demand: Demand, batches: Batch[]): MatchResult {
  const evaluated = batches.map((batch) => evaluate(demand, batch));
  const candidates = evaluated.filter((candidate) => candidate.eligible).sort((a, b) => b.score - a.score);
  const considered = evaluated
    .filter((candidate) => candidate.batch.product === demand.product)
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score);
  return {
    demand,
    best: candidates[0],
    candidates,
    considered,
    reason: candidates.length === 0 ? noMatchReason(demand, evaluated) : undefined,
  };
}

/** Matched demands first (best score first), then demands without a suitable batch. */
export function matchAll(demands: Demand[], batches: Batch[]) {
  return demands
    .map((demand) => matchDemand(demand, batches))
    .sort((a, b) => (b.best?.score ?? -1) - (a.best?.score ?? -1));
}

export type UnmatchedBatch = {
  batch: Batch;
  openKg: number;
  /** Why no buyer demand fits, in plain words. */
  reason: string;
};

/**
 * The producer's side of "no match": batches with open quantity that no open demand fits.
 * (Demands without a suitable batch are the buyer's / coordinator's concern, not shown here.)
 */
export function batchesWithoutBuyer(demands: Demand[], batches: Batch[]): UnmatchedBatch[] {
  return batches
    .filter((batch) => !UNAVAILABLE.includes(batch.status) && batch.quantityKg - batch.allocatedKg > 0)
    .flatMap((batch) => {
      const evaluated = demands.map((demand) => ({ demand, result: evaluate(demand, batch) }));
      if (evaluated.some(({ result }) => result.eligible)) return [];

      const sameProduct = evaluated.filter(({ demand }) => demand.product === batch.product);
      let reason: string;
      if (sameProduct.length === 0) {
        reason = `No buyer is asking for ${batch.product.toLowerCase()} right now.`;
      } else {
        // Closest miss: the same-product demand that fails the fewest criteria.
        const closest = [...sameProduct].sort(
          (a, b) =>
            a.result.criteria.filter((criterion) => criterion.state === "fail").length -
            b.result.criteria.filter((criterion) => criterion.state === "fail").length,
        )[0];
        const blocker = closest.result.criteria.find((criterion) => criterion.state === "fail");
        reason = `Closest buyer: ${closest.demand.buyer}. ${blocker ? blocker.detail : "Not every requirement is met"}.`;
      }
      return [{ batch, openKg: batch.quantityKg - batch.allocatedKg, reason }];
    })
    .sort((a, b) => a.batch.sellByDay - b.batch.sellByDay);
}
