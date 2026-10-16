// Yield confidence for a pre-harvest batch: how likely the estimate holds. A decision aid built from
// simple, visible signals, not a promise about the actual harvest.
import type { Auction } from "./auctionStore";

export type Confidence = { score: number; level: "High" | "Medium" | "Low"; factors: string[] };

export function yieldConfidence(auction: Pick<Auction, "estMinKg" | "estMaxKg" | "harvestDay" | "farming" | "risk">): Confidence {
  const factors: string[] = [];
  let score = 92;

  const spread = (auction.estMaxKg - auction.estMinKg) / Math.max(1, auction.estMaxKg);
  if (spread > 0.15) {
    score -= Math.round((spread - 0.15) * 120);
    factors.push(`Wide estimate (±${Math.round((spread / 2) * 100)}%)`);
  } else {
    factors.push(`Tight estimate (±${Math.round((spread / 2) * 100)}%)`);
  }

  // The further away the harvest, the more can change.
  score -= Math.max(0, auction.harvestDay - 2) * 2;
  factors.push(auction.harvestDay <= 3 ? `Harvest in ${auction.harvestDay} days` : `Harvest in ${auction.harvestDay} days: more can change`);

  const history = auction.farming.find((item) => /last season/i.test(item));
  if (history) factors.push(history);
  else {
    score -= 8;
    factors.push("No yield history for this plot");
  }
  if (auction.farming.some((item) => /vietgap|globalgap|organic/i.test(item))) factors.push("Certified practices");

  if (auction.risk) {
    score -= 30;
    factors.unshift(`Producer reported: ${auction.risk}`);
  }

  const bounded = Math.max(10, Math.min(97, score));
  return { score: bounded, level: bounded >= 80 ? "High" : bounded >= 60 ? "Medium" : "Low", factors };
}
