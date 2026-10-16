// Rescue and redistribution proposals: what the system suggests for batches at risk of spoiling unsold
// and for large demands no single batch can cover. Human in the loop: nothing here allocates anything;
// the coordinator approves, edits or rejects each proposal (CoordinatorLayout carries the decision out).
import { openOf } from "../../Buyer/data/demands";
import type { SupplyBatch } from "../../Buyer/data/mockBuyer";
import { RISK_WATCH, formatShelfLeft, shelfLifeOf, spoilageRisk } from "@/components/freshness/shelfLife";
import { RULES, getSite } from "@/lib/site";
import { UNAVAILABLE, scoreFor, type BoardRow } from "./market";

export type PartnerKind = "processor" | "rescue";

/** Buyers outside the normal demand board: processing plants and the discounted rescue channel. */
export type Partner = {
  id: string;
  name: string;
  kind: PartnerKind;
  city: string;
  /** What they turn the fruit into, or how they sell it. */
  use: string;
  /** Products accepted; empty means any. */
  products: string[];
  grades: ("A" | "B" | "C")[];
  /** Price paid per kg, by product; the rescue channel pays a share of the market price instead. */
  pricePerKg?: Record<string, number>;
  /** Share of the market price (rescue channel). */
  priceShare?: number;
  minKg: number;
  /** How soon they collect after approval. */
  pickupDays: number;
};

export const PARTNERS: Partner[] = [
  {
    id: "P-TANTHANH",
    name: "Tan Thanh Fruit Processing",
    kind: "processor",
    city: "Long An",
    use: "juice and purée",
    products: ["Dragon fruit", "Mango", "Pineapple", "Pomelo"],
    grades: ["A", "B", "C"],
    pricePerKg: { "Dragon fruit": 14000, Mango: 18000, Pineapple: 6000, Pomelo: 15000 },
    minKg: 500,
    pickupDays: 1,
  },
  {
    id: "P-NAFOODS",
    name: "Nafoods Tay Ninh",
    kind: "processor",
    city: "Tay Ninh",
    use: "frozen and dried fruit",
    products: ["Mango", "Avocado", "Dragon fruit", "Lychee"],
    grades: ["A", "B", "C"],
    pricePerKg: { Mango: 20000, Avocado: 24000, "Dragon fruit": 12000, Lychee: 16000 },
    minKg: 800,
    pickupDays: 2,
  },
  {
    id: "P-VINAMIT",
    name: "Vinamit Binh Duong",
    kind: "processor",
    city: "Binh Duong",
    use: "freeze-dried snacks",
    products: ["Durian", "Mango", "Avocado", "Dragon fruit"],
    grades: ["A", "B"],
    pricePerKg: { Durian: 45000, Mango: 22000, Avocado: 26000, "Dragon fruit": 15000 },
    minKg: 300,
    pickupDays: 2,
  },
  {
    id: "R-FARMORA",
    name: "Farmora rescue market",
    kind: "rescue",
    city: "Ho Chi Minh City and Ha Noi",
    use: "discounted sale to shops, kitchens and consumers",
    products: [],
    grades: ["A", "B", "C"],
    priceShare: 0.6,
    minKg: 100,
    pickupDays: 1,
  },
];

/** Reference market price per kg (VND), for the value a proposal recovers. */
const MARKET_PRICE: Record<string, number> = {
  "Dragon fruit": 25000,
  Mango: 35000,
  Pomelo: 33000,
  Avocado: 42000,
  Durian: 85000,
  Lychee: 30000,
  Pineapple: 10000,
};

export const marketPrice = (product: string) => MARKET_PRICE[product] ?? 20000;

export function partnerPrice(partner: Partner, product: string) {
  if (partner.kind === "rescue") return Math.round((marketPrice(product) * (partner.priceShare ?? 0.6)) / 100) * 100;
  return partner.pricePerKg?.[product] ?? 0;
}

const accepts = (partner: Partner, batch: SupplyBatch, kg: number) =>
  (partner.products.length === 0 || partner.products.includes(batch.product)) && partner.grades.includes(batch.grade) && kg >= partner.minKg && partnerPrice(partner, batch.product) > 0;

export type ProposalKind = "combine" | "processor" | "rescue";

export type ProposalPart = { batchCode: string; producer: string; kg: number; maxKg: number };

export type Proposal = {
  /** Stable per batch or demand, so a decision sticks while the data changes. */
  id: string;
  kind: ProposalKind;
  title: string;
  /** Why the system raised it now. */
  reason: string;
  product: string;
  /** Batches it uses; one for processor and rescue, several for combine. */
  parts: ProposalPart[];
  /** Combine: the demand it covers. */
  demandId?: string;
  buyer?: string;
  /** Processor or rescue: the partner proposed, and the others the coordinator can switch to. */
  partnerId?: string;
  options?: string[];
  kg: number;
  pricePerKg: number;
  /** Share of the market value this recovers. */
  valueShare: number;
  pickup: string;
  /** How sure the system is (0–100), from fit and urgency. */
  confidence: number;
  /** The checks the system made, shown under "How this was chosen". */
  checks: string[];
  /** Higher first. */
  urgency: number;
  /** For at-risk batches: the spoilage score, shelf life left and the main cause, shown on their own. */
  risk?: number;
  shelfLeft?: string;
  cause?: string;
  /** For a combine: the open quantity of the demand. */
  needKg?: number;
};

const pickupText = (days: number) => (days <= 1 ? "tomorrow" : `within ${days} days`);

/** Proposals for at-risk batches (sell to a processor or the rescue channel) and for big demands (combine small batches). */
export function rescueProposals(rows: BoardRow[], market: SupplyBatch[], excursions: Record<string, string>, now: number): Proposal[] {
  const proposals: Proposal[] = [];
  const coldChain = new Set(getSite().products.filter((product) => product.coldChain).map((product) => product.name));

  // 1. Batches at risk of spoiling unsold, that no open demand will take in time.
  for (const batch of market) {
    const open = openOf(batch);
    if (open <= 0 || UNAVAILABLE.includes(batch.status) || batch.sellByDay < 0) continue;
    const risk = spoilageRisk({ ...batch, openKg: open }, now, excursions[batch.code]);
    const fitsDemand = rows.some((row) => row.fulfilment.openKg > 0 && scoreFor(row.demand, batch, row.fulfilment.openKg).eligible);
    // At risk, or selling soon with no demand that would take it.
    const sellingSoonUnwanted = batch.sellByDay <= RULES.sellSoonDays && !fitsDemand;
    if (risk.score < RISK_WATCH && !sellingSoonUnwanted) continue;
    const left = formatShelfLeft(shelfLifeOf(batch, now).leftMs);
    const options = PARTNERS.filter((partner) => accepts(partner, batch, open)).sort(
      (a, b) => partnerPrice(b, batch.product) - partnerPrice(a, batch.product),
    );
    const best = options[0];
    if (!best) continue;
    const price = partnerPrice(best, batch.product);
    const share = price / marketPrice(batch.product);
    proposals.push({
      id: `rescue-${batch.code}`,
      kind: best.kind,
      title:
        best.kind === "processor"
          ? `Sell ${open.toLocaleString("en-GB")} kg ${batch.code} ${batch.product.toLowerCase()} to ${best.name}`
          : `Move ${open.toLocaleString("en-GB")} kg ${batch.code} ${batch.product.toLowerCase()} to the ${best.name}`,
      reason: `Spoilage risk ${risk.score} · ${left} of shelf life left${risk.factors[0] ? ` · ${risk.factors[0]}` : ""}`,
      product: batch.product,
      parts: [{ batchCode: batch.code, producer: batch.producer, kg: open, maxKg: open }],
      partnerId: best.id,
      options: options.map((partner) => partner.id),
      kg: open,
      pricePerKg: price,
      valueShare: share,
      pickup: pickupText(best.pickupDays),
      confidence: Math.min(96, Math.round(55 + risk.score * 0.35 + (fitsDemand ? -15 : 10))),
      checks: [
        fitsDemand ? "An open demand fits, but not before the risk peaks" : "No open demand accepts it in time",
        `${best.name} takes ${batch.product.toLowerCase()} grade ${batch.grade}, at least ${best.minKg.toLocaleString("en-GB")} kg`,
        `Best price among ${options.length} ${options.length === 1 ? "option" : "options"}: ${Math.round(share * 100)}% of market value`,
        `Collects ${pickupText(best.pickupDays)}, before the sell-by date`,
        coldChain.has(batch.product) ? "Needs a refrigerated truck" : "A regular truck is enough",
      ],
      urgency: Math.max(risk.score, sellingSoonUnwanted ? 45 : 0),
      risk: risk.score,
      shelfLeft: left,
      cause: excursions[batch.code] ? "cold room 11 °C" : sellingSoonUnwanted ? "no buyer before sell-by" : risk.factors[0],
    });
  }

  // 2. Big demands no single batch covers: combine small batches from several farms.
  for (const row of rows) {
    const need = row.fulfilment.openKg;
    if (need < 1500 || row.demand.neededByDay < 0) continue;
    const eligible = market
      .filter((batch) => openOf(batch) > 0 && !UNAVAILABLE.includes(batch.status))
      .map((batch) => ({ batch, candidate: scoreFor(row.demand, batch, need) }))
      .filter(({ candidate }) => candidate.eligible)
      .sort((a, b) => b.candidate.score - a.candidate.score);
    if (eligible.length < 2 || eligible.some(({ batch }) => openOf(batch) >= need)) continue;
    let remaining = need;
    const parts: ProposalPart[] = [];
    for (const { batch } of eligible.slice(0, 4)) {
      if (remaining <= 0) break;
      const kg = Math.min(openOf(batch), remaining);
      parts.push({ batchCode: batch.code, producer: batch.producer, kg, maxKg: openOf(batch) });
      remaining -= kg;
    }
    const kg = parts.reduce((sum, part) => sum + part.kg, 0);
    if (parts.length < 2 || kg < need * 0.6) continue;
    const farms = new Set(parts.map((part) => part.producer)).size;
    proposals.push({
      id: `combine-${row.demand.id}`,
      kind: "combine",
      title: `Combine ${parts.length} batches from ${farms} ${farms === 1 ? "farm" : "farms"} for ${row.demand.id}`,
      reason: `${row.demand.buyer} needs ${need.toLocaleString("en-GB")} kg ${row.demand.product.toLowerCase()}; no single batch is big enough`,
      product: row.demand.product,
      parts,
      demandId: row.demand.id,
      buyer: row.demand.buyer,
      needKg: need,
      kg,
      pricePerKg: marketPrice(row.demand.product),
      valueShare: 1,
      pickup: "as each farm is ready",
      confidence: Math.round(Math.min(95, 60 + (kg / need) * 30)),
      checks: [
        `Every batch passes the demand's grade, date and distance rules`,
        `Highest-scoring batches first, ${parts.length} of ${eligible.length} that fit`,
        `Covers ${Math.round((kg / need) * 100)}% of the open ${need.toLocaleString("en-GB")} kg`,
        "Each farm confirms its part as a normal hold",
      ],
      urgency: Math.max(30, 70 - row.demand.neededByDay * 8),
    });
  }

  return proposals.sort((a, b) => b.urgency - a.urgency);
}

/** What the coordinator decided, with the proposal as it stood (it may no longer be generated afterwards). */
export type RescueDecision = { kind: ProposalKind; title: string; at: number } & (
  | { status: "approved"; summary: string; transportId?: string }
  | { status: "rejected"; reason: string }
);

/** What the coordinator changed before approving. */
export type RescueEdit = { partnerId?: string; parts: { batchCode: string; kg: number }[] };

export const KIND_LABEL: Record<ProposalKind, string> = {
  combine: "Combine supply",
  processor: "Sell to processor",
  rescue: "Rescue channel",
};
