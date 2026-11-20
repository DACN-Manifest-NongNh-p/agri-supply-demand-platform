// Supplier state and every transition the BRDs allow (B0 → B3), in one place. An action that breaks a
// rule returns the errors and changes nothing. Buyers, the coordinator and the matching engine are
// simulated for the demo; a backend takes them over later and the rules stay the same.
import { useSyncExternalStore } from "react";
import { RULES } from "@/lib/site";
import type { Notice } from "@/components/notifications/NotificationBell";
import { CROPS, zoneForProvince } from "../../Buyer/model/catalog";
import { addDays, DAY, endOfDay, formatDate, HOUR, MINUTE, nextSlot, todayIso, vnInstant, type SessionSlot } from "../../Buyer/model/time";
import type { Errors } from "../../Buyer/model/validation";
import * as seed from "./seed";
import type {
  Actor,
} from "../../Buyer/model/types";
import type {
  Allocation,
  AreaCrop,
  BuyerBid,
  DeliveryMethod,
  Evidence,
  HistoryEntry,
  LotStatus,
  MyAuction,
  MyProposal,
  OpenDemand,
  ProductionArea,
  ProductionPlan,
  SellOrder,
  SupplierDoc,
  SupplierMatch,
  SupplierProfile,
  SupplierTransaction,
  SupplyLot,
  TimeInForce,
} from "./types";

export const SELF = seed.SELF;
export const confirmHours = () => RULES.holdHours;

export type SupplierData = {
  profile: SupplierProfile;
  areas: ProductionArea[];
  plans: ProductionPlan[];
  lots: SupplyLot[];
  sellOrders: SellOrder[];
  matches: SupplierMatch[];
  demands: OpenDemand[];
  proposals: MyProposal[];
  auctions: MyAuction[];
  bids: BuyerBid[];
  allocations: Allocation[];
  transactions: SupplierTransaction[];
  sessions: string[];
  notices: Notice[];
  seq: number;
};

let state: SupplierData = {
  profile: seed.seedProfile,
  areas: seed.seedAreas,
  plans: seed.seedPlans,
  lots: seed.seedLots,
  sellOrders: seed.seedSellOrders,
  matches: seed.seedMatches,
  demands: seed.seedDemands,
  proposals: seed.seedProposals,
  auctions: seed.seedAuctions,
  bids: seed.seedBids,
  allocations: seed.seedAllocations,
  transactions: seed.seedTransactions,
  sessions: [],
  notices: [],
  seq: 200,
};

const listeners = new Set<() => void>();
function set(update: (current: SupplierData) => SupplierData) {
  state = update(state);
  listeners.forEach((listener) => listener());
}
export const getSupplierData = () => state;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};
export function useSupplierData(): SupplierData {
  return useSyncExternalStore(subscribe, getSupplierData);
}

export type Result<T = undefined> = { ok: true; value: T } | { ok: false; errors: Errors };
const ok = <T,>(value: T): Result<T> => ({ ok: true, value });
const fail = (errors: Errors): Result<never> => ({ ok: false, errors });
const failIf = (errors: Errors) => (Object.keys(errors).length ? fail(errors) : null);

function nextId(prefix: string) {
  state = { ...state, seq: state.seq + 1 };
  return `${prefix}-${state.seq + 5000}`;
}
const log = (by: Actor, action: string, note?: string): HistoryEntry => ({ at: Date.now(), by, action, note });

function notify(title: string, detail: string, to?: string, tone: "info" | "warning" | "urgent" = "info") {
  set((current) => ({
    ...current,
    notices: [{
      id: `SN-${Date.now()}-${current.notices.length}`,
      title,
      detail,
      tone,
      ...(to ? { link: { label: "Open", to } } : {}),
    }, ...current.notices].slice(0, 30),
  }));
}
export function dismissNotice(id: string) {
  set((current) => ({ ...current, notices: current.notices.filter((notice) => notice.id !== id) }));
}

/** Runs a simulated reply from the other side a few seconds later. */
const later = (ms: number, run: () => void) => window.setTimeout(run, ms);

// ── Gates (B0) ──────────────────────────────────────────────────────────────

export const verifiedAreas = (data = state) => data.areas.filter((area) => area.status === "VERIFIED");

/** What still blocks selling, in the order the supplier has to fix it (FR-B0-30, FR-B0-32). */
export function sellingBlockers(data = state): string[] {
  const out: string[] = [];
  if (data.profile.status !== "VERIFIED") out.push("Your identity is not verified yet.");
  else if (verifiedAreas(data).length === 0) out.push(data.areas.length ? "None of your production areas is verified yet." : "Declare a production area.");
  return out;
}
const gate = (): Errors | null => {
  const blockers = sellingBlockers();
  return blockers.length ? { gate: blockers[0] } : null;
};

// ── Lots: one shared counter (B2 §9.1, FR-B3-04) ────────────────────────────

export const lotAvailable = (lot: SupplyLot) => Math.max(0, lot.total - lot.reserved - lot.inTransaction);
export const lotTradable = (lot?: SupplyLot) => !!lot && ["PUBLISHED", "PARTIALLY_RESERVED"].includes(lot.status) && lotAvailable(lot) > 0;

function statusFor(lot: SupplyLot): LotStatus {
  if (["DRAFT", "CANCELLED", "EXPIRED", "COMPLETED"].includes(lot.status)) return lot.status;
  const free = lotAvailable(lot);
  if (lot.reserved === 0 && lot.inTransaction === 0) return "PUBLISHED";
  if (free > 0) return "PARTIALLY_RESERVED";
  return lot.reserved > 0 ? "FULLY_RESERVED" : "IN_TRANSACTION";
}

function patchLot(code: string, patch: (lot: SupplyLot) => Partial<SupplyLot>) {
  set((current) => ({
    ...current,
    lots: current.lots.map((lot) => {
      if (lot.code !== code) return lot;
      const next = { ...lot, ...patch(lot) };
      return { ...next, status: statusFor(next) };
    }),
  }));
}
const reserve = (code: string, kg: number) => patchLot(code, (lot) => ({ reserved: lot.reserved + kg }));
const release = (code: string, kg: number) => patchLot(code, (lot) => ({ reserved: Math.max(0, lot.reserved - kg) }));
const commit = (code: string, kg: number) => patchLot(code, (lot) => ({ reserved: Math.max(0, lot.reserved - kg), inTransaction: lot.inTransaction + kg }));

function createTransaction(input: Omit<SupplierTransaction, "code" | "status" | "createdAt" | "total">) {
  const code = nextId("TX");
  set((current) => ({ ...current, transactions: [{ ...input, code, total: input.quantity * input.price, status: "CONFIRMED", createdAt: Date.now() }, ...current.transactions] }));
  notify("Transaction created", `${input.quantity.toLocaleString("en-GB")} kg ${input.crop.toLowerCase()} with ${input.buyer}.`, `/producer/transactions/${code}`);
  return code;
}

// ── B0 identity ─────────────────────────────────────────────────────────────

export const REQUIRED_DOCS: Record<SupplierProfile["type"], string[]> = {
  INDIVIDUAL: ["ID card (CCCD)"],
  HOUSEHOLD_BUSINESS: ["Representative ID"],
  COOPERATIVE: ["Cooperative registration certificate", "Representative ID"],
  ENTERPRISE: ["Business registration certificate", "Representative ID"],
};

export function validateIdentity(profile: SupplierProfile): Errors {
  const errors: Errors = {};
  if (!profile.name.trim()) errors.name = "Enter the name.";
  if (!/^[0-9 +]{9,14}$/.test(profile.phone.trim())) errors.phone = "Enter a valid phone number.";
  if (!/^\S+@\S+\.\S+$/.test(profile.email.trim())) errors.email = "Enter a valid email.";
  if (!profile.address.trim()) errors.address = "Enter the address.";
  if (profile.type === "INDIVIDUAL" && !/^\d{12}$/.test(profile.idNumber ?? "")) errors.idNumber = "Enter the 12-digit ID number.";
  if (profile.type !== "INDIVIDUAL" && !profile.representative?.trim()) errors.representative = "Name the representative.";
  if ((profile.type === "COOPERATIVE" || profile.type === "ENTERPRISE") && !/^\d{10}(\d{3})?$/.test(profile.taxCode ?? "")) errors.taxCode = "Enter the 10- or 13-digit tax code.";
  if (profile.type === "ENTERPRISE" && !profile.registrationNumber?.trim()) errors.registrationNumber = "Enter the enterprise registration number.";
  const missing = REQUIRED_DOCS[profile.type].filter((type) => !profile.documents.some((doc) => doc.type === type));
  if (missing.length) errors.documents = `Upload: ${missing.join(", ")}.`;
  return errors;
}

export function saveIdentity(profile: SupplierProfile): Result {
  if (state.profile.status === "PENDING_VERIFICATION") return fail({ form: "Your profile is being reviewed; you can edit it once the coordinator answers." });
  set((current) => ({ ...current, profile: { ...profile, history: current.profile.history } }));
  return ok(undefined);
}

export function submitIdentity(profile: SupplierProfile): Result {
  const errors = validateIdentity(profile);
  const blocked = failIf(errors);
  if (blocked) return blocked;
  const resent = state.profile.status === "NEEDS_ADDITIONAL_INFORMATION";
  set((current) => ({ ...current, profile: { ...profile, status: "PENDING_VERIFICATION", coordinatorNote: undefined, history: [...current.profile.history, log("SUPPLIER", resent ? "Sent again" : "Submitted for verification")] } }));
  return ok(undefined);
}

export function addDoc(target: "profile" | string, type: string, name: string) {
  const doc: SupplierDoc = { id: nextId("D"), type, name, uploadedAt: Date.now() };
  set((current) =>
    target === "profile"
      ? { ...current, profile: { ...current.profile, documents: [...current.profile.documents, doc] } }
      : { ...current, areas: current.areas.map((area) => (area.code === target ? { ...area, documents: [...area.documents, doc] } : area)) },
  );
  return doc;
}

/** Demo only: the coordinator's decision. */
export function demoDecideIdentity(status: "VERIFIED" | "NEEDS_ADDITIONAL_INFORMATION" | "REJECTED", note?: string) {
  set((current) => ({ ...current, profile: { ...current.profile, status, coordinatorNote: note, history: [...current.profile.history, log("COORDINATOR", status === "VERIFIED" ? "Verified" : status === "REJECTED" ? "Rejected" : "Needs more information", note)] } }));
  notify("Identity verification", status === "VERIFIED" ? "Your identity is verified. You can declare production areas." : note ?? "The coordinator answered.", "/producer/verification", status === "VERIFIED" ? "info" : "warning");
}

// ── B0 production areas ─────────────────────────────────────────────────────

export type AreaDraft = Omit<ProductionArea, "code" | "status" | "history" | "createdAt" | "zone" | "pucVerified" | "coordinatorNote" | "fieldCheck">;

export function validateArea(draft: AreaDraft): Errors {
  const errors: Errors = {};
  if (!draft.name.trim()) errors.name = "Name the area.";
  if (!draft.province) errors.province = "Choose the province.";
  if (!draft.commune.trim()) errors.commune = "Enter the commune or ward.";
  if (!draft.address.trim()) errors.address = "Enter the address.";
  if (!(draft.lat >= 8 && draft.lat <= 24 && draft.lng >= 102 && draft.lng <= 110)) errors.location = "Pick the location in Vietnam (latitude 8–24, longitude 102–110).";
  if (!(draft.hectares > 0)) errors.hectares = "Enter the total area.";
  if (!draft.ownership.trim()) errors.ownership = "Say who owns or manages it.";
  if (draft.crops.length === 0) errors.crops = "Add at least one crop.";
  draft.crops.forEach((crop, index) => {
    if (!crop.crop || !crop.variety || !(crop.hectares > 0) || !crop.season || !crop.plantingFrom || !crop.harvestFrom || !(crop.expectedYield > 0)) errors[`crop${index}`] = "Fill in every field of this crop.";
  });
  const used = draft.crops.reduce((sum, crop) => sum + (crop.hectares || 0), 0);
  if (used > draft.hectares) errors.crops = `The crops use ${used} ha, more than the ${draft.hectares} ha area (BR-B0-13).`;
  if (draft.puc?.trim() && !draft.documents.some((doc) => doc.type === "PUC certificate")) errors.puc = "Upload the PUC certificate, or leave the PUC empty.";
  if (draft.documents.length === 0) errors.documents = "Upload at least one document or photo.";
  return errors;
}

export function declareArea(draft: AreaDraft): Result<string> {
  if (state.profile.status !== "VERIFIED") return fail({ gate: "Verify your identity first; then you can declare production areas (BR-B0-14)." });
  const blocked = failIf(validateArea(draft));
  if (blocked) return blocked;
  const code = nextId("PA");
  const area: ProductionArea = { ...draft, code, pucVerified: false, status: "PENDING_VERIFICATION", zone: zoneForProvince(draft.province), createdAt: Date.now(), history: [log("SUPPLIER", "Declared")] };
  set((current) => ({ ...current, areas: [area, ...current.areas] }));
  return ok(code);
}

export function resubmitArea(code: string, draft: AreaDraft): Result {
  const blocked = failIf(validateArea(draft));
  if (blocked) return blocked;
  set((current) => ({ ...current, areas: current.areas.map((area) => (area.code === code ? { ...area, ...draft, status: "PENDING_VERIFICATION", coordinatorNote: undefined, history: [...area.history, log("SUPPLIER", "Sent again")] } : area)) }));
  return ok(undefined);
}

export function demoDecideArea(code: string, status: "VERIFIED" | "NEEDS_ADDITIONAL_INFORMATION" | "REJECTED", note?: string) {
  set((current) => ({
    ...current,
    areas: current.areas.map((area) => (area.code === code ? { ...area, status, coordinatorNote: note, pucVerified: status === "VERIFIED" && !!area.puc, history: [...area.history, log("COORDINATOR", status === "VERIFIED" ? "Verified" : status === "REJECTED" ? "Rejected" : "Needs more information", note)] } : area)),
  }));
  notify("Production area", status === "VERIFIED" ? `${code} is verified.` : note ?? `${code}: the coordinator answered.`, "/producer/verification", status === "VERIFIED" ? "info" : "warning");
}

export const emptyCrop = (): AreaCrop => ({ id: `C-${Math.random().toString(36).slice(2, 7)}`, crop: "", variety: "", hectares: 0, method: "", season: "", plantingFrom: "", harvestFrom: "", expectedYield: 0 });

// ── B1 production plans ─────────────────────────────────────────────────────

export const SEASONS = ["Winter–Spring", "Summer–Autumn", "Autumn–Winter", "Dry season", "Rainy season", "Year-round"];
export const METHODS = ["Conventional", "VietGAP", "GlobalG.A.P.", "Organic"];
export const PRODUCTION_TYPES = ["Open field", "Greenhouse", "Net house", "Other"];
export const UNITS: { value: ProductionPlan["unit"]; label: string; kg: number }[] = [
  { value: "kg", label: "kg", kg: 1 },
  { value: "ta", label: "tạ (100 kg)", kg: 100 },
  { value: "tan", label: "tấn (1,000 kg)", kg: 1000 },
];
export const toKg = (plan: Pick<ProductionPlan, "expectedQuantity" | "unit">) => plan.expectedQuantity * (UNITS.find((unit) => unit.value === plan.unit)?.kg ?? 1);

export type PlanDraft = Omit<ProductionPlan, "code" | "status" | "createdAt">;

/** Hectares still free on an area for a plan's production period (A-03: overlapping plans count). */
export function freeHectares(areaCode: string, from: string, to: string, ignore?: string) {
  const area = state.areas.find((item) => item.code === areaCode);
  if (!area) return 0;
  const used = state.plans.filter((plan) => plan.areaCode === areaCode && plan.code !== ignore && plan.productionStart <= to && plan.productionEnd >= from).reduce((sum, plan) => sum + plan.hectares, 0);
  return Math.max(0, area.hectares - used);
}

export function validatePlan(draft: PlanDraft): Errors {
  const errors: Errors = {};
  const area = state.areas.find((item) => item.code === draft.areaCode);
  if (!area || area.status !== "VERIFIED") errors.areaCode = "Choose one of your verified production areas.";
  if (!draft.crop || !CROPS.some((crop) => crop.name === draft.crop)) errors.crop = "Choose a crop from the catalog.";
  else if (area && !area.crops.some((crop) => crop.crop === draft.crop)) errors.crop = `${draft.crop} is not declared for this area (B1-VAL02).`;
  if (!draft.variety) errors.variety = "Choose the variety.";
  if (!draft.year || draft.year < new Date().getFullYear()) errors.year = "This year or later.";
  if (!draft.season) errors.season = "Choose the season.";
  if (!draft.productionStart) errors.productionStart = "Pick the start.";
  if (!draft.productionEnd) errors.productionEnd = "Pick the end.";
  else if (draft.productionStart && draft.productionEnd <= draft.productionStart) errors.productionEnd = "Must be after the start.";
  if (!draft.plantingDate) errors.plantingDate = "Pick the planting date.";
  if (!draft.harvestStart || !draft.harvestEnd) errors.harvest = "Pick the harvest window.";
  else if (!(draft.productionStart <= draft.plantingDate && draft.plantingDate <= draft.harvestStart && draft.harvestStart <= draft.harvestEnd && draft.harvestEnd <= draft.productionEnd)) errors.harvest = "Planting and harvest must fall inside the production period, in order.";
  const free = area ? freeHectares(area.code, draft.productionStart, draft.productionEnd) : 0;
  if (!(draft.hectares > 0)) errors.hectares = "Enter the area to farm.";
  else if (area && draft.hectares > free) errors.hectares = `Only ${free} ha of this area is free in that period.`;
  if (!draft.method) errors.method = "Choose the farming method.";
  if (!draft.productionType) errors.productionType = "Choose how it is grown.";
  if (!(draft.expectedQuantity > 0)) errors.expectedQuantity = "Enter the expected yield.";
  if (!UNITS.some((unit) => unit.value === draft.unit)) errors.unit = "Choose a unit.";
  return errors;
}

export function createPlan(draft: PlanDraft): Result<string> {
  if (verifiedAreas().length === 0) return fail({ gate: "You need a verified production area first (B1.1-E1)." });
  const blocked = failIf(validatePlan(draft));
  if (blocked) return blocked;
  const code = nextId("PP");
  set((current) => ({ ...current, plans: [{ ...draft, code, status: "DRAFT", createdAt: Date.now() }, ...current.plans] }));
  return ok(code);
}

// ── B2 supply lots ──────────────────────────────────────────────────────────

/** Quality attributes asked for every product (FR-B2-08); the first two are required. */
export const QUALITY_ATTRIBUTES: { name: string; required: boolean; hint: string }[] = [
  { name: "Average weight", required: true, hint: "e.g. 400–550 g" },
  { name: "Skin colour", required: true, hint: "Colour and ripeness" },
  { name: "Uniformity", required: false, hint: "High / medium / mixed" },
  { name: "Surface", required: false, hint: "Bruises, marks, intact" },
  { name: "Brix", required: false, hint: "Sweetness, if measured" },
];
export const STANDARDS = ["VietGAP", "GlobalG.A.P.", "Organic"];
export const DELIVERY_METHODS: { value: DeliveryMethod; label: string }[] = [
  { value: "SUPPLIER_DELIVERS", label: "I deliver" },
  { value: "BUYER_PICKS_UP", label: "Buyer picks up" },
  { value: "AGREED_CARRIER", label: "Carrier agreed by both" },
];

export type LotDraft = Omit<SupplyLot, "code" | "areaCode" | "crop" | "variety" | "reserved" | "inTransaction" | "status" | "createdAt" | "publishedAt" | "versions">;

export const emptyLot = (planCode = ""): LotDraft => ({
  planCode,
  description: "",
  grade: "A",
  availableFrom: todayIso(),
  availableUntil: addDays(todayIso(), 7),
  total: 0,
  partial: true,
  quality: {},
  standards: [],
  packaging: "",
  packSize: "",
  storage: "",
  evidence: [],
  deliveryLocation: "",
});

/** The fields a lot needs before publishing (B2-VAL04 → VAL13), by step. */
export function validateLot(draft: LotDraft, step: "basics" | "quality" | "terms" | "all" = "all"): Errors {
  const errors: Errors = {};
  const plan = state.plans.find((item) => item.code === draft.planCode);
  const area = plan && state.areas.find((item) => item.code === plan.areaCode);
  const all = step === "all";
  if (step === "basics" || all) {
    if (!plan) errors.planCode = "Choose a production plan.";
    else if (area?.status !== "VERIFIED") errors.planCode = "This plan's area is not verified (B2-VAL02).";
    if (!draft.description.trim()) errors.description = "Describe the produce.";
    if (!(draft.total > 0)) errors.total = "Enter the quantity.";
    if (!draft.harvestDate && !draft.expectedHarvestDate) errors.harvest = "Enter the harvest date (actual or expected).";
    else if (plan) {
      const harvest = (draft.harvestDate ?? draft.expectedHarvestDate)!;
      if (harvest < plan.productionStart || harvest > plan.productionEnd) errors.harvest = `Must fall in the plan's production period, ${formatDate(plan.productionStart, false)} – ${formatDate(plan.productionEnd, false)} (B2-VAL08).`;
    }
    if (!draft.availableFrom || !draft.availableUntil) errors.availableFrom = "Pick when it can be sold.";
    else if (draft.availableFrom > draft.availableUntil) errors.availableFrom = "Ready date must be on or before the sell-by date (B2-VAL07).";
    if (draft.moq !== undefined && (draft.moq <= 0 || draft.moq > draft.total)) errors.moq = "Between 1 and the lot quantity (B2-VAL11).";
  }
  if (step === "quality" || all) {
    QUALITY_ATTRIBUTES.filter((attr) => attr.required && !draft.quality[attr.name]?.trim()).forEach((attr) => (errors[`q:${attr.name}`] = "Required."));
    if (!draft.packaging.trim()) errors.packaging = "How is it packed?";
    if (!draft.packSize.trim()) errors.packSize = "Pack size.";
    if (!draft.storage.trim()) errors.storage = "How is it stored?";
    if (!draft.evidence.some((item) => item.type === "PRODUCE_PHOTO")) errors.evidence = "Add at least one photo of the produce.";
    const uncovered = draft.standards.filter((standard) => !draft.evidence.some((item) => item.type === "CERTIFICATE" && item.name.toLowerCase().includes(standard.toLowerCase().slice(0, 4))));
    if (uncovered.length) errors.standards = `Upload the certificate for ${uncovered.join(", ")}.`;
    if (!draft.accuracyConfirmedAt) errors.accuracy = "Confirm the information is accurate.";
  }
  if (step === "terms" || all) {
    if (draft.askingPrice !== undefined && !(draft.askingPrice > 0)) errors.askingPrice = "A price must be above 0, or leave it empty (B2-VAL12).";
    if (!draft.deliveryLocation.trim()) errors.deliveryLocation = "Where is it handed over?";
    if (!draft.deliveryMethod) errors.deliveryMethod = "Choose how it is delivered.";
  }
  return errors;
}

/** Lots from the same plan above its expected yield (B2-VAL05): a warning that needs a reason (A-03). */
export function overCapacity(draft: Pick<LotDraft, "planCode" | "total">, code?: string) {
  const plan = state.plans.find((item) => item.code === draft.planCode);
  if (!plan) return null;
  const declared = state.lots.filter((lot) => lot.planCode === plan.code && lot.code !== code && !["CANCELLED", "EXPIRED"].includes(lot.status)).reduce((sum, lot) => sum + lot.total, 0);
  const expected = toKg(plan);
  return declared + draft.total > expected ? { declared, expected } : null;
}

export function saveLotDraft(draft: LotDraft, code?: string): Result<string> {
  const plan = state.plans.find((item) => item.code === draft.planCode);
  if (!plan) return fail({ planCode: "Choose a production plan." });
  if (state.areas.find((area) => area.code === plan.areaCode)?.status !== "VERIFIED") return fail({ planCode: "This plan's area is not verified (B2-VAL02)." });
  if (code) {
    set((current) => ({ ...current, lots: current.lots.map((lot) => (lot.code === code && lot.status === "DRAFT" ? { ...lot, ...draft, crop: plan.crop, variety: plan.variety, areaCode: plan.areaCode } : lot)) }));
    return ok(code);
  }
  const next = nextId("SL");
  const lot: SupplyLot = { ...draft, code: next, areaCode: plan.areaCode, crop: plan.crop, variety: plan.variety, reserved: 0, inTransaction: 0, status: "DRAFT", createdAt: Date.now(), versions: [] };
  set((current) => ({ ...current, lots: [lot, ...current.lots] }));
  return ok(next);
}

const snapshot = (lot: Pick<SupplyLot, "total" | "grade" | "askingPrice" | "availableUntil">) => `${lot.total.toLocaleString("en-GB")} kg · Grade ${lot.grade} · ${lot.askingPrice ? `${lot.askingPrice.toLocaleString("en-GB")} ₫/kg` : "no asking price"} · until ${formatDate(lot.availableUntil, false)}`;

export function publishLot(code: string, overReason?: string): Result {
  const blocked = gate();
  if (blocked) return fail(blocked);
  const lot = state.lots.find((item) => item.code === code);
  if (!lot || lot.status !== "DRAFT") return fail({ form: "Only a draft can be published." });
  const errors = validateLot(lot);
  if (overCapacity(lot, code) && !overReason?.trim()) errors.overReason = "This is more than the plan expects. Give a reason to continue.";
  const failed = failIf(errors);
  if (failed) return failed;
  set((current) => ({
    ...current,
    lots: current.lots.map((item) => (item.code === code ? { ...item, status: "PUBLISHED", publishedAt: Date.now(), versions: [{ number: 1, at: Date.now(), reason: overReason ? `Published · ${overReason}` : "Published", snapshot: snapshot(item) }] } : item)),
  }));
  return ok(undefined);
}

/** Editing a published lot saves a version (FR-B2-24); held or sold kilograms cannot be cut (FR-B2-25). */
export function updateLot(code: string, changes: Partial<Pick<SupplyLot, "total" | "askingPrice" | "availableUntil" | "description" | "deliveryLocation" | "moq">>, reason: string): Result {
  const lot = state.lots.find((item) => item.code === code);
  if (!lot || !["PUBLISHED", "PARTIALLY_RESERVED", "EXPIRED"].includes(lot.status)) return fail({ form: "This lot cannot be changed now." });
  if (!reason.trim()) return fail({ reason: "Say why it changed; buyers see the new version." });
  const next = { ...lot, ...changes };
  const errors: Errors = {};
  if (next.total < lot.reserved + lot.inTransaction) errors.total = `At least ${(lot.reserved + lot.inTransaction).toLocaleString("en-GB")} kg is held or sold.`;
  if (state.auctions.some((auction) => auction.lotCode === code && ["SCHEDULED", "ACTIVE"].includes(auction.status)) && (changes.total !== undefined && changes.total !== lot.total || changes.availableUntil !== undefined && changes.availableUntil !== lot.availableUntil)) errors.form = "An auction on this lot is open; quantity and dates are locked (BR-B3.2-23).";
  if (next.availableUntil < next.availableFrom) errors.availableUntil = "Must be after the ready date.";
  if (next.askingPrice !== undefined && !(next.askingPrice > 0)) errors.askingPrice = "Above 0, or empty.";
  const failed = failIf(errors);
  if (failed) return failed;
  const reopened = lot.status === "EXPIRED" && next.availableUntil >= todayIso();
  set((current) => ({
    ...current,
    lots: current.lots.map((item) => {
      if (item.code !== code) return item;
      const updated: SupplyLot = { ...next, status: reopened ? "PUBLISHED" : item.status, versions: [...item.versions, { number: item.versions.length + 1, at: Date.now(), reason, snapshot: snapshot(next) }] };
      return { ...updated, status: statusFor(updated) };
    }),
  }));
  return ok(undefined);
}

export function cancelLot(code: string, reason: string): Result {
  const lot = state.lots.find((item) => item.code === code);
  if (!lot) return fail({ form: "Lot not found." });
  if (!reason.trim()) return fail({ reason: "Give a reason." });
  if (lot.inTransaction > 0) return fail({ form: "Part of this lot is in a confirmed transaction; it cannot be cancelled (A-10)." });
  if (lot.reserved > 0) return fail({ form: "Release the held quantity first: cancel its auction or sell orders (A-10)." });
  set((current) => ({ ...current, lots: current.lots.map((item) => (item.code === code ? { ...item, status: "CANCELLED", cancelReason: reason } : item)) }));
  return ok(undefined);
}

export function addEvidence(type: Evidence["type"], name: string): Evidence {
  return { id: nextId("E"), type, name, uploadedAt: Date.now() };
}

// ── B3.3 sell orders and match results ──────────────────────────────────────

export type SellDraft = { lotCode: string; quantity: number; minPrice: number; availableFrom: string; availableUntil: string; deliveryTerms?: string; timeInForce: TimeInForce; validUntil?: string };

export function validateSell(draft: SellDraft): Errors {
  const errors: Errors = {};
  const lot = state.lots.find((item) => item.code === draft.lotCode);
  if (!lotTradable(lot)) errors.lotCode = "Choose a published lot with kilograms free.";
  if (!(draft.quantity > 0)) errors.quantity = "Enter how much to sell.";
  else if (lot && draft.quantity > lotAvailable(lot)) errors.quantity = `Only ${lotAvailable(lot).toLocaleString("en-GB")} kg of this lot is free (B3.3.2-E1).`;
  if (!(draft.minPrice > 0)) errors.minPrice = "Enter the lowest price you accept.";
  if (!draft.availableFrom || !draft.availableUntil || draft.availableFrom > draft.availableUntil) errors.availableFrom = "Pick a valid supply window.";
  if (draft.timeInForce === "GTC" && (!draft.validUntil || draft.validUntil < todayIso())) errors.validUntil = "Pick until when the order stays.";
  return errors;
}

export function placeSellOrder(draft: SellDraft): Result<string> {
  const blocked = gate();
  if (blocked) return fail(blocked);
  const failed = failIf(validateSell(draft));
  if (failed) return failed;
  const lot = state.lots.find((item) => item.code === draft.lotCode)!;
  const area = state.areas.find((item) => item.code === lot.areaCode);
  const code = nextId("SO");
  reserve(lot.code, draft.quantity);
  const order: SellOrder = { code, lotCode: lot.code, crop: lot.crop, variety: lot.variety, grade: lot.grade, zone: area?.zone ?? "SC-BTH", offered: draft.quantity, remaining: draft.quantity, minPrice: draft.minPrice, availableFrom: draft.availableFrom, availableUntil: draft.availableUntil, deliveryTerms: draft.deliveryTerms, timeInForce: draft.timeInForce, validUntil: draft.validUntil, priorityTime: Date.now(), status: "OPEN", createdAt: Date.now(), history: [log("SUPPLIER", "Placed", `${draft.quantity.toLocaleString("en-GB")} kg at least ${draft.minPrice.toLocaleString("en-GB")} ₫/kg`)] };
  set((current) => ({ ...current, sellOrders: [order, ...current.sellOrders] }));
  return ok(code);
}

export const sellLocked = (now = Date.now()) => {
  const slot = nextSlot(now);
  return now >= slot.cutoff - 0 && now < slot.scheduled ? slot : null;
};

export function cancelSellOrder(code: string): Result {
  const order = state.sellOrders.find((item) => item.code === code);
  if (!order || !["OPEN", "PARTIALLY_FILLED"].includes(order.status)) return fail({ form: "This order is not open." });
  release(order.lotCode, order.remaining);
  set((current) => ({ ...current, sellOrders: current.sellOrders.map((item) => (item.code === code ? { ...item, status: "CANCELLED", history: [...item.history, log("SUPPLIER", "Cancelled", `${item.remaining.toLocaleString("en-GB")} kg back to the lot`)] } : item)) }));
  return ok(undefined);
}

function settleMatch(match: SupplierMatch) {
  if (match.buyerSide === "CONFIRMED" && match.supplier === "CONFIRMED") {
    commit(match.lotCode, match.quantity);
    createTransaction({ mechanism: "ORDER_MATCHING", sourceRef: match.code, sourceParent: match.sellOrderCode, buyer: match.buyer, lotCode: match.lotCode, crop: match.crop, variety: match.variety, quantity: match.quantity, price: match.clearingPrice, deliveryTerms: `To ${match.deliveryLocation}, ${match.deliveryWindow}` });
    return "CONFIRMED" as const;
  }
  return "PARTIALLY_CONFIRMED" as const;
}

export function confirmMatch(code: string): Result {
  const match = state.matches.find((item) => item.code === code);
  if (!match || match.supplier !== "PENDING" || !["PENDING_CONFIRMATION", "PARTIALLY_CONFIRMED"].includes(match.status)) return fail({ form: "This result is not waiting for you." });
  if (Date.now() > match.deadline) return fail({ form: "The deadline has passed." });
  const next = { ...match, supplier: "CONFIRMED" as const };
  const status = settleMatch(next);
  set((current) => ({ ...current, matches: current.matches.map((item) => (item.code === code ? { ...next, status } : item)) }));
  return ok(undefined);
}

/** Rejecting puts the kilograms back on the sell order if it is still live, otherwise frees them on the lot. */
function returnMatch(match: SupplierMatch) {
  const order = state.sellOrders.find((item) => item.code === match.sellOrderCode);
  const live = order && ["OPEN", "PARTIALLY_FILLED"].includes(order.status) || (order?.status === "FILLED" && (!order.validUntil || order.validUntil >= todayIso()));
  if (order && live) set((current) => ({ ...current, sellOrders: current.sellOrders.map((item) => (item.code === order.code ? { ...item, remaining: item.remaining + match.quantity, status: "PARTIALLY_FILLED" } : item)) }));
  else release(match.lotCode, match.quantity);
}

export function rejectMatch(code: string, reason: string): Result {
  const match = state.matches.find((item) => item.code === code);
  if (!match || match.supplier !== "PENDING") return fail({ form: "This result is not waiting for you." });
  if (!reason.trim()) return fail({ reason: "Give a reason; the buyer sees it." });
  returnMatch(match);
  set((current) => ({ ...current, matches: current.matches.map((item) => (item.code === code ? { ...item, supplier: "REJECTED", status: "REJECTED", reason } : item)) }));
  return ok(undefined);
}

const BUYERS = ["GreenBasket Supermarkets", "Saigon Fresh Mart", "Mekong Juice Co.", "Hanoi Fruit Hub", "Coastal Hotels Group"];

/** A matching session against simulated buy orders: one uniform price per group, price-time priority. */
export function runSupplierSession(slot: SessionSlot) {
  if (state.sessions.includes(slot.code)) return;
  set((current) => ({ ...current, sessions: [...current.sessions, slot.code] }));
  const open = state.sellOrders.filter((order) => ["OPEN", "PARTIALLY_FILLED"].includes(order.status) && order.priorityTime < slot.cutoff).sort((a, b) => a.minPrice - b.minPrice || a.priorityTime - b.priorityTime);
  open.forEach((order, index) => {
    const market = 24_500 + ((slot.scheduled / HOUR) % 5) * 100;
    if (order.minPrice > market + 500) return;
    const quantity = Math.min(order.remaining, Math.round((order.remaining * (0.4 + (index % 3) * 0.2)) / 50) * 50 || order.remaining);
    if (quantity <= 0) return;
    const price = Math.max(order.minPrice, market);
    const buyer = BUYERS[(slot.scheduled / HOUR + index) % BUYERS.length | 0];
    const code = nextId("MR");
    const match: SupplierMatch = { code, sessionCode: slot.code, sellOrderCode: order.code, lotCode: order.lotCode, buyer, crop: order.crop, variety: order.variety, grade: order.grade, quantity, clearingPrice: price, total: quantity * price, deliveryLocation: "Buyer's DC, Ho Chi Minh City", deliveryWindow: `${formatDate(order.availableFrom, false)} – ${formatDate(order.availableUntil, false)}`, buyerSide: "PENDING", supplier: "PENDING", status: "PENDING_CONFIRMATION", createdAt: Date.now(), deadline: Date.now() + confirmHours() * HOUR };
    const remaining = order.remaining - quantity;
    set((current) => ({
      ...current,
      matches: [match, ...current.matches],
      sellOrders: current.sellOrders.map((item) => (item.code === order.code ? { ...item, remaining, status: remaining === 0 ? "FILLED" : "PARTIALLY_FILLED", history: [...item.history, log("SYSTEM", `Matched ${quantity.toLocaleString("en-GB")} kg`, `${slot.code} · ${price.toLocaleString("en-GB")} ₫/kg`)] } : item)),
    }));
    notify("New match result", `${quantity.toLocaleString("en-GB")} kg ${order.crop.toLowerCase()} to ${buyer} at ${price.toLocaleString("en-GB")} ₫/kg. Confirm it.`, "/producer/sell-orders?tab=results", "warning");
    later(6000, () => {
      const current = state.matches.find((item) => item.code === code);
      if (!current || current.buyerSide !== "PENDING") return;
      const next = { ...current, buyerSide: "CONFIRMED" as const };
      const status = current.supplier === "CONFIRMED" ? settleMatch(next) : "PARTIALLY_CONFIRMED";
      set((s) => ({ ...s, matches: s.matches.map((item) => (item.code === code ? { ...next, status } : item)) }));
    });
  });
}

export function demoMatchNow() {
  const slot = nextSlot(Date.now());
  state = { ...state, seq: state.seq + 1 };
  runSupplierSession({ ...slot, code: `${slot.code}-DEMO-${state.seq}`, cutoff: Date.now() + 1, scheduled: Date.now() });
}

// ── B3.1 demands and proposals ──────────────────────────────────────────────

export type ProposalDraft = { lotCode: string; quantity: number; price: number; deliveryDate: string; deliveryMethod: DeliveryMethod; terms?: string };

export function validateProposal(demand: OpenDemand, draft: ProposalDraft): Errors {
  const errors: Errors = {};
  const lot = state.lots.find((item) => item.code === draft.lotCode);
  if (!lot || !lotTradable(lot) || lot.crop !== demand.crop) errors.lotCode = `Choose a published ${demand.crop.toLowerCase()} lot.`;
  if (!(draft.quantity > 0)) errors.quantity = "Enter the quantity you commit.";
  else if (draft.quantity > demand.quantity) errors.quantity = `At most the ${demand.quantity.toLocaleString("en-GB")} kg asked (B3.1.3-E1).`;
  else if (lot && draft.quantity > lotAvailable(lot)) errors.quantity = `Only ${lotAvailable(lot).toLocaleString("en-GB")} kg of this lot is free.`;
  if (!(draft.price > 0)) errors.price = "Enter your price.";
  if (!draft.deliveryDate || draft.deliveryDate < demand.deliveryFrom || draft.deliveryDate > demand.deliveryTo) errors.deliveryDate = `Between ${formatDate(demand.deliveryFrom, false)} and ${formatDate(demand.deliveryTo, false)}.`;
  return errors;
}

export function submitProposal(demandCode: string, draft: ProposalDraft): Result<string> {
  const blocked = gate();
  if (blocked) return fail(blocked);
  const demand = state.demands.find((item) => item.code === demandCode);
  if (!demand || demand.status !== "PUBLISHED" || Date.now() > demand.deadline) return fail({ form: "This demand no longer takes proposals." });
  const existing = state.proposals.find((item) => item.demandCode === demandCode && item.status === "SUBMITTED");
  const failed = failIf(validateProposal(demand, draft));
  if (failed) return failed;
  if (existing) {
    set((current) => ({ ...current, proposals: current.proposals.map((item) => (item.code === existing.code ? { ...item, ...draft, history: [...item.history, log("SUPPLIER", "Edited", `${draft.quantity.toLocaleString("en-GB")} kg · ${draft.price.toLocaleString("en-GB")} ₫/kg`)] } : item)) }));
    return ok(existing.code);
  }
  const code = nextId("SP");
  set((current) => ({ ...current, proposals: [{ ...draft, code, demandCode, status: "SUBMITTED", submittedAt: Date.now(), rounds: [], history: [log("SUPPLIER", "Submitted")] }, ...current.proposals] }));
  return ok(code);
}

export function withdrawProposal(code: string): Result {
  const proposal = state.proposals.find((item) => item.code === code);
  const demand = proposal && state.demands.find((item) => item.code === proposal.demandCode);
  if (!proposal || proposal.status !== "SUBMITTED" || !demand || Date.now() > demand.deadline) return fail({ form: "It can only be withdrawn before the deadline." });
  set((current) => ({ ...current, proposals: current.proposals.map((item) => (item.code === code ? { ...item, status: "WITHDRAWN", history: [...item.history, log("SUPPLIER", "Withdrawn")] } : item)) }));
  return ok(undefined);
}

/** The buyer then confirms the award with the agreed terms (simulated), which holds the kilograms. */
function simulateAward(code: string, quantity: number, price: number) {
  later(5000, () => {
    const proposal = state.proposals.find((item) => item.code === code);
    if (!proposal || proposal.award) return;
    const lot = state.lots.find((item) => item.code === proposal.lotCode);
    if (!lot || lotAvailable(lot) < quantity) {
      set((current) => ({ ...current, proposals: current.proposals.map((item) => (item.code === code ? { ...item, status: "INVALID", history: [...item.history, log("SYSTEM", "Invalid", "Not enough free quantity on the lot")] } : item)) }));
      return;
    }
    reserve(lot.code, quantity);
    set((current) => ({ ...current, proposals: current.proposals.map((item) => (item.code === code ? { ...item, award: { quantity, price, deadline: Date.now() + confirmHours() * HOUR, status: "PENDING_SUPPLIER_CONFIRMATION" }, history: [...item.history, log("BUYER", "Confirmed the award", `${quantity.toLocaleString("en-GB")} kg · ${price.toLocaleString("en-GB")} ₫/kg`)] } : item)) }));
    notify("You were awarded", `${quantity.toLocaleString("en-GB")} kg at ${price.toLocaleString("en-GB")} ₫/kg. Confirm it.`, `/producer/demands/${proposal.demandCode}`, "warning");
  });
}

export function answerRound(code: string, answer: "ACCEPT" | "REJECT"): Result {
  const proposal = state.proposals.find((item) => item.code === code);
  const round = proposal?.rounds.at(-1);
  if (!proposal || !round || round.by !== "BUYER" || round.status !== "PENDING") return fail({ form: "Nothing waits for your answer." });
  const status = answer === "ACCEPT" ? "ACCEPTED" : "REJECTED";
  set((current) => ({ ...current, proposals: current.proposals.map((item) => (item.code === code ? { ...item, rounds: item.rounds.map((r) => (r === round ? { ...r, status } : r)), history: [...item.history, log("SUPPLIER", answer === "ACCEPT" ? "Accepted the buyer's terms" : "Rejected the buyer's terms")] } : item)) }));
  simulateAward(code, round.quantity ?? proposal.quantity, answer === "ACCEPT" ? round.price ?? proposal.price : proposal.price);
  return ok(undefined);
}

export function counterRound(code: string, input: { price?: number; quantity?: number; note?: string }): Result {
  const proposal = state.proposals.find((item) => item.code === code);
  const round = proposal?.rounds.at(-1);
  if (!proposal || !round || round.status !== "PENDING" || round.by !== "BUYER") return fail({ form: "Nothing waits for your answer." });
  if (!input.price && !input.quantity) return fail({ price: "Propose a price or a quantity." });
  if (input.price !== undefined && !(input.price > 0)) return fail({ price: "Above 0." });
  set((current) => ({
    ...current,
    proposals: current.proposals.map((item) => (item.code === code ? { ...item, rounds: [...item.rounds.map((r) => (r === round ? { ...r, status: "COUNTERED" as const } : r)), { round: round.round + 1, by: "SUPPLIER", ...input, status: "PENDING", at: Date.now() }], history: [...item.history, log("SUPPLIER", "Proposed other terms", input.price ? `${input.price.toLocaleString("en-GB")} ₫/kg` : undefined)] } : item)),
  }));
  // The buyer accepts the counter-offer a moment later.
  later(5000, () => {
    set((current) => ({ ...current, proposals: current.proposals.map((item) => (item.code === code ? { ...item, rounds: item.rounds.map((r, i) => (i === item.rounds.length - 1 && r.status === "PENDING" ? { ...r, status: "ACCEPTED" as const } : r)), history: [...item.history, log("BUYER", "Accepted your terms")] } : item)) }));
    simulateAward(code, input.quantity ?? proposal.quantity, input.price ?? proposal.price);
  });
  return ok(undefined);
}

export function answerAward(code: string, answer: "CONFIRM" | "DECLINE", reason?: string): Result {
  const proposal = state.proposals.find((item) => item.code === code);
  const award = proposal?.award;
  if (!proposal || !award || award.status !== "PENDING_SUPPLIER_CONFIRMATION") return fail({ form: "No award waits for you." });
  if (answer === "DECLINE" && !reason?.trim()) return fail({ reason: "Give a reason; the buyer sees it." });
  const demand = state.demands.find((item) => item.code === proposal.demandCode)!;
  if (answer === "CONFIRM") {
    commit(proposal.lotCode, award.quantity);
    const lot = state.lots.find((item) => item.code === proposal.lotCode)!;
    createTransaction({ mechanism: "BUYER_LED_PROCUREMENT", sourceRef: code, sourceParent: demand.code, buyer: demand.buyer, lotCode: lot.code, crop: lot.crop, variety: lot.variety, quantity: award.quantity, price: award.price, deliveryTerms: `To ${demand.deliveryLocation} on ${formatDate(proposal.deliveryDate)}` });
  } else release(proposal.lotCode, award.quantity);
  set((current) => ({ ...current, proposals: current.proposals.map((item) => (item.code === code ? { ...item, award: { ...award, status: answer === "CONFIRM" ? "CONFIRMED" : "DECLINED", reason }, history: [...item.history, log("SUPPLIER", answer === "CONFIRM" ? "Confirmed the award" : "Declined the award", reason)] } : item)) }));
  return ok(undefined);
}

// ── B3.2 auctions ───────────────────────────────────────────────────────────

export type AuctionDraft = { lotCode: string; name: string; description?: string; quantity: number; minBid: number; startingPrice: number; startTime: number; endTime: number; deliveryLocation: string; deliveryTerms?: string; conditions?: string };

export function validateAuction(draft: AuctionDraft, ignore?: string): Errors {
  const errors: Errors = {};
  const lot = state.lots.find((item) => item.code === draft.lotCode);
  if (!lotTradable(lot)) errors.lotCode = "Choose a published lot with kilograms free.";
  if (!draft.name.trim()) errors.name = "Name the auction.";
  if (!(draft.quantity > 0)) errors.quantity = "Enter the quantity.";
  else if (lot && draft.quantity > lotAvailable(lot)) errors.quantity = `Only ${lotAvailable(lot).toLocaleString("en-GB")} kg of this lot is free (BR-B3.2-04).`;
  if (!(draft.minBid > 0) || draft.minBid > draft.quantity) errors.minBid = "Between 1 kg and the auction quantity.";
  if (!(draft.startingPrice > 0)) errors.startingPrice = "Enter the starting price.";
  if (!(draft.endTime > draft.startTime)) errors.endTime = "Must end after it starts.";
  else if (draft.endTime < Date.now() + 10 * MINUTE) errors.endTime = "Leave at least 10 minutes for bids.";
  if (!draft.deliveryLocation.trim()) errors.deliveryLocation = "Where is it handed over?";
  if (ignore === "__") errors.form = "";
  return errors;
}

export function saveAuction(draft: AuctionDraft, code?: string): Result<string> {
  const blocked = gate();
  if (blocked) return fail(blocked);
  const failed = failIf(validateAuction(draft));
  if (failed) return failed;
  const lot = state.lots.find((item) => item.code === draft.lotCode)!;
  if (code) {
    set((current) => ({ ...current, auctions: current.auctions.map((item) => (item.code === code && item.status === "DRAFT" ? { ...item, ...draft, history: [...item.history, log("SUPPLIER", "Edited")] } : item)) }));
    return ok(code);
  }
  const next = nextId("AU");
  set((current) => ({ ...current, auctions: [{ ...draft, code: next, crop: lot.crop, variety: lot.variety, grade: lot.grade, status: "DRAFT", history: [log("SUPPLIER", "Created")] }, ...current.auctions] }));
  return ok(next);
}

export function deleteDraftAuction(code: string) {
  set((current) => ({ ...current, auctions: current.auctions.filter((item) => !(item.code === code && item.status === "DRAFT")) }));
}

export function publishAuction(code: string): Result {
  const blocked = gate();
  if (blocked) return fail(blocked);
  const auction = state.auctions.find((item) => item.code === code);
  if (!auction || auction.status !== "DRAFT") return fail({ form: "Only a draft can be published." });
  const failed = failIf(validateAuction(auction));
  if (failed) return failed;
  reserve(auction.lotCode, auction.quantity);
  const status = auction.startTime <= Date.now() ? "ACTIVE" : "SCHEDULED";
  set((current) => ({ ...current, auctions: current.auctions.map((item) => (item.code === code ? { ...item, status, history: [...item.history, log("SUPPLIER", "Published", `${auction.quantity.toLocaleString("en-GB")} kg held on ${auction.lotCode}`)] } : item)) }));
  return ok(undefined);
}

function closeAuction(code: string, status: "NO_WINNER" | "COMPLETED" | "CANCELLED", note?: string) {
  const auction = state.auctions.find((item) => item.code === code)!;
  const confirmed = state.allocations.filter((item) => item.auctionCode === code && item.status === "CONFIRMED").reduce((sum, item) => sum + item.quantity, 0);
  release(auction.lotCode, auction.quantity - confirmed);
  set((current) => ({ ...current, auctions: current.auctions.map((item) => (item.code === code ? { ...item, status, cancelReason: status === "CANCELLED" ? note : item.cancelReason, history: [...item.history, log(status === "CANCELLED" ? "SUPPLIER" : "SYSTEM", status === "CANCELLED" ? "Cancelled" : status === "NO_WINNER" ? "No winner" : "Completed", note)] } : item)) }));
}

export function cancelAuction(code: string, reason: string): Result {
  const auction = state.auctions.find((item) => item.code === code);
  if (!auction || !["SCHEDULED", "ACTIVE"].includes(auction.status)) return fail({ form: "Only a scheduled or open auction can be cancelled." });
  if (!reason.trim()) return fail({ reason: "Give a reason; bidders are told." });
  closeAuction(code, "CANCELLED", reason);
  set((current) => ({ ...current, bids: current.bids.map((bid) => (bid.auctionCode === code && bid.status === "SUBMITTED" ? { ...bid, status: "REJECTED" } : bid)) }));
  return ok(undefined);
}

function endAuction(code: string, reason: string, by: Actor) {
  const bids = state.bids.filter((bid) => bid.auctionCode === code && bid.status === "SUBMITTED");
  set((current) => ({ ...current, auctions: current.auctions.map((item) => (item.code === code ? { ...item, status: "ENDED", endedAt: Date.now(), endReason: reason, history: [...item.history, log(by, reason)] } : item)) }));
  if (bids.length === 0) closeAuction(code, "NO_WINNER", "No bids");
  else notify("Auction ended", `${code} has ${bids.length} bid${bids.length === 1 ? "" : "s"}. Choose who gets how much.`, `/producer/auctions/${code}`, "warning");
}

export function endEarly(code: string, reason: string): Result {
  const auction = state.auctions.find((item) => item.code === code);
  if (!auction || auction.status !== "ACTIVE") return fail({ form: "Only an open auction can end early." });
  if (!reason.trim()) return fail({ reason: "Give a reason." });
  endAuction(code, `Ended early · ${reason}`, "SUPPLIER");
  return ok(undefined);
}

/** Choose bids and how much each gets (B3.2.4); also used to pick replacement bids (B3.2.5). */
export function allocate(code: string, split: Record<string, number>): Result {
  const auction = state.auctions.find((item) => item.code === code);
  if (!auction || !["ENDED", "PENDING_CONFIRMATION"].includes(auction.status)) return fail({ form: "Bids can be chosen once the auction has ended (B3.2-VAL22)." });
  const chosen = Object.entries(split).filter(([, kg]) => kg > 0);
  if (chosen.length === 0) return fail({ form: "Give a quantity to at least one bid." });
  const errors: Errors = {};
  for (const [bidCode, kg] of chosen) {
    const bid = state.bids.find((item) => item.code === bidCode && item.auctionCode === code);
    if (!bid || !["SUBMITTED", "REJECTED"].includes(bid.status) || bid.submittedAt > (auction.endedAt ?? auction.endTime)) errors[bidCode] = "This bid cannot be chosen (B3.2-VAL24).";
    else if (kg > bid.quantity) errors[bidCode] = `At most the ${bid.quantity.toLocaleString("en-GB")} kg bid (B3.2-VAL25).`;
  }
  const live = state.allocations.filter((item) => item.auctionCode === code && ["PENDING_CONFIRMATION", "CONFIRMED"].includes(item.status)).reduce((sum, item) => sum + item.quantity, 0);
  const total = chosen.reduce((sum, [, kg]) => sum + kg, 0);
  if (live + total > auction.quantity) errors.form = `Total ${(live + total).toLocaleString("en-GB")} kg is more than the ${auction.quantity.toLocaleString("en-GB")} kg auctioned (B3.2-VAL26).`;
  const failed = failIf(errors);
  if (failed) return failed;
  const deadline = Date.now() + confirmHours() * HOUR;
  const created: Allocation[] = chosen.map(([bidCode, kg]) => {
    const bid = state.bids.find((item) => item.code === bidCode)!;
    return { id: nextId("AL"), auctionCode: code, bidCode, buyer: bid.buyer, quantity: kg, price: bid.price, deadline, status: "PENDING_CONFIRMATION", createdAt: Date.now() };
  });
  const first = auction.status === "ENDED";
  set((current) => ({
    ...current,
    allocations: [...created, ...current.allocations],
    bids: current.bids.map((bid) => (bid.auctionCode !== code ? bid : split[bid.code] > 0 ? { ...bid, status: "ACCEPTED" } : first && bid.status === "SUBMITTED" ? { ...bid, status: "REJECTED" } : bid)),
    auctions: current.auctions.map((item) => (item.code === code ? { ...item, status: "PENDING_CONFIRMATION", history: [...item.history, log("SUPPLIER", first ? "Chose bids" : "Chose replacement bids", created.map((a) => `${a.buyer}: ${a.quantity.toLocaleString("en-GB")} kg`).join(" · "))] } : item)),
  }));
  // Buyers answer a moment later: the cheapest chosen bid declines in the demo, the others confirm.
  created.forEach((allocation, index) => later(5000 + index * 2500, () => answerAllocation(allocation.id, created.length > 1 && index === created.length - 1 ? "DECLINED" : "CONFIRMED")));
  return ok(undefined);
}

function answerAllocation(id: string, status: "CONFIRMED" | "DECLINED" | "EXPIRED") {
  const allocation = state.allocations.find((item) => item.id === id);
  if (!allocation || allocation.status !== "PENDING_CONFIRMATION") return;
  const auction = state.auctions.find((item) => item.code === allocation.auctionCode)!;
  if (status === "CONFIRMED") {
    commit(auction.lotCode, allocation.quantity);
    createTransaction({ mechanism: "SUPPLIER_LED_AUCTION", sourceRef: id, sourceParent: auction.code, buyer: allocation.buyer, lotCode: auction.lotCode, crop: auction.crop, variety: auction.variety, quantity: allocation.quantity, price: allocation.price, deliveryTerms: `${auction.deliveryLocation}${auction.deliveryTerms ? ` · ${auction.deliveryTerms}` : ""}` });
  } else notify(status === "DECLINED" ? "A buyer declined" : "A result expired", `${allocation.buyer} ${status === "DECLINED" ? "declined" : "did not confirm"} ${allocation.quantity.toLocaleString("en-GB")} kg. You can choose a replacement bid.`, `/producer/auctions/${auction.code}`, "warning");
  set((current) => ({
    ...current,
    allocations: current.allocations.map((item) => (item.id === id ? { ...item, status } : item)),
    bids: current.bids.map((bid) => (bid.code === allocation.bidCode ? { ...bid, status: status === "CONFIRMED" ? "CONFIRMED" : status } : bid)),
  }));
  maybeComplete(auction.code);
}

/** Done when nothing waits and the supplier is not choosing a replacement (FR-B3.2-34). */
function maybeComplete(code: string) {
  const all = state.allocations.filter((item) => item.auctionCode === code);
  if (all.some((item) => item.status === "PENDING_CONFIRMATION")) return;
  const confirmed = all.filter((item) => item.status === "CONFIRMED").reduce((sum, item) => sum + item.quantity, 0);
  const auction = state.auctions.find((item) => item.code === code)!;
  const spare = state.bids.some((bid) => bid.auctionCode === code && bid.status === "REJECTED");
  if (confirmed >= auction.quantity || !spare) closeAuction(code, confirmed > 0 ? "COMPLETED" : "NO_WINNER");
}

/** Close with what is confirmed and give the rest back to the lot. */
export function finishAuction(code: string): Result {
  const auction = state.auctions.find((item) => item.code === code);
  if (!auction || auction.status !== "PENDING_CONFIRMATION") return fail({ form: "Nothing to finish." });
  if (state.allocations.some((item) => item.auctionCode === code && item.status === "PENDING_CONFIRMATION")) return fail({ form: "Wait for the buyers who still have to confirm." });
  const confirmed = state.allocations.some((item) => item.auctionCode === code && item.status === "CONFIRMED");
  closeAuction(code, confirmed ? "COMPLETED" : "NO_WINNER", "Closed by you");
  return ok(undefined);
}

// ── Clock: deadlines, sessions, simulated bids ──────────────────────────────

let started = false;
let tick = 0;
export function startSupplierClock() {
  if (started) return;
  started = true;
  window.setInterval(() => {
    const now = Date.now();
    tick += 1;
    state.auctions.forEach((auction) => {
      if (auction.status === "SCHEDULED" && now >= auction.startTime) set((current) => ({ ...current, auctions: current.auctions.map((item) => (item.code === auction.code ? { ...item, status: "ACTIVE", history: [...item.history, log("SYSTEM", "Opened")] } : item)) }));
      if (auction.status === "ACTIVE" && now >= auction.endTime) endAuction(auction.code, "Ended on time", "SYSTEM");
    });
    state.allocations.forEach((item) => item.status === "PENDING_CONFIRMATION" && now > item.deadline && answerAllocation(item.id, "EXPIRED"));
    state.matches.forEach((match) => {
      if (["PENDING_CONFIRMATION", "PARTIALLY_CONFIRMED"].includes(match.status) && now > match.deadline) {
        if (match.supplier === "PENDING" || match.buyerSide === "PENDING") {
          returnMatch(match);
          set((current) => ({ ...current, matches: current.matches.map((item) => (item.code === match.code ? { ...item, status: "EXPIRED" } : item)) }));
        }
      }
    });
    state.lots.forEach((lot) => {
      if (["PUBLISHED", "PARTIALLY_RESERVED"].includes(lot.status) && lot.availableUntil < todayIso() && lot.reserved === 0) set((current) => ({ ...current, lots: current.lots.map((item) => (item.code === lot.code ? { ...item, status: "EXPIRED" } : item)) }));
    });
    const slot = nextSlot(now - 11 * MINUTE);
    if (now >= slot.scheduled && !state.sessions.includes(slot.code)) runSupplierSession(slot);
    // Every ~45 s a simulated buyer bids on one of your open auctions (bids stay sealed to other buyers).
    if (tick % 45 === 0) {
      const auction = state.auctions.find((item) => item.status === "ACTIVE");
      if (auction) {
        const taken = new Set(state.bids.filter((bid) => bid.auctionCode === auction.code).map((bid) => bid.buyer));
        const buyer = BUYERS.find((name) => !taken.has(name));
        if (buyer) {
          const bid: BuyerBid = { code: nextId("BD"), auctionCode: auction.code, buyer, price: auction.startingPrice + 100 * ((tick / 45) % 15), quantity: Math.max(auction.minBid, Math.round(auction.quantity / 3 / 50) * 50), submittedAt: now, status: "SUBMITTED" };
          set((current) => ({ ...current, bids: [...current.bids, bid] }));
          notify("New bid", `${buyer} bid on ${auction.code}.`, `/producer/auctions/${auction.code}`);
        }
      }
    }
  }, 1000);
}

// ── What waits for the supplier ─────────────────────────────────────────────

export function pendingActions(data: SupplierData, now = Date.now()) {
  const matches = data.matches.filter((match) => match.supplier === "PENDING" && ["PENDING_CONFIRMATION", "PARTIALLY_CONFIRMED"].includes(match.status) && now <= match.deadline);
  const awards = data.proposals.filter((proposal) => proposal.award?.status === "PENDING_SUPPLIER_CONFIRMATION");
  const rounds = data.proposals.filter((proposal) => proposal.rounds.at(-1)?.by === "BUYER" && proposal.rounds.at(-1)?.status === "PENDING");
  const toAllocate = data.auctions.filter((auction) => auction.status === "ENDED" || (auction.status === "PENDING_CONFIRMATION" && !data.allocations.some((item) => item.auctionCode === auction.code && item.status === "PENDING_CONFIRMATION")));
  const drafts = data.lots.filter((lot) => lot.status === "DRAFT");
  const areas = data.areas.filter((area) => area.status === "NEEDS_ADDITIONAL_INFORMATION");
  const identity = data.profile.status === "NEEDS_ADDITIONAL_INFORMATION" || data.profile.status === "NOT_SUBMITTED";
  return { matches, awards, rounds, toAllocate, drafts, areas, identity, total: matches.length + awards.length + rounds.length + toAllocate.length };
}

export const upcomingSlot = (now = Date.now()) => nextSlot(now);
export const deadlineOf = (date: string) => endOfDay(date);
export const instant = vnInstant;
export const DAYS = DAY;
