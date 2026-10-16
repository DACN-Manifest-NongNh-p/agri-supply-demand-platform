// Demand status and supply ranking for the buyer area.
// Status is derived from allocations, never set by hand; ranking reuses the producer's matching
// rules (data/matching.ts) so both sides see the same score for the same pair.
import { evaluate, type Candidate } from "../../Producer/data/matching";
import type { Allocation, BuyerDemand, SupplyBatch } from "./mockBuyer";
import { buyer } from "./mockBuyer";

export type DemandStatus = "new" | "sourcing" | "partial" | "fulfilled" | "completed";

/** Kilograms of a batch nobody has reserved or been allocated yet. */
export const openOf = (batch: SupplyBatch) => Math.max(0, batch.quantityKg - batch.allocatedKg);

export const DEMAND_STAGES: { status: DemandStatus; label: string }[] = [
  { status: "new", label: "New" },
  { status: "sourcing", label: "Sourcing" },
  { status: "partial", label: "Partly covered" },
  { status: "fulfilled", label: "Fully covered" },
  { status: "completed", label: "Completed" },
];

export function demandStageLabel(status: DemandStatus) {
  return DEMAND_STAGES.find((stage) => stage.status === status)?.label ?? status;
}

export type Fulfilment = {
  /** Agreed by both sides (confirmed, on the way or delivered). */
  allocatedKg: number;
  /** Reserved, waiting for the producer to confirm. */
  heldKg: number;
  /** Offered by producers, waiting for your answer; not counted as covered. */
  offeredKg: number;
  deliveredKg: number;
  /** Still without any source: what suggestions should cover. */
  openKg: number;
  status: DemandStatus;
  parts: Allocation[];
};

export function fulfilmentOf(demand: BuyerDemand, allocations: Allocation[]): Fulfilment {
  const parts = allocations.filter((allocation) => allocation.demandId === demand.id);
  const sum = (list: Allocation[]) => list.reduce((total, allocation) => total + allocation.kg, 0);
  // A lock already keeps the kilograms from everyone else, so it counts with the holds.
  const heldKg = sum(parts.filter((part) => part.stage === "held" || part.stage === "locked"));
  const offeredKg = sum(parts.filter((part) => part.stage === "offered"));
  const allocatedKg = sum(parts.filter((part) => part.stage === "confirmed" || part.stage === "in_transit" || part.stage === "delivered"));
  const deliveredKg = sum(parts.filter((part) => part.stage === "delivered"));
  const openKg = Math.max(0, demand.quantityKg - allocatedKg - heldKg);

  let status: DemandStatus;
  if (allocatedKg >= demand.quantityKg) {
    status = deliveredKg >= demand.quantityKg ? "completed" : "fulfilled";
  } else if (allocatedKg > 0) {
    status = "partial";
  } else if (heldKg > 0 || demand.createdDay < 0) {
    status = "sourcing";
  } else {
    status = "new";
  }

  return { allocatedKg, heldKg, offeredKg, deliveredKg, openKg, status, parts };
}

export type SupplyCandidate = Candidate & { batch: SupplyBatch };

/** Scores one market batch for a demand, against the quantity still open. */
export function scoreSupply(demand: BuyerDemand, batch: SupplyBatch, openKg: number): SupplyCandidate {
  const asDemand = {
    id: demand.id,
    buyer: buyer.name,
    buyerType: buyer.type,
    product: demand.product,
    quantityKg: Math.max(1, openKg),
    gradeWanted: demand.gradeWanted === "Any grade" ? "Grade A–B–C" : demand.gradeWanted,
    neededByDay: demand.neededByDay,
    destination: "your DC",
    distanceKm: batch.distanceKm,
  };
  return { ...evaluate(asDemand, batch), batch };
}

export type SupplyRanking = {
  /** Eligible batches, best first. */
  candidates: SupplyCandidate[];
  /** Same-product batches that fail a hard rule, with the reason shown. */
  rejected: SupplyCandidate[];
  /** Why nothing fits, when `candidates` is empty. */
  reason?: string;
};

export function rankSupply(demand: BuyerDemand, batches: SupplyBatch[], openKg: number): SupplyRanking {
  const sameProduct = batches
    .filter((batch) => batch.product === demand.product)
    .map((batch) => scoreSupply(demand, batch, openKg));
  const candidates = sameProduct.filter((candidate) => candidate.eligible).sort((a, b) => b.score - a.score);
  const rejected = sameProduct.filter((candidate) => !candidate.eligible);

  let reason: string | undefined;
  if (candidates.length === 0) {
    if (sameProduct.length === 0) {
      reason = `No producer has declared ${demand.product.toLowerCase()} yet. Farmora will match new batches as they come in.`;
    } else {
      const blocker = rejected[0].criteria.find((criterion) => criterion.state === "fail");
      reason = `Closest batch is ${rejected[0].batch.code}: ${blocker ? blocker.detail.toLowerCase() : "not every requirement is met"}.`;
    }
  }
  return { candidates, rejected, reason };
}

/** Open demands first (soonest deadline first), then fully covered ones, completed last. */
export function sortDemands(demands: BuyerDemand[], allocations: Allocation[]) {
  const rank: Record<DemandStatus, number> = { new: 0, sourcing: 0, partial: 0, fulfilled: 1, completed: 2 };
  return [...demands]
    .map((demand) => ({ demand, fulfilment: fulfilmentOf(demand, allocations) }))
    .sort((a, b) => rank[a.fulfilment.status] - rank[b.fulfilment.status] || a.demand.neededByDay - b.demand.neededByDay);
}
