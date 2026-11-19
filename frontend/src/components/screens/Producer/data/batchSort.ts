// Sorting and searching batches, shared by the list and the calendar so both show the same rows.
import { spoilageRisk, type Risk } from "@/components/freshness/shelfLife";
import { BATCH_STAGES, type Batch } from "./mockProducer";

export type BatchSort = "harvest" | "sellBy" | "risk" | "open" | "declared" | "status" | "code";
export type SortDir = "asc" | "desc";

export const SORT_LABEL: Record<BatchSort, string> = {
  harvest: "Harvest date",
  sellBy: "Sell-by date",
  risk: "Spoilage risk",
  open: "Kilograms open",
  declared: "Kilograms declared",
  status: "Status",
  code: "Batch code",
};

export const openOf = (batch: Batch) => Math.max(0, batch.quantityKg - batch.allocatedKg);

/** Spoilage risk of the unsold part; none for batches already sold, on the road or delivered. */
export function riskOf(batch: Batch, excursions: Record<string, string>, now = Date.now()): Risk | undefined {
  const open = openOf(batch);
  if (open <= 0 || batch.status === "delivered" || batch.status === "in_transit") return undefined;
  return spoilageRisk({ ...batch, openKg: open }, now, excursions[batch.code]);
}

export function matchesQuery(batch: Batch, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [batch.code, batch.product, batch.variety, batch.plot, `grade ${batch.grade}`].some((text) => text.toLowerCase().includes(q));
}

export function sortBatches(batches: Batch[], sort: BatchSort, dir: SortDir, risks: Record<string, Risk | undefined>) {
  const status = (batch: Batch) => BATCH_STAGES.findIndex((stage) => stage.status === batch.status);
  const key: Record<BatchSort, (batch: Batch) => number | string> = {
    harvest: (batch) => batch.harvestDay,
    sellBy: (batch) => batch.sellByDay,
    risk: (batch) => risks[batch.code]?.score ?? -1,
    open: openOf,
    declared: (batch) => batch.quantityKg,
    status,
    code: (batch) => batch.code,
  };
  const sign = dir === "asc" ? 1 : -1;
  return [...batches].sort((a, b) => {
    const x = key[sort](a);
    const y = key[sort](b);
    const order = typeof x === "string" ? x.localeCompare(String(y)) : x - (y as number);
    return order * sign || a.harvestDay - b.harvestDay;
  });
}
