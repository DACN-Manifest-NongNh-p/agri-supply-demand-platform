// Matching Engine (B3.3 §7.5): periodic double auction with one uniform clearing price per
// compatibility group and price-time priority allocation. Pure functions, no state.
import { canDeliver, meetsGrade } from "./catalog";
import type { QualityGrade } from "./types";

export type EngineOrder = {
  code: string;
  side: "BUY" | "SELL";
  owner: string;
  crop: string;
  /** BUY: required variety, if any. SELL: the lot's variety. */
  variety?: string;
  /** BUY: required grade. SELL: the lot's grade. */
  grade: QualityGrade;
  /** BUY: receiving zone. SELL: shipping zone. */
  zone: string;
  remaining: number;
  /** BUY: maximum price. SELL: minimum price. */
  limitPrice: number;
  /** BUY: required. SELL: held by the lot. */
  certifications: string[];
  /** BUY: delivery window. SELL: availability window. */
  from: string;
  until: string;
  priorityTime: number;
};

export type EngineMatch = { buy: string; sell: string; quantity: number; price: number; group: string };
export type EngineGroupResult = { group: string; crop: string; variety?: string; grade: QualityGrade; zone: string; price: number; volume: number };

/** Every pairwise rule of §7.5.1 apart from price. */
export function compatible(buy: EngineOrder, sell: EngineOrder) {
  return (
    buy.crop === sell.crop &&
    (!buy.variety || buy.variety === sell.variety) &&
    meetsGrade(sell.grade, buy.grade) &&
    buy.certifications.every((cert) => sell.certifications.includes(cert)) &&
    sell.from <= buy.until &&
    buy.from <= sell.until &&
    canDeliver(sell.zone, buy.zone) &&
    buy.owner !== sell.owner &&
    buy.remaining > 0 &&
    sell.remaining > 0
  );
}

/** Group key for the MVP: (crop, variety, grade, zone) of the buy side (§7.5.1). */
export const groupKey = (order: Pick<EngineOrder, "crop" | "variety" | "grade" | "zone">) =>
  [order.crop, order.variety ?? "*", order.grade, order.zone].join("|");

/**
 * Clearing price for one group (§7.5.2): the candidate price with the largest matchable volume,
 * then the smallest imbalance, then closest to the reference price (or the midpoint of the two
 * marginal orders), then the lower price. Undefined when nothing can trade.
 */
export function clearingPrice(buys: EngineOrder[], sells: EngineOrder[], reference?: number) {
  const candidates = [...new Set([...buys, ...sells].map((order) => order.limitPrice))].sort((a, b) => a - b);
  const rows = candidates.map((price) => {
    const demand = buys.filter((order) => order.limitPrice >= price).reduce((sum, order) => sum + order.remaining, 0);
    const supply = sells.filter((order) => order.limitPrice <= price).reduce((sum, order) => sum + order.remaining, 0);
    return { price, demand, supply, volume: Math.min(demand, supply), imbalance: Math.abs(demand - supply) };
  });
  const best = Math.max(0, ...rows.map((row) => row.volume));
  if (best === 0) return undefined;

  let pool = rows.filter((row) => row.volume === best);
  const minImbalance = Math.min(...pool.map((row) => row.imbalance));
  pool = pool.filter((row) => row.imbalance === minImbalance);
  if (pool.length > 1) {
    let anchor = reference;
    if (anchor === undefined) {
      // Midpoint of the marginal orders: the lowest buy and highest sell that trade at these prices.
      const low = pool[0].price;
      const high = pool[pool.length - 1].price;
      const marginalBuy = Math.min(...buys.filter((order) => order.limitPrice >= high).map((order) => order.limitPrice));
      const marginalSell = Math.max(...sells.filter((order) => order.limitPrice <= low).map((order) => order.limitPrice));
      anchor = (marginalBuy + marginalSell) / 2;
    }
    const distance = Math.min(...pool.map((row) => Math.abs(row.price - anchor!)));
    pool = pool.filter((row) => Math.abs(row.price - anchor!) === distance);
  }
  return { price: pool[0].price, volume: best };
}

const byBuyPriority = (a: EngineOrder, b: EngineOrder) => b.limitPrice - a.limitPrice || a.priorityTime - b.priorityTime;
const bySellPriority = (a: EngineOrder, b: EngineOrder) => a.limitPrice - b.limitPrice || a.priorityTime - b.priorityTime;

/**
 * Runs one session over a snapshot. Groups are cleared one after another; a sell order compatible
 * with several groups gives each later group only what is left, so nothing is allocated twice.
 */
export function runSession(snapshot: EngineOrder[], references: Record<string, number> = {}) {
  const remaining = new Map(snapshot.map((order) => [order.code, order.remaining]));
  const left = (order: EngineOrder) => ({ ...order, remaining: remaining.get(order.code) ?? 0 });
  const buys = snapshot.filter((order) => order.side === "BUY");
  const sells = snapshot.filter((order) => order.side === "SELL");

  const groups = new Map<string, EngineOrder[]>();
  for (const buy of buys) groups.set(groupKey(buy), [...(groups.get(groupKey(buy)) ?? []), buy]);

  const matches: EngineMatch[] = [];
  const prices: EngineGroupResult[] = [];

  for (const [group, members] of groups) {
    const groupBuys = members.map(left).filter((order) => order.remaining > 0);
    const groupSells = sells.map(left).filter((sell) => groupBuys.some((buy) => compatible(buy, sell)));
    const cleared = clearingPrice(groupBuys, groupSells, references[group]);
    if (!cleared) continue;

    const eligibleBuys = groupBuys.filter((order) => order.limitPrice >= cleared.price).sort(byBuyPriority);
    const eligibleSells = groupSells.filter((order) => order.limitPrice <= cleared.price).sort(bySellPriority);
    let volume = 0;
    for (const buy of eligibleBuys) {
      for (const sell of eligibleSells) {
        const buyLeft = remaining.get(buy.code) ?? 0;
        const sellLeft = remaining.get(sell.code) ?? 0;
        if (buyLeft <= 0) break;
        if (sellLeft <= 0 || !compatible({ ...buy, remaining: buyLeft }, { ...sell, remaining: sellLeft })) continue;
        const quantity = Math.min(buyLeft, sellLeft);
        remaining.set(buy.code, buyLeft - quantity);
        remaining.set(sell.code, sellLeft - quantity);
        matches.push({ buy: buy.code, sell: sell.code, quantity, price: cleared.price, group });
        volume += quantity;
      }
    }
    if (volume > 0) {
      const [first] = members;
      prices.push({ group, crop: first.crop, variety: first.variety, grade: first.grade, zone: first.zone, price: cleared.price, volume });
    }
  }
  return { matches, prices };
}
