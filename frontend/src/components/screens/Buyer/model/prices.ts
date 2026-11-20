import { zoneLabel } from "./catalog";
import type { ClearingPrice } from "./types";

/** Latest published price per group, newest first. */
export function latestPrices(prices: ClearingPrice[]) {
  const seen = new Map<string, ClearingPrice>();
  for (const price of [...prices].sort((a, b) => b.at - a.at)) {
    const key = [price.crop, price.variety ?? "*", price.grade, price.zone].join("|");
    if (!seen.has(key)) seen.set(key, price);
  }
  return [...seen.values()];
}

/** "Ho Chi Minh City area" once in a heading, instead of on every row, when all rows share a zone. */
export function priceZoneNote(prices: ClearingPrice[]) {
  const zones = new Set(prices.map((price) => price.zone));
  return zones.size === 1 ? `Delivered to ${zoneLabel([...zones][0])}` : "All delivery zones";
}
