// Market-wide matching for the coordinator. Same rules and scores as the producer and buyer
// areas (Producer/data/matching.ts). The system matches on its own: a clean proposal becomes a
// hold straight away (autoMatch). Only proposals with an exception wait for the coordinator.
import { evaluate } from "../../Producer/data/matching";
import { formatKg } from "../../Producer/data/format";
import { fulfilmentOf, openOf, type Fulfilment, type SupplyCandidate } from "../../Buyer/data/demands";
import { producerProfile } from "../../Buyer/data/producers";
import type { SupplyBatch } from "../../Buyer/data/mockBuyer";
import type { MarketAllocation, MarketDemand } from "./mockCoordinator";

const UNAVAILABLE: SupplyBatch["status"][] = ["in_transit", "delivered"];

/** Hours a producer has to confirm a hold. */
export const HOLD_HOURS = 24;
/** Below this score the system does not commit a batch on its own. */
export const AUTO_MATCH_MIN_SCORE = 75;
/** Holds this large need a coordinator's sign-off. */
export const SIGN_OFF_KG = 3000;

export type ExceptionCode = "low_score" | "producer_issue" | "unverified" | "large_order" | "export";

/** Why a proposal needs a person instead of being held automatically. */
export type MatchException = { code: ExceptionCode; text: string };

export type MatchOptions = {
  /** `demandId:batchCode` pairs the coordinator released; the system does not propose them again. */
  blocked?: Set<string>;
  /** Producers the coordinator verified in this session, on top of their stored profile. */
  verified?: Set<string>;
};

export const pairKey = (demandId: string, batchCode: string) => `${demandId}:${batchCode}`;

function isVerified(producer: string, options: MatchOptions) {
  // Producers without a profile yet are not flagged; only an explicit "not verified" is.
  return options.verified?.has(producer) || producerProfile(producer)?.verified !== false;
}

/** Kilograms approving this candidate would hold. */
export const holdKg = (openKg: number, batch: SupplyBatch) => Math.min(openKg, openOf(batch));

export function exceptionsFor(demand: MarketDemand, candidate: SupplyCandidate, openKg: number, options: MatchOptions = {}): MatchException[] {
  const { batch } = candidate;
  const kg = holdKg(openKg, batch);
  const list: MatchException[] = [];
  if (candidate.score < AUTO_MATCH_MIN_SCORE) {
    list.push({ code: "low_score", text: `${candidate.score}% match, below the ${AUTO_MATCH_MIN_SCORE}% the system confirms on its own.` });
  }
  if (batch.issue) list.push({ code: "producer_issue", text: `The producer reported a problem with ${batch.code}.` });
  if (!isVerified(batch.producer, options)) list.push({ code: "unverified", text: `${batch.producer} is not verified yet.` });
  if (kg >= SIGN_OFF_KG) list.push({ code: "large_order", text: `${formatKg(kg)} is at or above the ${formatKg(SIGN_OFF_KG)} that needs sign-off.` });
  if (demand.buyerType === "Exporter") list.push({ code: "export", text: "Export order: packing and paperwork need a coordinator's check." });
  return list;
}

/** Scores a batch for a demand, against the quantity the demand still has open. */
export function scoreFor(demand: MarketDemand, batch: SupplyBatch, openKg: number): SupplyCandidate {
  const asDemand = {
    id: demand.id,
    buyer: demand.buyer,
    buyerType: demand.buyerType,
    product: demand.product,
    quantityKg: Math.max(1, openKg),
    gradeWanted: demand.gradeWanted === "Any grade" ? "Grade A–B–C" : demand.gradeWanted,
    neededByDay: demand.neededByDay,
    destination: demand.destination,
    distanceKm: batch.distanceKm,
  };
  return { ...evaluate(asDemand, batch), batch };
}

export type BoardRow = {
  demand: MarketDemand;
  fulfilment: Fulfilment;
  /** The system's proposal: the best eligible batch without exceptions, else the best eligible batch. */
  best?: SupplyCandidate;
  /** Why `best` needs a person. Empty means the system holds it on its own. */
  exceptions: MatchException[];
  /** Other eligible batches, best first. */
  alternatives: SupplyCandidate[];
  /** Why nothing fits, when `best` is undefined. */
  reason?: string;
};

/** Open demands (still missing quantity, deadline not passed) with their proposed batch. */
export function matchBoard(demands: MarketDemand[], allocations: MarketAllocation[], market: SupplyBatch[], options: MatchOptions = {}): BoardRow[] {
  return demands
    .filter((demand) => demand.neededByDay >= 0)
    .map((demand) => {
      const fulfilment = fulfilmentOf(demand, allocations);
      const sameProduct = market
        .filter((batch) => batch.product === demand.product && !options.blocked?.has(pairKey(demand.id, batch.code)))
        .map((batch) => scoreFor(demand, batch, fulfilment.openKg));
      const eligible = sameProduct.filter((candidate) => candidate.eligible).sort((a, b) => b.score - a.score);
      const best = eligible.find((candidate) => exceptionsFor(demand, candidate, fulfilment.openKg, options).length === 0) ?? eligible[0];

      let reason: string | undefined;
      if (eligible.length === 0) {
        if (sameProduct.length === 0) {
          reason = `No producer has declared ${demand.product.toLowerCase()}.`;
        } else {
          const closest = sameProduct.sort(
            (a, b) =>
              a.criteria.filter((criterion) => criterion.state === "fail").length -
              b.criteria.filter((criterion) => criterion.state === "fail").length,
          )[0];
          const blocker = closest.criteria.find((criterion) => criterion.state === "fail");
          reason = `Closest is ${closest.batch.code}: ${blocker ? blocker.detail.charAt(0).toLowerCase() + blocker.detail.slice(1) : "not every rule is met"}.`;
        }
      }
      return {
        demand,
        fulfilment,
        best,
        exceptions: best ? exceptionsFor(demand, best, fulfilment.openKg, options) : [],
        alternatives: eligible.filter((candidate) => candidate !== best),
        reason,
      };
    })
    .filter((row) => row.fulfilment.openKg > 0)
    .sort((a, b) => a.demand.neededByDay - b.demand.neededByDay);
}

/** Proposals the system will not hold on its own. */
export const needsDecision = (rows: BoardRow[]) => rows.filter((row) => row.best && row.exceptions.length > 0);

export type Book = { market: SupplyBatch[]; allocations: MarketAllocation[] };

let holdSeq = 0;

/** Adds a hold and reserves its quantity on the batch. */
export function addHold(book: Book, hold: Omit<MarketAllocation, "id" | "stage" | "holdHoursLeft">): Book {
  holdSeq += 1;
  return {
    allocations: [...book.allocations, { ...hold, id: `A-${Date.now()}-${holdSeq}`, stage: "held", holdHoursLeft: HOLD_HOURS }],
    market: book.market.map((batch) => (batch.code === hold.batchCode ? { ...batch, allocatedKg: batch.allocatedKg + hold.kg } : batch)),
  };
}

/**
 * What the matching engine does on its own: hold every clean proposal, soonest deadline first,
 * until only exceptions and gaps are left. Runs again after every change to the market.
 */
export function autoMatch(demands: MarketDemand[], book: Book, options: MatchOptions = {}): Book {
  let next = book;
  for (let guard = 0; guard < 100; guard += 1) {
    const row = matchBoard(demands, next.allocations, next.market, options).find((item) => item.best && item.exceptions.length === 0);
    if (!row) break;
    const { batch, score } = row.best!;
    next = addHold(next, {
      demandId: row.demand.id,
      batchCode: batch.code,
      producer: batch.producer,
      kg: holdKg(row.fulfilment.openKg, batch),
      matchedBy: "system",
      score,
    });
  }
  return next;
}

/** Batch code → the demands whose proposal is that batch, when more than one wants it. */
export function contestedBatches(rows: BoardRow[]) {
  const byBatch = new Map<string, BoardRow[]>();
  for (const row of rows) {
    if (!row.best) continue;
    const code = row.best.batch.code;
    byBatch.set(code, [...(byBatch.get(code) ?? []), row]);
  }
  return new Map([...byBatch].filter(([, list]) => list.length > 1));
}

export type IdleBatch = { batch: SupplyBatch; openKg: number; reason: string };

/** Batches with open quantity that no open demand accepts. */
export function batchesWithoutBuyer(rows: BoardRow[], market: SupplyBatch[]): IdleBatch[] {
  return market
    .filter((batch) => !UNAVAILABLE.includes(batch.status) && openOf(batch) > 0)
    .flatMap((batch) => {
      const scored = rows.map((row) => ({ row, candidate: scoreFor(row.demand, batch, row.fulfilment.openKg) }));
      if (scored.some(({ candidate }) => candidate.eligible)) return [];

      const sameProduct = scored.filter(({ row }) => row.demand.product === batch.product);
      let reason: string;
      if (sameProduct.length === 0) {
        reason = `No open demand for ${batch.product.toLowerCase()}.`;
      } else {
        const blocker = sameProduct[0].candidate.criteria.find((criterion) => criterion.state === "fail");
        reason = `Closest is ${sameProduct[0].row.demand.id} (${sameProduct[0].row.demand.buyer}): ${blocker ? blocker.detail.charAt(0).toLowerCase() + blocker.detail.slice(1) : "not every rule is met"}.`;
      }
      return [{ batch, openKg: openOf(batch), reason }];
    })
    .sort((a, b) => a.batch.sellByDay - b.batch.sellByDay);
}

/** Windows, in days, the overview can compare supply and demand over. */
export const BALANCE_WINDOWS = [7, 14] as const;

export type ProductBalance = { product: string; demandKg: number; supplyKg: number };

/**
 * Open demand due in the next `days` days against supply that is sellable in that window,
 * per product. Shortfalls first.
 */
export function balanceByProduct(rows: BoardRow[], market: SupplyBatch[], days = 7): ProductBalance[] {
  const products = new Map<string, ProductBalance>();
  const entry = (product: string) => {
    if (!products.has(product)) products.set(product, { product, demandKg: 0, supplyKg: 0 });
    return products.get(product)!;
  };
  for (const row of rows) {
    if (row.demand.neededByDay <= days) entry(row.demand.product).demandKg += row.fulfilment.openKg;
  }
  for (const batch of market) {
    if (UNAVAILABLE.includes(batch.status) || batch.readyDay > days || batch.sellByDay < 0) continue;
    entry(batch.product).supplyKg += openOf(batch);
  }
  return [...products.values()].sort((a, b) => a.supplyKg - a.demandKg - (b.supplyKg - b.demandKg));
}
