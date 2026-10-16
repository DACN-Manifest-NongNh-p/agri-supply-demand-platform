// Shelf life and spoilage risk for a batch, from its harvest and sell-by days (offsets from today).
// The risk index is a transparent rule-based score, recomputed as time passes; a trained model could
// replace `spoilageRisk` later without changing the screens that use it.
import { getSite } from "@/lib/site";

const DAY_MS = 86_400_000;
const HARVEST_HOUR = 6;

export type RiskLevel = "low" | "watch" | "high";

/** At or above these scores a batch is "watch" and "high". */
export const RISK_WATCH = 40;
export const RISK_HIGH = 70;

export type ShelfLifeInput = {
  code: string;
  product: string;
  harvestDay: number;
  sellByDay: number;
  quantityKg: number;
  /** Kilograms nobody has bought yet. */
  openKg: number;
};

function dayStart(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime() + offset * DAY_MS;
}

/** Shelf life from harvest (06:00) to the end of the sell-by day, and how much is left at `now`. */
export function shelfLifeOf(batch: Pick<ShelfLifeInput, "harvestDay" | "sellByDay">, now: number) {
  const start = dayStart(batch.harvestDay) + HARVEST_HOUR * 3_600_000;
  const end = dayStart(batch.sellByDay + 1) - 60_000;
  const total = Math.max(1, end - start);
  const leftMs = Math.max(0, end - now);
  return { start, end, leftMs, fraction: Math.min(1, leftMs / total) };
}

/** "3 d 4 h", "14 h 20 m", "35 m", or "Expired". */
export function formatShelfLeft(ms: number) {
  if (ms <= 0) return "Expired";
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes % 60} m`;
  return `${minutes % 60} m`;
}

export type Risk = { score: number; level: RiskLevel; factors: string[] };

/**
 * Spoilage risk 0–100: how far through its shelf life the batch is, how much of it is still unsold,
 * whether it needs a cold chain, and any temperature excursion reported for it.
 */
export function spoilageRisk(batch: ShelfLifeInput, now: number, excursion?: string): Risk {
  const { fraction, leftMs } = shelfLifeOf(batch, now);
  const used = 1 - fraction;
  const unsoldShare = batch.quantityKg > 0 ? Math.min(1, batch.openKg / batch.quantityKg) : 0;
  const coldChain = getSite().products.find((product) => product.name === batch.product)?.coldChain ?? false;

  const factors: string[] = [];
  let score = 60 * Math.pow(used, 1.4);
  if (used >= 0.5) factors.push(`${Math.round(used * 100)}% of its shelf life used`);
  if (unsoldShare > 0) {
    score += 25 * unsoldShare * (used > 0.3 ? 1 : 0.5);
    if (unsoldShare >= 0.5) factors.push(`${Math.round(unsoldShare * 100)}% still unsold`);
  }
  if (coldChain) {
    score += 6;
    factors.push("needs a cold chain");
  }
  if (excursion) {
    // Warm storage speeds up decay sharply, whatever the date says.
    score += 45;
    factors.unshift(excursion);
  }
  if (leftMs <= 0) score = 100;

  const rounded = Math.max(0, Math.min(100, Math.round(score)));
  return { score: rounded, level: rounded >= RISK_HIGH ? "high" : rounded >= RISK_WATCH ? "watch" : "low", factors };
}
