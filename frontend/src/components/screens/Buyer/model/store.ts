// Buyer state and every transition the BRDs allow, in one place. Pages read with useBuyerStore and
// call the actions; an action that breaks a rule returns the errors instead of changing anything.
// The other parties (suppliers, coordinator, matching engine) are simulated here for the demo;
// a backend takes those over later, and the rules stay the same.
import { useSyncExternalStore } from "react";
import { RULES } from "@/lib/site";
import type { Notice } from "@/components/notifications/NotificationBell";
import type { DeliveryIssue } from "../../Producer/data/deliveries";
import { canDeliver, meetsGrade } from "./catalog";
import { runSession, groupKey, type EngineOrder } from "./engine";
import { endOfDay, formatDate, formatDateRange, HOUR, nextSlot, lockedSlot, slotsOn, todayIso, vnDate, type SessionSlot } from "./time";
import {
  validateBid,
  validateBuyOrder,
  validateDemand,
  validateNegotiation,
  validateProfile,
  validatePublish,
  type BidDraft,
  type BuyOrderDraft,
  type DemandDraft,
  type Errors,
  type PublishDraft,
} from "./validation";
import * as seed from "./seed";
import { addresses as seedAddresses, type DeliveryAddress } from "../data/mockBuyer";
import type {
  Actor,
  Auction,
  AuctionAllocation,
  AwardAllocation,
  Bid,
  BookOrder,
  BuyerProfile,
  BuyOrder,
  ClearingPrice,
  Demand,
  DocumentType,
  MatchingSession,
  MatchResult,
  Mechanism,
  Negotiation,
  OrderStatus,
  Proposal,
  SupplyLot,
  Transaction,
  VerificationStatus,
} from "./types";

export const SELF = seed.SELF;

/** Hours the other side has to confirm a result. The BRDs leave it open (Q-03); the admin rule applies. */
export const confirmHours = () => RULES.holdHours;

export type BuyerData = {
  profile: BuyerProfile;
  lots: SupplyLot[];
  demands: Demand[];
  proposals: Proposal[];
  awardAllocations: AwardAllocation[];
  auctions: Auction[];
  bids: Bid[];
  auctionAllocations: AuctionAllocation[];
  buyOrders: BuyOrder[];
  book: BookOrder[];
  sessions: MatchingSession[];
  prices: ClearingPrice[];
  matches: MatchResult[];
  transactions: Transaction[];
  notices: Notice[];
  deliveryIssues: Record<string, DeliveryIssue>;
  /** Saved delivery points, default first; picked when declaring where to receive goods. */
  addresses: DeliveryAddress[];
  seq: number;
};

let state: BuyerData = {
  profile: seed.seedProfile,
  lots: seed.seedLots,
  demands: seed.seedDemands,
  proposals: seed.seedProposals,
  awardAllocations: seed.seedAwardAllocations,
  auctions: seed.seedAuctions,
  bids: seed.seedBids,
  auctionAllocations: seed.seedAuctionAllocations,
  buyOrders: seed.seedBuyOrders,
  book: seed.seedBook,
  sessions: seed.seedSessions,
  prices: seed.seedPrices,
  matches: seed.seedMatches,
  transactions: seed.seedTransactions,
  notices: [],
  deliveryIssues: {},
  addresses: seedAddresses,
  seq: 100,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function set(update: (current: BuyerData) => BuyerData) {
  state = update(state);
  emit();
}

export function getBuyerData() {
  return state;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** The whole buyer state; a new object after every change, the same one otherwise. */
export function useBuyerData(): BuyerData {
  return useSyncExternalStore(subscribe, getBuyerData);
}

export type Result<T = undefined> = { ok: true; value: T } | { ok: false; errors: Errors };
const ok = <T,>(value: T): Result<T> => ({ ok: true, value });
const fail = (errors: Errors): Result<never> => ({ ok: false, errors });

/** Ids continue from a counter shared by all entities. */
function nextId(prefix: string) {
  state = { ...state, seq: state.seq + 1 };
  return `${prefix}-${state.seq + 4000}`;
}

const log = (by: Actor, action: string, note?: string) => ({ at: Date.now(), by, action, note });

function notify(notice: Omit<Notice, "id">) {
  set((current) => ({ ...current, notices: [{ ...notice, id: `N-${Date.now()}-${current.notices.length}` }, ...current.notices].slice(0, 30) }));
}

export function dismissNotice(id: string) {
  set((current) => ({ ...current, notices: current.notices.filter((item) => item.id !== id) }));
}

const later = (ms: number, run: () => void) => window.setTimeout(run, ms);

// ── B0-Buyer: the verification gate ────────────────────────────────────────

/** Every action that commits the buyer to a trade goes through this (BR-B0B-07, §6.3). */
export function verificationBlock(): Errors | null {
  const status = state.profile.status;
  if (status === "VERIFIED") return null;
  const why: Record<Exclude<VerificationStatus, "VERIFIED">, string> = {
    NOT_SUBMITTED: "Submit your business profile for verification first.",
    PENDING_VERIFICATION: "Your profile is waiting for review. Trading opens once it is verified.",
    UNDER_REVIEW: "Your profile is being reviewed. Trading opens once it is verified.",
    NEEDS_ADDITIONAL_INFORMATION: "Farmora asked for more information on your profile. Trading opens once it is verified.",
    REJECTED: "Your verification was rejected. Fix the profile and submit again.",
  };
  return { form: why[status], gate: "verification" };
}

const LEGAL_FIELDS: (keyof BuyerProfile)[] = [
  "businessName",
  "businessType",
  "registrationNumber",
  "taxCode",
  "country",
  "province",
  "ward",
  "streetAddress",
  "representativeName",
  "representativePosition",
  "representativeEmail",
  "representativePhone",
  "representativeType",
];

export function legalFieldsChanged(next: BuyerProfile, previous = state.profile) {
  return LEGAL_FIELDS.some((field) => next[field] !== previous[field]);
}

/** Saves the profile. Changing a legal field of a verified profile sends it back for review (FR-B0B-21). */
export function saveProfile(next: BuyerProfile): Result<{ reverify: boolean }> {
  const previous = state.profile;
  const reverify = previous.status === "VERIFIED" && legalFieldsChanged(next, previous);
  if (reverify) {
    const errors = validateProfile(next);
    if (Object.keys(errors).length) return fail(errors);
  }
  set((current) => ({
    ...current,
    profile: {
      ...next,
      status: reverify ? "PENDING_VERIFICATION" : previous.status,
      history: [...previous.history, log("BUYER", reverify ? "Legal details changed, sent for re-verification" : "Profile saved")],
    },
  }));
  if (reverify) simulateReview();
  return ok({ reverify });
}

export function addDocument(type: DocumentType, fileName: string) {
  set((current) => ({
    ...current,
    profile: { ...current.profile, documents: [...current.profile.documents, { id: `DOC-${Date.now()}`, type, fileName, uploadedAt: Date.now() }] },
  }));
}

export function removeDocument(id: string) {
  set((current) => ({ ...current, profile: { ...current.profile, documents: current.profile.documents.filter((doc) => doc.id !== id) } }));
}

/** B0B.2: submit for verification. */
export function submitProfile(profile: BuyerProfile): Result {
  if (!["NOT_SUBMITTED", "NEEDS_ADDITIONAL_INFORMATION", "REJECTED"].includes(state.profile.status))
    return fail({ form: "This profile is already submitted." });
  const errors = validateProfile(profile);
  if (Object.keys(errors).length) return fail(errors);
  set((current) => ({
    ...current,
    profile: { ...profile, status: "PENDING_VERIFICATION", reviewNote: undefined, history: [...current.profile.history, log("BUYER", "Submitted for verification")] },
  }));
  simulateReview();
  return ok(undefined);
}

function setVerification(status: VerificationStatus, action: string, note?: string) {
  set((current) => ({
    ...current,
    profile: {
      ...current.profile,
      status,
      verifiedAt: status === "VERIFIED" ? Date.now() : current.profile.verifiedAt,
      reviewNote: status === "NEEDS_ADDITIONAL_INFORMATION" || status === "REJECTED" ? note : undefined,
      history: [...current.profile.history, log("COORDINATOR", action, note)],
    },
  }));
}

/** Demo: a coordinator picks the profile up, checks the business, then the representative (B0B.3–B0B.4). */
function simulateReview() {
  later(4000, () => {
    if (state.profile.status !== "PENDING_VERIFICATION") return;
    setVerification("UNDER_REVIEW", "Review started");
  });
  later(9000, () => {
    if (state.profile.status !== "UNDER_REVIEW") return;
    setVerification("VERIFIED", "Business and representative verified");
    notify({ tone: "info", title: "Your business is verified", detail: "You can now publish demands, bid, place buy orders and confirm results.", link: { label: "Open profile", to: "/buyer/company" } });
  });
}

/** Demo only: put the profile in any verification state to see what is blocked. */
export function demoSetVerification(status: VerificationStatus) {
  const notes: Partial<Record<VerificationStatus, string>> = {
    NEEDS_ADDITIONAL_INFORMATION: "The authorisation letter is not signed by the legal representative. Upload a signed copy.",
    REJECTED: "The registration number does not match the business name in the national registry.",
  };
  setVerification(status, `Demo: set to ${status}`, notes[status]);
}

// ── Supply lot counter (FR-B3-03 → 05) ─────────────────────────────────────

function lotStatus(lot: SupplyLot): SupplyLot["status"] {
  if (lot.status === "EXPIRED") return lot.status;
  if (lot.available <= 0) return "FULLY_RESERVED";
  return lot.available < lot.quantity ? "PARTIALLY_RESERVED" : "PUBLISHED";
}

function changeLot(lots: SupplyLot[], code: string, delta: number) {
  return lots.map((lot) => {
    if (lot.code !== code) return lot;
    const next = { ...lot, available: Math.max(0, Math.min(lot.quantity, lot.available + delta)) };
    return { ...next, status: lotStatus(next) };
  });
}

export const tradable = (lot?: SupplyLot) => !!lot && (lot.status === "PUBLISHED" || lot.status === "PARTIALLY_RESERVED");

function createTransaction(input: Omit<Transaction, "code" | "status" | "createdAt" | "unit" | "total">) {
  const code = nextId("TX");
  const transaction: Transaction = { ...input, code, unit: "kg", total: input.quantity * input.price, status: "CONFIRMED", createdAt: Date.now() };
  set((current) => ({ ...current, transactions: [transaction, ...current.transactions] }));
  notify({
    tone: "info",
    title: `Transaction ${code} created`,
    detail: `${input.quantity.toLocaleString("en-GB")} kg ${input.crop.toLowerCase()} from ${input.supplier}. Next: term sheet.`,
    link: { label: "Open transaction", to: `/buyer/transactions/${code}` },
  });
  return code;
}

// ── B3.1 Buyer-led procurement ─────────────────────────────────────────────

/** B3.1.1: create or edit a demand while it is a draft. Drafts need no verification (A-03). */
export function saveDemand(draft: DemandDraft, code?: string): Result<string> {
  const errors = validateDemand(draft);
  if (Object.keys(errors).length) return fail(errors);
  if (code) {
    const existing = state.demands.find((item) => item.code === code);
    if (!existing || existing.status !== "DRAFT") return fail({ form: "Only a draft can be edited." });
    set((current) => ({
      ...current,
      demands: current.demands.map((item) => (item.code === code ? { ...item, ...draft, criteria: item.criteria, history: [...item.history, log("BUYER", "Draft edited")] } : item)),
    }));
    return ok(code);
  }
  const newCode = nextId("DM");
  const demand: Demand = { ...draft, code: newCode, criteria: [], status: "DRAFT", createdAt: Date.now(), history: [log("BUYER", "Draft created")] };
  set((current) => ({ ...current, demands: [demand, ...current.demands] }));
  return ok(newCode);
}

/** B3.1.2: publish. Quantity, quality and criteria are frozen from here (FR-B3.1-07). */
export function publishDemand(code: string, draft: PublishDraft): Result {
  const blocked = verificationBlock();
  if (blocked) return fail(blocked);
  const demand = state.demands.find((item) => item.code === code);
  if (!demand || demand.status !== "DRAFT") return fail({ form: "Only a draft can be published." });
  const errors = validatePublish(demand, draft, Date.now());
  if (Object.keys(errors).length) return fail(errors);
  set((current) => ({
    ...current,
    demands: current.demands.map((item) =>
      item.code === code ? { ...item, ...draft, status: "PUBLISHED", publishedAt: Date.now(), history: [...item.history, log("BUYER", "Published")] } : item,
    ),
  }));
  simulateProposals(code);
  return ok(undefined);
}

/** Demo: suppliers in scope with a fitting lot send a proposal a few seconds after publishing. */
function simulateProposals(code: string) {
  const demand = state.demands.find((item) => item.code === code)!;
  const reference = latestPrice(demand.crop, demand.qualityStandard ?? "C") ?? 30_000;
  const fitting = state.lots.filter(
    (lot) =>
      tradable(lot) &&
      lot.crop === demand.crop &&
      (!demand.variety || lot.variety === demand.variety) &&
      (demand.scope?.kind !== "REGIONS" || demand.scope.regions.some((region) => lot.region.includes(region))) &&
      demand.requiredCertifications.every((cert) => lot.certifications.includes(cert)),
  );
  const seen = new Set<string>();
  fitting
    .filter((lot) => (seen.has(lot.supplier) ? false : (seen.add(lot.supplier), true)))
    .slice(0, 3)
    .forEach((lot, index) => {
      later(6000 + index * 5000, () => {
        const current = state.demands.find((item) => item.code === code);
        if (current?.status !== "PUBLISHED") return;
        const quantity = Math.min(lot.available, demand.quantity);
        if (quantity <= 0) return;
        const price = Math.round((reference * (lot.grade === "A" ? 1.04 : lot.grade === "B" ? 0.97 : 0.9) + index * 300) / 100) * 100;
        const proposal: Proposal = {
          code: nextId("PR"),
          demandCode: code,
          supplier: lot.supplier,
          lotCode: lot.code,
          quantity,
          unitPrice: price,
          qualityDescription: `Grade ${lot.grade}, ${lot.variety}${lot.certifications.length ? `, ${lot.certifications.join(" + ")}` : ""}`,
          qualityEvidence: lot.qualityEvidence,
          deliveryDate: demand.deliveryFrom,
          deliveryLocation: demand.deliveryLocation,
          deliveryMethod: "Refrigerated truck, supplier arranges",
          evidence: lot.certifications.map((cert) => ({ type: "Certificate", name: `${cert}-${lot.code}.pdf` })),
          status: "SUBMITTED",
          submittedAt: Date.now(),
          negotiations: [],
          agreed: { price, quantity },
        };
        set((data) => ({ ...data, proposals: [...data.proposals, proposal] }));
        notify({ tone: "info", title: `New proposal for ${code}`, detail: `${lot.supplier}: ${quantity.toLocaleString("en-GB")} kg. You can compare proposals once submissions close.`, link: { label: "Open demand", to: `/buyer/demands/${code}` } });
      });
    });
}

const proposalsOf = (code: string, data = state) => data.proposals.filter((item) => item.demandCode === code);

/** B3.1.4: close at the deadline, or early with a reason. */
function closeSubmissions(code: string, by: Actor, reason?: string) {
  const live = proposalsOf(code).filter((item) => item.status === "SUBMITTED").length;
  set((current) => ({
    ...current,
    demands: current.demands.map((item) =>
      item.code === code
        ? {
            ...item,
            status: live > 0 ? "CLOSED" : "NO_PROPOSAL",
            closedAt: Date.now(),
            closeReason: reason,
            history: [...item.history, log(by, by === "SYSTEM" ? "Closed at the submission deadline" : "Closed early", reason ?? `${live} proposal${live === 1 ? "" : "s"} received`)],
          }
        : item,
    ),
  }));
  notify({
    tone: live > 0 ? "warning" : "info",
    title: live > 0 ? `${code} closed: ${live} proposal${live === 1 ? "" : "s"} to evaluate` : `${code} closed without proposals`,
    detail: live > 0 ? "Compare the proposals and choose suppliers." : "Re-publish it as a new demand, or try order matching.",
    link: { label: "Open demand", to: `/buyer/demands/${code}` },
  });
}

export function closeDemandEarly(code: string, reason: string): Result {
  if (!reason.trim()) return fail({ reason: "Give a reason for closing early." });
  const demand = state.demands.find((item) => item.code === code);
  if (demand?.status !== "PUBLISHED") return fail({ form: "Only a demand receiving proposals can be closed." });
  closeSubmissions(code, "BUYER", reason.trim());
  return ok(undefined);
}

/** FR-B3.1-21 (Could): reopen a closed demand with a new deadline. */
export function reopenDemand(code: string, deadline: number, reason: string): Result {
  const blocked = verificationBlock();
  if (blocked) return fail(blocked);
  const demand = state.demands.find((item) => item.code === code);
  if (demand?.status !== "CLOSED") return fail({ form: "Only a closed demand that is not awarded can be reopened." });
  const errors: Errors = {};
  if (!reason.trim()) errors.reason = "Give a reason for reopening.";
  if (!(deadline > Date.now())) errors.deadline = "The new deadline must be in the future.";
  else if (deadline >= Date.parse(`${demand.deliveryFrom}T00:00:00+07:00`)) errors.deadline = "The deadline must be before the delivery window.";
  if (Object.keys(errors).length) return fail(errors);
  set((current) => ({
    ...current,
    demands: current.demands.map((item) =>
      item.code === code ? { ...item, status: "PUBLISHED", submissionDeadline: deadline, closedAt: undefined, history: [...item.history, log("BUYER", "Reopened", reason.trim())] } : item,
    ),
  }));
  return ok(undefined);
}

/** FR-B3.1-08: cancel before AWARDED, with a reason; every proposal becomes NOT_SELECTED. */
export function cancelDemand(code: string, reason: string): Result {
  if (!reason.trim()) return fail({ reason: "Give a reason for cancelling." });
  const demand = state.demands.find((item) => item.code === code);
  if (!demand || ["AWARDED", "CANCELLED", "NO_PROPOSAL"].includes(demand.status)) return fail({ form: "This demand can no longer be cancelled." });
  set((current) => ({
    ...current,
    demands: current.demands.map((item) => (item.code === code ? { ...item, status: "CANCELLED", cancelReason: reason.trim(), history: [...item.history, log("BUYER", "Cancelled", reason.trim())] } : item)),
    proposals: current.proposals.map((item) => (item.demandCode === code && ["SUBMITTED", "UNDER_REVIEW"].includes(item.status) ? { ...item, status: "NOT_SELECTED" } : item)),
  }));
  return ok(undefined);
}

/** Why a proposal can no longer be chosen, if its lot changed (B3.1-VAL10, VAL12). */
function invalidReason(proposal: Proposal, data = state) {
  const lot = data.lots.find((item) => item.code === proposal.lotCode);
  if (!tradable(lot)) return "The supply lot is no longer open for trading.";
  if (lot!.available < proposal.agreed.quantity) return `The lot has only ${lot!.available.toLocaleString("en-GB")} kg available now.`;
  return undefined;
}

/** B3.1.5 step 1–2: open the evaluation and re-check every proposal. */
export function startEvaluation(code: string): Result {
  const demand = state.demands.find((item) => item.code === code);
  if (demand?.status !== "CLOSED") return fail({ form: "Evaluation starts on a closed demand." });
  set((current) => ({
    ...current,
    demands: current.demands.map((item) => (item.code === code ? { ...item, status: "UNDER_EVALUATION", history: [...item.history, log("BUYER", "Evaluation started")] } : item)),
    proposals: current.proposals.map((item) => {
      if (item.demandCode !== code || item.status !== "SUBMITTED") return item;
      const reason = invalidReason(item, current);
      return reason ? { ...item, status: "INVALID", invalidReason: reason } : { ...item, status: "UNDER_REVIEW" };
    }),
  }));
  return ok(undefined);
}

const pendingRound = (proposal: Proposal) => proposal.negotiations.find((round) => round.status === "PENDING");

function updateProposal(code: string, change: (proposal: Proposal) => Proposal) {
  set((current) => ({ ...current, proposals: current.proposals.map((item) => (item.code === code ? change(item) : item)) }));
}

/** B3.1.6: the buyer proposes new terms on a proposal under review. */
export function proposeTerms(proposalCode: string, input: { price?: number; quantity?: number; terms?: string; note?: string }): Result {
  const blocked = verificationBlock();
  if (blocked) return fail(blocked);
  const proposal = state.proposals.find((item) => item.code === proposalCode);
  if (!proposal || proposal.status !== "UNDER_REVIEW") return fail({ form: "Only a proposal under review can be negotiated." });
  if (pendingRound(proposal)) return fail({ form: "Wait for the answer to the open round, or withdraw it." });
  const lot = state.lots.find((item) => item.code === proposal.lotCode);
  const errors = validateNegotiation(input, lot?.available ?? 0);
  if (Object.keys(errors).length) return fail(errors);
  const round: Negotiation = { round: proposal.negotiations.length + 1, by: "BUYER", ...input, status: "PENDING", at: Date.now() };
  updateProposal(proposalCode, (item) => ({ ...item, negotiations: [...item.negotiations, round] }));
  simulateSupplierReply(proposalCode, round.round);
  return ok(undefined);
}

/** Demo: the supplier accepts a small cut, counters a bigger one halfway, rejects a large one. */
function simulateSupplierReply(proposalCode: string, roundNumber: number) {
  later(5000, () => {
    const proposal = state.proposals.find((item) => item.code === proposalCode);
    const round = proposal?.negotiations.find((item) => item.round === roundNumber);
    if (!proposal || round?.status !== "PENDING") return;
    const asked = round.price ?? proposal.agreed.price;
    const cut = (proposal.agreed.price - asked) / proposal.agreed.price;
    const now = Date.now();
    const closeRound = (status: Negotiation["status"]) => proposal.negotiations.map((item) => (item.round === roundNumber ? { ...item, status, respondedAt: now } : item));
    if (cut <= 0.03) {
      updateProposal(proposalCode, (item) => ({
        ...item,
        negotiations: closeRound("ACCEPTED"),
        agreed: { price: asked, quantity: round.quantity ?? item.agreed.quantity, terms: round.terms ?? item.agreed.terms },
      }));
      notify({ tone: "info", title: `${proposal.supplier} accepted your terms`, detail: `${proposalCode}: ${asked.toLocaleString("en-GB")} VND/kg is now the agreed price.`, link: { label: "Open demand", to: `/buyer/demands/${proposal.demandCode}` } });
    } else if (cut <= 0.08) {
      const counter = Math.round((proposal.agreed.price + asked) / 2 / 100) * 100;
      updateProposal(proposalCode, (item) => ({
        ...item,
        negotiations: [...closeRound("COUNTERED"), { round: roundNumber + 1, by: "SUPPLIER", price: counter, quantity: round.quantity, terms: round.terms, note: `We can do ${counter.toLocaleString("en-GB")}.`, status: "PENDING", at: now }],
      }));
      notify({ tone: "warning", title: `${proposal.supplier} countered`, detail: `${proposalCode}: ${counter.toLocaleString("en-GB")} VND/kg. Accept, reject or counter.`, link: { label: "Answer", to: `/buyer/demands/${proposal.demandCode}` } });
    } else {
      updateProposal(proposalCode, (item) => ({ ...item, negotiations: closeRound("REJECTED") }));
      notify({ tone: "warning", title: `${proposal.supplier} rejected your terms`, detail: `${proposalCode} keeps its original terms.`, link: { label: "Open demand", to: `/buyer/demands/${proposal.demandCode}` } });
    }
  });
}

/** The buyer answers a supplier's counter. */
export function answerCounter(proposalCode: string, answer: "ACCEPT" | "REJECT"): Result {
  const blocked = verificationBlock();
  if (blocked) return fail(blocked);
  const proposal = state.proposals.find((item) => item.code === proposalCode);
  const round = proposal && pendingRound(proposal);
  if (!proposal || !round || round.by !== "SUPPLIER") return fail({ form: "There is no counter to answer." });
  updateProposal(proposalCode, (item) => ({
    ...item,
    negotiations: item.negotiations.map((entry) => (entry.round === round.round ? { ...entry, status: answer === "ACCEPT" ? "ACCEPTED" : "REJECTED", respondedAt: Date.now() } : entry)),
    agreed: answer === "ACCEPT" ? { price: round.price ?? item.agreed.price, quantity: round.quantity ?? item.agreed.quantity, terms: round.terms ?? item.agreed.terms } : item.agreed,
  }));
  return ok(undefined);
}

/** A counter from the buyer closes the supplier's round as COUNTERED and opens a new one. */
export function counterSupplier(proposalCode: string, input: { price?: number; quantity?: number; terms?: string; note?: string }): Result {
  const proposal = state.proposals.find((item) => item.code === proposalCode);
  const round = proposal && pendingRound(proposal);
  if (!proposal || !round || round.by !== "SUPPLIER") return fail({ form: "There is no counter to answer." });
  const lot = state.lots.find((item) => item.code === proposal.lotCode);
  const errors = validateNegotiation(input, lot?.available ?? 0);
  if (Object.keys(errors).length) return fail(errors);
  updateProposal(proposalCode, (item) => ({
    ...item,
    negotiations: item.negotiations.map((entry) => (entry.round === round.round ? { ...entry, status: "COUNTERED", respondedAt: Date.now() } : entry)),
  }));
  return proposeTerms(proposalCode, input);
}

export function withdrawTerms(proposalCode: string) {
  const proposal = state.proposals.find((item) => item.code === proposalCode);
  const round = proposal && pendingRound(proposal);
  if (!round || round.by !== "BUYER") return;
  updateProposal(proposalCode, (item) => ({
    ...item,
    negotiations: item.negotiations.map((entry) => (entry.round === round.round ? { ...entry, status: "WITHDRAWN", respondedAt: Date.now() } : entry)),
  }));
}

/**
 * B3.1.6 steps 5–8: confirm the award. Checks VAL17–19, then reserves every lot at once or none
 * (NFR-B3.1-03). Also used to add proposals after a supplier declined (FR-B3.1-35).
 */
export function confirmAward(demandCode: string, proposalCodes: string[]): Result {
  const blocked = verificationBlock();
  if (blocked) return fail(blocked);
  const demand = state.demands.find((item) => item.code === demandCode);
  const adding = demand?.status === "AWARDED";
  if (!demand || (demand.status !== "UNDER_EVALUATION" && !adding)) return fail({ form: "Suppliers are chosen during evaluation." });
  if (proposalCodes.length === 0) return fail({ form: "Select at least one proposal." });

  const chosen = proposalCodes.map((code) => state.proposals.find((item) => item.code === code)!);
  const errors: Errors = {};
  for (const proposal of chosen) {
    const allowed = adding ? proposal.status === "NOT_SELECTED" : proposal.status === "UNDER_REVIEW";
    if (!allowed) errors[proposal.code] = "This proposal can no longer be selected.";
    else if (pendingRound(proposal)) errors[proposal.code] = "A negotiation round is still open on this proposal.";
    else {
      const reason = invalidReason(proposal);
      if (reason) errors[proposal.code] = reason;
    }
  }
  if (Object.keys(errors).length) return fail({ ...errors, form: "Some selected proposals cannot be awarded. Unselect them or renegotiate the quantity." });

  const now = Date.now();
  const deadline = now + confirmHours() * HOUR;
  const allocations: AwardAllocation[] = chosen.map((proposal) => ({
    id: nextId("AA"),
    demandCode,
    proposalCode: proposal.code,
    supplier: proposal.supplier,
    lotCode: proposal.lotCode,
    quantity: proposal.agreed.quantity,
    price: proposal.agreed.price,
    terms: proposal.agreed.terms,
    negotiated: proposal.negotiations.some((round) => round.status === "ACCEPTED"),
    status: "PENDING_SUPPLIER_CONFIRMATION",
    createdAt: now,
    deadline,
  }));
  const total = allocations.reduce((sum, item) => sum + item.quantity, 0);
  set((current) => {
    let lots = current.lots;
    for (const allocation of allocations) lots = changeLot(lots, allocation.lotCode, -allocation.quantity);
    return {
      ...current,
      lots,
      awardAllocations: [...current.awardAllocations, ...allocations],
      proposals: current.proposals.map((item) => {
        if (item.demandCode !== demandCode) return item;
        if (proposalCodes.includes(item.code)) return { ...item, status: "SELECTED" };
        return item.status === "UNDER_REVIEW" ? { ...item, status: "NOT_SELECTED" } : item;
      }),
      demands: current.demands.map((item) =>
        item.code === demandCode
          ? { ...item, status: "AWARDED", history: [...item.history, log("BUYER", adding ? "Proposals added to the award" : "Award confirmed", `${allocations.length} proposal${allocations.length === 1 ? "" : "s"}, ${total.toLocaleString("en-GB")} kg`)] }
          : item,
      ),
    };
  });
  allocations.forEach((allocation, index) => simulateSupplierConfirmation(allocation.id, index));
  return ok(undefined);
}

/** Demo: suppliers confirm the award; Green Hills Farm declines, to show the replacement path. */
function simulateSupplierConfirmation(allocationId: string, index: number) {
  later(6000 + index * 3000, () => {
    const allocation = state.awardAllocations.find((item) => item.id === allocationId);
    if (allocation?.status !== "PENDING_SUPPLIER_CONFIRMATION") return;
    respondToAward(allocationId, allocation.supplier === "Green Hills Farm" ? "DECLINE" : "CONFIRM", "The lot was damaged by rain; we can no longer supply it.");
  });
}

function respondToAward(allocationId: string, answer: "CONFIRM" | "DECLINE", reason?: string) {
  const allocation = state.awardAllocations.find((item) => item.id === allocationId)!;
  const now = Date.now();
  set((current) => ({
    ...current,
    lots: answer === "DECLINE" ? changeLot(current.lots, allocation.lotCode, allocation.quantity) : current.lots,
    awardAllocations: current.awardAllocations.map((item) =>
      item.id === allocationId ? { ...item, status: answer === "CONFIRM" ? "CONFIRMED" : "DECLINED", respondedAt: now, declineReason: answer === "DECLINE" ? reason : undefined } : item,
    ),
  }));
  if (answer === "CONFIRM") {
    const proposal = state.proposals.find((item) => item.code === allocation.proposalCode)!;
    const lot = state.lots.find((item) => item.code === allocation.lotCode)!;
    const demand = state.demands.find((item) => item.code === allocation.demandCode)!;
    createTransaction({
      mechanism: "BUYER_LED_PROCUREMENT",
      sourceRef: allocation.id,
      sourceParent: allocation.demandCode,
      supplier: allocation.supplier,
      lotCode: allocation.lotCode,
      crop: lot.crop,
      variety: lot.variety,
      quantity: allocation.quantity,
      price: allocation.price,
      qualityTerms: proposal.qualityDescription,
      deliveryTerms: `${proposal.deliveryMethod}; to ${demand.deliveryLocation} on ${formatDate(proposal.deliveryDate)}`,
      additionalTerms: allocation.terms,
      buyerConfirmedAt: allocation.createdAt,
      supplierConfirmedAt: now,
    });
  } else {
    notify({ tone: "urgent", title: `${allocation.supplier} declined the award`, detail: `${allocation.quantity.toLocaleString("en-GB")} kg released. You can add another proposal to ${allocation.demandCode}.`, link: { label: "Choose another", to: `/buyer/demands/${allocation.demandCode}` } });
  }
}

// ── B3.2 Supplier-led auction ──────────────────────────────────────────────

const myBid = (auctionCode: string, data = state) => data.bids.find((bid) => bid.auctionCode === auctionCode && bid.status !== "WITHDRAWN");

/** B3.2.3: one live bid per buyer; a second submit updates it (B3.2.3-E3). */
export function submitBid(auctionCode: string, draft: BidDraft): Result {
  const blocked = verificationBlock();
  if (blocked) return fail(blocked);
  const auction = state.auctions.find((item) => item.code === auctionCode);
  if (!auction) return fail({ form: "Auction not found." });
  const errors = validateBid(auction, draft, Date.now());
  if (Object.keys(errors).length) return fail(errors);
  const existing = myBid(auctionCode);
  const note = `${draft.price.toLocaleString("en-GB")} VND/kg × ${draft.quantity.toLocaleString("en-GB")} kg`;
  if (existing && existing.status === "SUBMITTED") {
    set((current) => ({
      ...current,
      bids: current.bids.map((bid) => (bid.code === existing.code ? { ...bid, ...draft, submittedAt: Date.now(), history: [...bid.history, log("BUYER", "Bid updated", note)] } : bid)),
    }));
  } else {
    const bid: Bid = { code: nextId("BID"), auctionCode, ...draft, status: "SUBMITTED", submittedAt: Date.now(), history: [log("BUYER", "Bid submitted", note)] };
    set((current) => ({ ...current, bids: [...current.bids, bid] }));
  }
  return ok(undefined);
}

export function withdrawBid(auctionCode: string): Result {
  const blocked = verificationBlock();
  if (blocked) return fail(blocked);
  const auction = state.auctions.find((item) => item.code === auctionCode);
  const bid = myBid(auctionCode);
  if (auction?.status !== "ACTIVE" || bid?.status !== "SUBMITTED") return fail({ form: "Bids can only be withdrawn while the auction is open." });
  set((current) => ({ ...current, bids: current.bids.map((item) => (item.code === bid.code ? { ...item, status: "WITHDRAWN", history: [...item.history, log("BUYER", "Bid withdrawn")] } : item)) }));
  return ok(undefined);
}

/** B3.2.5: the buyer confirms or declines what the supplier allocated. Price and quantity are fixed. */
export function answerAuctionAllocation(id: string, answer: "CONFIRM" | "DECLINE", reason?: string): Result {
  const blocked = verificationBlock();
  if (blocked) return fail(blocked);
  const allocation = state.auctionAllocations.find((item) => item.id === id);
  if (allocation?.status !== "PENDING_CONFIRMATION" || Date.now() > allocation.deadline) return fail({ form: "This result can no longer be answered." });
  if (answer === "DECLINE" && !reason?.trim()) return fail({ reason: "Tell the supplier why you decline." });
  const auction = state.auctions.find((item) => item.code === allocation.auctionCode)!;
  const now = Date.now();
  set((current) => ({
    ...current,
    lots: answer === "DECLINE" ? changeLot(current.lots, auction.lotCode, allocation.quantity) : current.lots,
    auctionAllocations: current.auctionAllocations.map((item) =>
      item.id === id ? { ...item, status: answer === "CONFIRM" ? "CONFIRMED" : "RELEASED", respondedAt: now, declineReason: reason?.trim() } : item,
    ),
    bids: current.bids.map((bid) =>
      bid.code === allocation.bidCode ? { ...bid, status: answer === "CONFIRM" ? "CONFIRMED" : "DECLINED", history: [...bid.history, log("BUYER", answer === "CONFIRM" ? "Result confirmed" : "Result declined", reason?.trim())] } : bid,
    ),
    auctions: current.auctions.map((item) => (item.code === auction.code ? { ...item, status: answer === "CONFIRM" ? "COMPLETED" : "NO_WINNER" } : item)),
  }));
  if (answer === "CONFIRM") {
    const lot = state.lots.find((item) => item.code === auction.lotCode)!;
    createTransaction({
      mechanism: "SUPPLIER_LED_AUCTION",
      sourceRef: id,
      sourceParent: auction.code,
      supplier: auction.supplier,
      lotCode: auction.lotCode,
      crop: auction.crop,
      variety: auction.variety,
      quantity: allocation.quantity,
      price: allocation.acceptedPrice,
      qualityTerms: `Grade ${auction.grade}, ${lot.qualityEvidence === "DOCUMENT_VERIFIED" ? "document-verified" : "self-declared"}`,
      deliveryTerms: [auction.deliveryLocation, auction.deliveryTerms].filter(Boolean).join("; "),
      additionalTerms: auction.additionalConditions,
      buyerConfirmedAt: now,
      supplierConfirmedAt: allocation.createdAt,
    });
  }
  return ok(undefined);
}

/** Demo: when an auction this buyer bid on ends, the supplier picks bids a few seconds later. */
function simulateSupplierSelection(auctionCode: string) {
  later(7000, () => {
    const auction = state.auctions.find((item) => item.code === auctionCode);
    const bid = myBid(auctionCode);
    if (auction?.status !== "ENDED") return;
    if (!bid || bid.status !== "SUBMITTED") {
      set((current) => ({ ...current, auctions: current.auctions.map((item) => (item.code === auctionCode ? { ...item, status: "COMPLETED" } : item)) }));
      return;
    }
    const chosen = bid.price >= auction.startingPrice * 1.04;
    const now = Date.now();
    if (!chosen) {
      set((current) => ({
        ...current,
        bids: current.bids.map((item) => (item.code === bid.code ? { ...item, status: "REJECTED", history: [...item.history, log("SUPPLIER", "Not selected")] } : item)),
        auctions: current.auctions.map((item) => (item.code === auctionCode ? { ...item, status: "COMPLETED" } : item)),
      }));
      notify({ tone: "info", title: `Your bid on ${auctionCode} was not selected`, detail: `${auction.supplier} chose other bids.`, link: { label: "Open auction", to: `/buyer/auctions/${auctionCode}` } });
      return;
    }
    const quantity = Math.min(bid.quantity, auction.quantity);
    const allocation: AuctionAllocation = { id: nextId("AL"), auctionCode, bidCode: bid.code, quantity, acceptedPrice: bid.price, deadline: now + confirmHours() * HOUR, status: "PENDING_CONFIRMATION", createdAt: now };
    set((current) => ({
      ...current,
      auctionAllocations: [...current.auctionAllocations, allocation],
      bids: current.bids.map((item) => (item.code === bid.code ? { ...item, status: "ACCEPTED", history: [...item.history, log("SUPPLIER", "Bid selected", `${quantity.toLocaleString("en-GB")} kg allocated`)] } : item)),
      auctions: current.auctions.map((item) => (item.code === auctionCode ? { ...item, status: "PENDING_CONFIRMATION" } : item)),
    }));
    notify({ tone: "urgent", title: `You won ${auctionCode}: confirm within ${confirmHours()} h`, detail: `${quantity.toLocaleString("en-GB")} kg at ${bid.price.toLocaleString("en-GB")} VND/kg from ${auction.supplier}.`, link: { label: "Confirm result", to: `/buyer/auctions/${auctionCode}` } });
  });
}

// ── B3.3 Order matching ────────────────────────────────────────────────────

const recomputeStatus = (order: BuyOrder): OrderStatus =>
  order.status === "CANCELLED" || order.status === "EXPIRED" ? order.status : order.remaining <= 0 ? "FILLED" : order.remaining < order.requested ? "PARTIALLY_FILLED" : "OPEN";

const orderIsLive = (order: BuyOrder) => order.status === "OPEN" || order.status === "PARTIALLY_FILLED";

/** A buy order is locked from its session's cut-off until the session ran (FR-B3.3-17). */
export function orderLocked(order: BuyOrder, now = Date.now()) {
  const slot = lockedSlot(now);
  return !!slot && orderIsLive(order) && order.priorityTime < slot.cutoff && !state.sessions.some((session) => session.code === slot.code);
}

/** The next session that has not run yet: the one a new order joins (B3.3.1 step 9). */
export function upcomingSlot(now = Date.now(), data = state): SessionSlot {
  let slot = nextSlot(now);
  const locked = lockedSlot(now);
  if (locked && !data.sessions.some((session) => session.code === locked.code)) return locked;
  while (data.sessions.some((session) => session.code === slot.code)) slot = nextSlot(slot.cutoff + 1);
  return slot;
}

export function placeBuyOrder(draft: BuyOrderDraft): Result<string> {
  const blocked = verificationBlock();
  if (blocked) return fail(blocked);
  const errors = validateBuyOrder(draft);
  if (Object.keys(errors).length) return fail(errors);
  const now = Date.now();
  const code = nextId("BO");
  const order: BuyOrder = { ...draft, code, remaining: draft.requested, priorityTime: now, status: "OPEN", createdAt: now, history: [log("BUYER", "CREATED", `${draft.requested.toLocaleString("en-GB")} kg, max ${draft.maxPrice.toLocaleString("en-GB")} VND/kg`)] };
  set((current) => ({ ...current, buyOrders: [order, ...current.buyOrders] }));
  return ok(code);
}

/** Price change or larger quantity resets time priority; anything else keeps it (A-05). */
export function updateBuyOrder(code: string, draft: BuyOrderDraft): Result {
  const blocked = verificationBlock();
  if (blocked) return fail(blocked);
  const order = state.buyOrders.find((item) => item.code === code);
  if (!order || !orderIsLive(order)) return fail({ form: "Only an open or partly filled order can be changed." });
  if (orderLocked(order)) return fail({ form: "The order is locked for the running session. Try again after it has matched." });
  const filled = order.requested - order.remaining;
  const errors = validateBuyOrder(draft, filled);
  if (Object.keys(errors).length) return fail(errors);
  const resetPriority = draft.maxPrice !== order.maxPrice || draft.requested > order.requested;
  set((current) => ({
    ...current,
    buyOrders: current.buyOrders.map((item) => {
      if (item.code !== code) return item;
      const next: BuyOrder = {
        ...item,
        ...draft,
        remaining: draft.requested - filled,
        priorityTime: resetPriority ? Date.now() : item.priorityTime,
        history: [...item.history, log("BUYER", "UPDATED", resetPriority ? "Price or quantity raised: time priority reset" : "Time priority kept")],
      };
      return { ...next, status: recomputeStatus(next) };
    }),
  }));
  return ok(undefined);
}

/** Cancels what is not yet matched; pending match results are not affected. */
export function cancelBuyOrder(code: string): Result {
  const blocked = verificationBlock();
  if (blocked) return fail(blocked);
  const order = state.buyOrders.find((item) => item.code === code);
  if (!order || !orderIsLive(order)) return fail({ form: "Only an open or partly filled order can be cancelled." });
  if (orderLocked(order)) return fail({ form: "The order is locked for the running session. Try again after it has matched." });
  set((current) => ({
    ...current,
    buyOrders: current.buyOrders.map((item) => (item.code === code ? { ...item, status: "CANCELLED", history: [...item.history, log("BUYER", "CANCELLED", `${item.remaining.toLocaleString("en-GB")} kg not matched were cancelled`)] } : item)),
  }));
  return ok(undefined);
}

function finishMatch(code: string) {
  const match = state.matches.find((item) => item.code === code)!;
  if (match.buyer !== "CONFIRMED" || match.supplierSide !== "CONFIRMED") return;
  const now = Date.now();
  set((current) => ({ ...current, matches: current.matches.map((item) => (item.code === code ? { ...item, status: "CONFIRMED", confirmedAt: now } : item)) }));
  const order = state.buyOrders.find((item) => item.code === match.buyOrderCode)!;
  const lot = state.lots.find((item) => item.code === match.lotCode);
  createTransaction({
    mechanism: "ORDER_MATCHING",
    sourceRef: code,
    sourceParent: match.buyOrderCode,
    supplier: match.supplier,
    lotCode: match.lotCode,
    crop: match.crop,
    variety: match.variety,
    quantity: match.quantity,
    price: match.clearingPrice,
    qualityTerms: `Grade ${match.grade}${lot ? `, ${lot.qualityEvidence === "DOCUMENT_VERIFIED" ? "document-verified" : "self-declared"}` : ""}`,
    deliveryTerms: `To ${order.deliveryLocation}, ${formatDateRange(order.deliveryStart, order.deliveryEnd)}${order.deliveryConditions ? `; ${order.deliveryConditions}` : ""}`,
    additionalTerms: order.additionalConditions,
    buyerConfirmedAt: now,
    supplierConfirmedAt: now,
  });
}

/** B3.3.5: each side confirms on its own; the transaction exists only when both have. */
export function confirmMatch(code: string): Result {
  const blocked = verificationBlock();
  if (blocked) return fail(blocked);
  const match = state.matches.find((item) => item.code === code);
  if (!match || !["PENDING_CONFIRMATION", "PARTIALLY_CONFIRMED"].includes(match.status) || match.buyer !== "PENDING") return fail({ form: "This result cannot be confirmed." });
  if (Date.now() > match.deadline) return fail({ form: "The confirmation deadline has passed." });
  set((current) => ({
    ...current,
    matches: current.matches.map((item) => (item.code === code ? { ...item, buyer: "CONFIRMED", status: item.supplierSide === "CONFIRMED" ? item.status : "PARTIALLY_CONFIRMED" } : item)),
  }));
  finishMatch(code);
  return ok(undefined);
}

/** Rejecting gives the quantity back to the order if it is still live (§7.6). */
export function rejectMatch(code: string, reason: string): Result {
  const blocked = verificationBlock();
  if (blocked) return fail(blocked);
  if (!reason.trim()) return fail({ reason: "Give a reason." });
  const match = state.matches.find((item) => item.code === code);
  if (!match || !["PENDING_CONFIRMATION", "PARTIALLY_CONFIRMED"].includes(match.status) || match.buyer !== "PENDING") return fail({ form: "This result cannot be rejected." });
  releaseMatch(code, "REJECTED", reason.trim());
  return ok(undefined);
}

function releaseMatch(code: string, status: "REJECTED" | "EXPIRED", reason: string) {
  const match = state.matches.find((item) => item.code === code)!;
  set((current) => ({
    ...current,
    matches: current.matches.map((item) => (item.code === code ? { ...item, status, buyer: status === "REJECTED" ? "REJECTED" : item.buyer, reason } : item)),
    buyOrders: current.buyOrders.map((order) => {
      if (order.code !== match.buyOrderCode) return order;
      if (!orderIsLive(order) && order.status !== "FILLED") return order;
      const next = { ...order, remaining: order.remaining + match.quantity, history: [...order.history, log("SYSTEM", "UPDATED", `${match.quantity.toLocaleString("en-GB")} kg back from ${code} (${status.toLowerCase()})`)] };
      return { ...next, status: recomputeStatus({ ...next, status: "OPEN" }) };
    }),
    book: current.book.map((order) => (order.code === match.sellOrderCode ? { ...order, remaining: order.remaining + match.quantity } : order)),
  }));
}

/** Demo: the supplier side confirms each new match result a few seconds after the session. */
function simulateSupplierMatchConfirmation(code: string, index: number) {
  later(5000 + index * 2500, () => {
    const match = state.matches.find((item) => item.code === code);
    if (!match || match.supplierSide !== "PENDING" || !["PENDING_CONFIRMATION", "PARTIALLY_CONFIRMED"].includes(match.status)) return;
    set((current) => ({
      ...current,
      matches: current.matches.map((item) => (item.code === code ? { ...item, supplierSide: "CONFIRMED", status: item.buyer === "CONFIRMED" ? item.status : "PARTIALLY_CONFIRMED" } : item)),
    }));
    finishMatch(code);
  });
}

function latestPrice(crop: string, grade: string, data = state) {
  return data.prices.filter((price) => price.crop === crop && price.grade === grade).sort((a, b) => b.at - a.at)[0]?.price;
}

/** B3.3.4: snapshot at cut-off, run the engine, create match results, publish prices. */
export function runMatchingSession(slot: SessionSlot) {
  if (state.sessions.some((session) => session.code === slot.code)) return;
  const now = Date.now();
  const mine = state.buyOrders.filter((order) => orderIsLive(order) && order.priorityTime < Math.max(slot.cutoff, now - 1) && order.remaining > 0);
  const snapshot: EngineOrder[] = [
    ...mine.map((order) => ({ code: order.code, side: "BUY" as const, owner: SELF, crop: order.crop, variety: order.variety, grade: order.grade, zone: order.zone, remaining: order.remaining, limitPrice: order.maxPrice, certifications: order.certifications, from: order.deliveryStart, until: order.deliveryEnd, priorityTime: order.priorityTime })),
    ...state.book.filter((order) => order.remaining > 0 && order.until >= vnDate(now)).map((order) => ({ ...order })),
  ];
  const references: Record<string, number> = {};
  for (const price of [...state.prices].sort((a, b) => a.at - b.at)) references[groupKey(price)] = price.price;
  const { matches, prices } = runSession(snapshot, references);

  const sell = new Map(state.book.map((order) => [order.code, order]));
  const created: MatchResult[] = matches
    .filter((match) => mine.some((order) => order.code === match.buy))
    .map((match) => {
      const counter = sell.get(match.sell)!;
      const lot = state.lots.find((item) => item.code === counter.lotCode);
      return {
        code: nextId("MR"),
        sessionCode: slot.code,
        buyOrderCode: match.buy,
        sellOrderCode: match.sell,
        supplier: counter.owner,
        lotCode: counter.lotCode ?? "",
        crop: counter.crop,
        variety: counter.variety ?? lot?.variety ?? "",
        grade: counter.grade,
        quantity: match.quantity,
        clearingPrice: match.price,
        total: match.quantity * match.price,
        buyer: "PENDING" as const,
        supplierSide: "PENDING" as const,
        status: "PENDING_CONFIRMATION" as const,
        deadline: now + confirmHours() * HOUR,
        matchedAt: now,
      };
    });

  const used = new Map<string, number>();
  for (const match of matches) {
    used.set(match.buy, (used.get(match.buy) ?? 0) + match.quantity);
    used.set(match.sell, (used.get(match.sell) ?? 0) + match.quantity);
  }
  const matched = matches.reduce((sum, match) => sum + match.quantity, 0);

  set((current) => ({
    ...current,
    sessions: [
      ...current.sessions,
      { ...slot, status: "COMPLETED", buyOrders: snapshot.filter((order) => order.side === "BUY").length, sellOrders: snapshot.filter((order) => order.side === "SELL").length, matchedQuantity: matched },
    ],
    prices: [...current.prices, ...prices.map((price) => ({ sessionCode: slot.code, crop: price.crop, variety: price.variety, grade: price.grade, zone: price.zone, price: price.price, volume: price.volume, at: now }))],
    matches: [...created, ...current.matches],
    book: current.book.map((order) => (used.has(order.code) ? { ...order, remaining: order.remaining - used.get(order.code)! } : order)),
    buyOrders: current.buyOrders.map((order) => {
      const quantity = used.get(order.code);
      if (!quantity) return order;
      const next = { ...order, remaining: order.remaining - quantity };
      const status = recomputeStatus(next);
      return { ...next, status, history: [...order.history, log("SYSTEM", status, `${quantity.toLocaleString("en-GB")} kg matched in the ${slot.type.toLowerCase()} session`)] };
    }),
  }));

  created.forEach((match, index) => simulateSupplierMatchConfirmation(match.code, index));
  if (created.length > 0) {
    notify({
      tone: "urgent",
      title: `${created.length} match result${created.length === 1 ? "" : "s"} to confirm`,
      detail: `Session ${slot.type.toLowerCase()}: ${created.map((match) => `${match.quantity.toLocaleString("en-GB")} kg at ${match.clearingPrice.toLocaleString("en-GB")}`).join(", ")}. Confirm within ${confirmHours()} h.`,
      link: { label: "Review results", to: "/buyer/orders?tab=matches" },
    });
  } else if (mine.length > 0) {
    notify({ tone: "info", title: `No match for your orders in the ${slot.type.toLowerCase()} session`, detail: "Open orders carry over to the next session while they are valid.", link: { label: "My buy orders", to: "/buyer/orders" } });
  }
}

/** Demo: run the coming session right away instead of waiting for its time. */
export function demoRunNextSession() {
  const slot = upcomingSlot();
  const now = Date.now();
  state = { ...state, seq: state.seq + 1 };
  runMatchingSession({ ...slot, code: `${slot.code}-DEMO-${state.seq}`, cutoff: now, scheduled: now });
}

// ── Clock: everything that happens because time passed ─────────────────────

let started = false;

export function startBuyerClock() {
  if (started) return;
  started = true;
  tick();
  window.setInterval(tick, 1000);
}

function tick() {
  const now = Date.now();
  const today = todayIso();

  // B3.1.4: close submissions at the deadline.
  for (const demand of state.demands) {
    if (demand.status === "PUBLISHED" && demand.submissionDeadline && demand.submissionDeadline <= now) closeSubmissions(demand.code, "SYSTEM");
  }
  // B3.1.6-A5: no answer from the supplier in time counts as a decline.
  for (const allocation of state.awardAllocations) {
    if (allocation.status === "PENDING_SUPPLIER_CONFIRMATION" && allocation.deadline <= now) respondToAward(allocation.id, "DECLINE", "No answer before the confirmation deadline.");
  }
  // B3.2: auctions start and end on time; allocations expire.
  for (const auction of state.auctions) {
    if (auction.status === "SCHEDULED" && auction.startTime <= now)
      set((current) => ({ ...current, auctions: current.auctions.map((item) => (item.code === auction.code ? { ...item, status: "ACTIVE" } : item)) }));
    if (auction.status === "ACTIVE" && auction.endTime <= now) {
      set((current) => ({ ...current, auctions: current.auctions.map((item) => (item.code === auction.code ? { ...item, status: "ENDED", endedAt: now, endReason: "End time reached" } : item)) }));
      simulateSupplierSelection(auction.code);
    }
  }
  for (const allocation of state.auctionAllocations) {
    if (allocation.status === "PENDING_CONFIRMATION" && allocation.deadline <= now) {
      const auction = state.auctions.find((item) => item.code === allocation.auctionCode)!;
      set((current) => ({
        ...current,
        lots: changeLot(current.lots, auction.lotCode, allocation.quantity),
        auctionAllocations: current.auctionAllocations.map((item) => (item.id === allocation.id ? { ...item, status: "RELEASED" } : item)),
        bids: current.bids.map((bid) => (bid.code === allocation.bidCode ? { ...bid, status: "EXPIRED" } : bid)),
        auctions: current.auctions.map((item) => (item.code === auction.code ? { ...item, status: "NO_WINNER" } : item)),
      }));
    }
  }
  // B3.3: sessions run at their time; results and orders expire.
  for (const slot of slotsOn(today)) {
    if (slot.scheduled <= now && now - slot.scheduled < HOUR && !state.sessions.some((session) => session.code === slot.code)) runMatchingSession(slot);
  }
  for (const match of state.matches) {
    if ((match.status === "PENDING_CONFIRMATION" || match.status === "PARTIALLY_CONFIRMED") && match.deadline <= now) releaseMatch(match.code, "EXPIRED", "Not confirmed before the deadline.");
  }
  for (const order of state.buyOrders) {
    if (!orderIsLive(order)) continue;
    const end = order.timeInForce === "DAY" ? endOfDay(vnDate(order.createdAt)) : endOfDay(order.validUntil ?? today);
    if (end <= now)
      set((current) => ({
        ...current,
        buyOrders: current.buyOrders.map((item) => (item.code === order.code ? { ...item, status: "EXPIRED", history: [...item.history, log("SYSTEM", "EXPIRED")] } : item)),
      }));
  }
}

// ── Derived views ──────────────────────────────────────────────────────────

export function pendingActions(data: BuyerData, now = Date.now()) {
  return {
    matches: data.matches.filter((match) => match.buyer === "PENDING" && ["PENDING_CONFIRMATION", "PARTIALLY_CONFIRMED"].includes(match.status) && match.deadline > now),
    auctionResults: data.auctionAllocations.filter((item) => item.status === "PENDING_CONFIRMATION" && item.deadline > now),
    toEvaluate: data.demands.filter((demand) => demand.status === "CLOSED" || demand.status === "UNDER_EVALUATION"),
    counters: data.proposals.filter((proposal) => proposal.status === "UNDER_REVIEW" && pendingRound(proposal)?.by === "SUPPLIER"),
    declinedAwards: data.awardAllocations.filter(
      (item) => item.status === "DECLINED" && !data.awardAllocations.some((other) => other.demandCode === item.demandCode && other.createdAt > item.createdAt),
    ),
  };
}

export function reportDeliveryIssue(deliveryId: string, issue: DeliveryIssue) {
  set((current) => ({ ...current, deliveryIssues: { ...current.deliveryIssues, [deliveryId]: issue } }));
}

export function mechanismPath(mechanism: Mechanism, parent: string) {
  if (mechanism === "BUYER_LED_PROCUREMENT") return `/buyer/demands/${parent}`;
  if (mechanism === "SUPPLIER_LED_AUCTION") return `/buyer/auctions/${parent}`;
  return `/buyer/orders/${parent}`;
}

/** Lots a buy order could match on product, grade, certificates, window and route (no prices shown). */
export function compatibleLots(order: Pick<BuyOrder, "crop" | "variety" | "grade" | "certifications" | "zone" | "deliveryStart" | "deliveryEnd">, lots = state.lots) {
  return lots.filter(
    (lot) =>
      tradable(lot) &&
      lot.crop === order.crop &&
      (!order.variety || lot.variety === order.variety) &&
      meetsGrade(lot.grade, order.grade) &&
      order.certifications.every((cert) => lot.certifications.includes(cert)) &&
      lot.availableFrom <= order.deliveryEnd &&
      order.deliveryStart <= lot.availableUntil &&
      canDeliver(lot.zone, order.zone),
  );
}

// ── Delivery points ────────────────────────────────────────────────────────

export function addAddress(address: Omit<DeliveryAddress, "id">) {
  const id = `ADR-${Date.now()}`;
  set((current) => ({ ...current, addresses: [...current.addresses, { ...address, id }] }));
  return id;
}

export function updateAddress(address: DeliveryAddress) {
  set((current) => ({ ...current, addresses: current.addresses.map((item) => (item.id === address.id ? address : item)) }));
}

export function removeAddress(id: string) {
  set((current) => ({ ...current, addresses: current.addresses.filter((item) => item.id !== id) }));
}

export function makeDefaultAddress(id: string) {
  set((current) => ({ ...current, addresses: [...current.addresses.filter((item) => item.id === id), ...current.addresses.filter((item) => item.id !== id)] }));
}
