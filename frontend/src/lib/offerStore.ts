// Offers: a producer (or a coordinator on their behalf) proposes kilograms of a batch to one or more
// buyers. One store for every area, so the offer the producer sends is the one the buyer answers and
// the coordinator sees. On a server each write below is one transaction on the offer and batch rows.
//
// Life of an offer:
//   sent      → waiting for the buyer: accept (pay the deposit), propose other terms, or decline
//   countered → the buyer proposed other terms; waiting for the producer to agree, re-propose or decline
//   accepted  → the buyer paid the deposit; the kilograms are taken off the batch
//   declined / withdrawn / expired → closed
// One batch can be offered to several buyers at once, even for more than it has: the first buyer to
// accept gets the kilograms, later offers shrink to what is left or are withdrawn once it is sold out.
import { useEffect } from "react";
import { createStore } from "./store";
import { partyId, SELF_BUYER_ID, SELF_PRODUCER_ID } from "./parties";
import { RULES } from "./site";
import { depositFor, type Deposit } from "@/components/screens/Buyer/data/mockBuyer";

export type OfferStatus = "sent" | "countered" | "accepted" | "declined" | "withdrawn" | "expired";
export type OfferActor = "producer" | "buyer" | "coordinator";
export type OfferEventKind = "sent" | "note" | "counter" | "agree" | "accept" | "decline" | "withdraw" | "expire" | "shrink";

export type OfferEvent = {
  id: string;
  by: OfferActor | "system";
  kind: OfferEventKind;
  kg?: number;
  pricePerKg?: number;
  text?: string;
  at: number;
};

export type Offer = {
  id: string;
  /** Offers sent together (one batch to several buyers) share a group. */
  groupId: string;
  batchCode: string;
  product: string;
  variety: string;
  grade: "A" | "B" | "C";
  producer: string;
  buyer: string;
  /** The demand it answers; empty for a direct offer to a buyer with no open demand. */
  demandId?: string;
  destination?: string;
  neededByDay?: number;
  /** Current terms: what the buyer accepts by paying the deposit. */
  kg: number;
  pricePerKg: number;
  /** The buyer's proposal while status is "countered". */
  proposal?: { kg: number; pricePerKg: number };
  note?: string;
  createdAt: number;
  validUntil: number;
  status: OfferStatus;
  origin: "producer" | "coordinator";
  deposit?: Deposit;
  events: OfferEvent[];
};

export const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  sent: "Waiting for the buyer",
  countered: "Buyer proposed new terms",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
  expired: "Expired",
};

export const isOpen = (offer: Offer) => offer.status === "sent" || offer.status === "countered";

/** Who has to answer next on an open offer. */
export const awaiting = (offer: Offer): "buyer" | "producer" | null =>
  offer.status === "sent" ? "buyer" : offer.status === "countered" ? "producer" : null;

type State = {
  offers: Offer[];
  /** Kilograms each offered batch had open when it was first offered; accepted offers draw on it. */
  capacity: Record<string, number>;
};

const HOUR = 3_600_000;
let seq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36).slice(-4)}${(seq++).toString(36)}`;

function seed(): State {
  const now = Date.now();
  const offer = (draft: Omit<Offer, "events" | "createdAt" | "status" | "groupId" | "origin" | "validUntil"> & { hoursLeft: number; sentHoursAgo: number }): Offer => {
    const { hoursLeft, sentHoursAgo, ...rest } = draft;
    const createdAt = now - sentHoursAgo * HOUR;
    return {
      ...rest,
      groupId: rest.id,
      origin: "producer",
      status: "sent",
      createdAt,
      validUntil: now + hoursLeft * HOUR,
      events: [{ id: `${rest.id}-e1`, by: "producer", kind: "sent", kg: rest.kg, pricePerKg: rest.pricePerKg, text: rest.note, at: createdAt }],
    };
  };
  return {
    capacity: { "L-077": 1200, "M-334": 900 },
    offers: [
      offer({
        id: "A-7",
        batchCode: "L-077",
        product: "Avocado",
        variety: "Booth 7",
        grade: "A",
        producer: "Lam Ha Avocado Cooperative",
        buyer: "GreenBasket Supermarkets",
        demandId: "D-572",
        kg: 800,
        pricePerKg: 45000,
        note: "Booth 7, grade A. We can pack in 10 kg cartons and ship refrigerated on day 3.",
        hoursLeft: 10,
        sentHoursAgo: 2,
      }),
      offer({
        id: "A-8",
        batchCode: "M-334",
        product: "Mango",
        variety: "Cat Chu",
        grade: "B",
        producer: "Thuan Nam Mango Growers",
        buyer: "GreenBasket Supermarkets",
        demandId: "D-565",
        kg: 200,
        pricePerKg: 30000,
        note: "Covers the last 200 kg of your mango order; same truck as your other mango if you accept today.",
        hoursLeft: 5,
        sentHoursAgo: 1,
      }),
    ],
  };
}

const store = createStore<State>("farmora-offers-v1", seed);

export const useOfferState = store.use;
export const getOfferState = store.get;
export const resetOffers = store.reset;

export function useOffers() {
  return store.use().offers;
}

/** Kilograms of a batch already taken by accepted offers. */
export function acceptedKg(batchCode: string, state = store.get()) {
  return state.offers.filter((offer) => offer.batchCode === batchCode && offer.status === "accepted").reduce((sum, offer) => sum + offer.kg, 0);
}

/** Kilograms still free for offers on a batch (undefined when it was never offered). */
export function remainingKg(batchCode: string, state = store.get()) {
  const capacity = state.capacity[batchCode];
  return capacity === undefined ? undefined : Math.max(0, capacity - acceptedKg(batchCode, state));
}

const event = (by: OfferEvent["by"], kind: OfferEventKind, extra: Partial<OfferEvent> = {}): OfferEvent => ({
  id: nextId("e"),
  by,
  kind,
  at: Date.now(),
  ...extra,
});

function update(id: string, change: (offer: Offer) => Offer | null) {
  let changed = false;
  store.set((state) => ({
    ...state,
    offers: state.offers.map((offer) => {
      if (offer.id !== id) return offer;
      const next = change(offer);
      if (!next) return offer;
      changed = true;
      return next;
    }),
  }));
  return changed;
}

export type OfferBatch = { code: string; product: string; variety: string; grade: "A" | "B" | "C"; producer: string; openKg: number };
export type OfferRecipient = { buyer: string; demandId?: string; destination?: string; neededByDay?: number; kg: number };

/** Sends one offer per recipient, all on the same terms; returns the new offer ids. */
export function sendOffers(
  batch: OfferBatch,
  recipients: OfferRecipient[],
  terms: { pricePerKg: number; note?: string; validHours: number; by?: "producer" | "coordinator" },
): string[] {
  const by = terms.by ?? "producer";
  const now = Date.now();
  const groupId = nextId("G");
  const created: Offer[] = recipients
    .filter((recipient) => recipient.kg > 0)
    .map((recipient) => {
      const id = nextId("OF");
      const note = terms.note?.trim() || undefined;
      return {
        id,
        groupId,
        batchCode: batch.code,
        product: batch.product,
        variety: batch.variety,
        grade: batch.grade,
        producer: batch.producer,
        buyer: recipient.buyer,
        demandId: recipient.demandId,
        destination: recipient.destination,
        neededByDay: recipient.neededByDay,
        kg: recipient.kg,
        pricePerKg: terms.pricePerKg,
        note,
        createdAt: now,
        validUntil: now + terms.validHours * HOUR,
        status: "sent",
        origin: by,
        events: [event(by, "sent", { kg: recipient.kg, pricePerKg: terms.pricePerKg, text: note })],
      };
    });
  store.set((state) => ({
    capacity: { ...state.capacity, [batch.code]: Math.max(state.capacity[batch.code] ?? 0, batch.openKg + acceptedKg(batch.code, state)) },
    offers: [...state.offers, ...created],
  }));
  return created.map((offer) => offer.id);
}

/** A message on the offer without changing its terms. */
export function addNote(id: string, by: OfferActor, text: string) {
  if (!text.trim()) return false;
  return update(id, (offer) => ({ ...offer, events: [...offer.events, event(by, "note", { text: text.trim() })] }));
}

/**
 * Proposes other terms. From the buyer it waits for the producer; from the producer (or the
 * coordinator) it replaces the terms and goes back to the buyer.
 */
export function counter(id: string, by: OfferActor, terms: { kg: number; pricePerKg: number; text?: string }) {
  return update(id, (offer) => {
    if (!isOpen(offer) || terms.kg <= 0 || terms.pricePerKg <= 0) return null;
    const entry = event(by, "counter", { kg: terms.kg, pricePerKg: terms.pricePerKg, text: terms.text?.trim() || undefined });
    if (by === "buyer") return { ...offer, status: "countered", proposal: { kg: terms.kg, pricePerKg: terms.pricePerKg }, events: [...offer.events, entry] };
    return { ...offer, status: "sent", kg: terms.kg, pricePerKg: terms.pricePerKg, proposal: undefined, events: [...offer.events, entry] };
  });
}

/** The producer takes the buyer's proposal; the buyer then confirms it with the deposit. */
export function agree(id: string, by: OfferActor = "producer", text?: string) {
  return update(id, (offer) => {
    if (offer.status !== "countered" || !offer.proposal) return null;
    return {
      ...offer,
      status: "sent",
      kg: offer.proposal.kg,
      pricePerKg: offer.proposal.pricePerKg,
      proposal: undefined,
      events: [...offer.events, event(by, "agree", { ...offer.proposal, text: text?.trim() || undefined })],
    };
  });
}

export type AcceptResult = { ok: true } | { ok: false; reason: "sold_out" | "closed" | "expired" | "changed"; remainingKg: number };

/**
 * The buyer accepts the terms they saw by paying the deposit. One check-and-write: it fails when the
 * terms changed meanwhile (another buyer took part of the batch, or the producer re-proposed) or the
 * kilograms are gone, and it settles the batch's other open offers. The deposit is always worked out
 * from the accepted terms.
 */
export function accept(id: string, deposit: Deposit, seen?: { kg: number; pricePerKg: number }, now = Date.now()): AcceptResult {
  const state = store.get();
  const offer = state.offers.find((item) => item.id === id);
  const left = offer ? (remainingKg(offer.batchCode, state) ?? offer.kg) : 0;
  if (!offer || offer.status !== "sent") return { ok: false, reason: "closed", remainingKg: left };
  if (now > offer.validUntil) {
    expireDue(now);
    return { ok: false, reason: "expired", remainingKg: left };
  }
  if (seen && (seen.kg !== offer.kg || seen.pricePerKg !== offer.pricePerKg)) return { ok: false, reason: "changed", remainingKg: left };
  if (offer.kg > left) return { ok: false, reason: "sold_out", remainingKg: left };
  const paid = { ...deposit, amount: depositFor(offer.kg, offer.pricePerKg, deposit.percent).deposit };

  const after = left - offer.kg;
  store.set({
    ...state,
    offers: state.offers.map((item) => {
      if (item.id === id) return { ...item, status: "accepted", deposit: paid, proposal: undefined, events: [...item.events, event("buyer", "accept", { kg: item.kg, pricePerKg: item.pricePerKg })] };
      if (item.batchCode !== offer.batchCode || !isOpen(item)) return item;
      if (after <= 0) return { ...item, status: "withdrawn", events: [...item.events, event("system", "withdraw", { text: `${offer.batchCode} sold out: another buyer accepted first.` })] };
      if (item.kg > after) return { ...item, kg: after, events: [...item.events, event("system", "shrink", { kg: after, text: `Another buyer accepted first: only ${after.toLocaleString("en-US")} kg left.` })] };
      return item;
    }),
  });
  return { ok: true };
}

export function decline(id: string, by: OfferActor, text?: string) {
  return update(id, (offer) => (isOpen(offer) ? { ...offer, status: "declined", proposal: undefined, events: [...offer.events, event(by, "decline", { text: text?.trim() || undefined })] } : null));
}

export function withdraw(id: string, by: OfferActor = "producer", text?: string) {
  return update(id, (offer) => (isOpen(offer) ? { ...offer, status: "withdrawn", proposal: undefined, events: [...offer.events, event(by, "withdraw", { text: text?.trim() || undefined })] } : null));
}

export function expireDue(now = Date.now()) {
  const state = store.get();
  if (!state.offers.some((offer) => isOpen(offer) && now > offer.validUntil)) return;
  store.set({
    ...state,
    offers: state.offers.map((offer) =>
      isOpen(offer) && now > offer.validUntil ? { ...offer, status: "expired", events: [...offer.events, event("system", "expire", { text: "Nobody answered in time." })] } : offer,
    ),
  });
}

/** Hours until the offer lapses (rounded up, never below 0). */
export const hoursLeft = (offer: Offer, now = Date.now()) => Math.max(0, Math.ceil((offer.validUntil - now) / HOUR));

/** A deposit for the current terms, as a simulated buyer would pay it. */
export function depositOf(offer: Pick<Offer, "kg" | "pricePerKg">, method: Deposit["method"] = "bank"): Deposit {
  const percent = RULES.depositPercent;
  return { amount: depositFor(offer.kg, offer.pricePerKg, percent).deposit, percent, method, ref: `FM-${String(Date.now()).slice(-5)}` };
}

// ---------- Demo: the other side answers ----------

/** How long a simulated buyer or producer waits before answering. */
const REPLY_MS = 9_000;
const TICK_MS = 3_000;
let simulations = 0;

/** A stable pseudo-random number per offer, so a simulated party decides the same way every tick. */
const roll = (text: string) => [...text].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 1000, 7) / 1000;

function simulate(now: number) {
  expireDue(now);
  for (const offer of store.get().offers) {
    if (!isOpen(offer)) continue;
    const last = offer.events.at(-1)?.at ?? offer.createdAt;
    if (now - last < REPLY_MS) continue;
    const who = awaiting(offer);
    // The demo user plays GreenBasket (buyer area) and Hoa Phat (producer area): never answer for them.
    if (who === "buyer" && partyId(offer.buyer) !== SELF_BUYER_ID) {
      const buyerCounters = offer.events.filter((item) => item.by === "buyer" && item.kind === "counter").length;
      const chance = roll(offer.id);
      if (chance < 0.2 && buyerCounters === 0) decline(offer.id, "buyer", "We found supply closer to our warehouse this time, thank you.");
      else if (chance < 0.6 && buyerCounters === 0) {
        const price = Math.round((offer.pricePerKg * 0.94) / 500) * 500;
        counter(offer.id, "buyer", { kg: offer.kg, pricePerKg: price, text: `Could you do ${price.toLocaleString("vi-VN")} ₫/kg? We would take the full ${offer.kg.toLocaleString("en-US")} kg.` });
      } else accept(offer.id, depositOf(offer), undefined, now);
    }
    if (who === "producer" && partyId(offer.producer) !== SELF_PRODUCER_ID && offer.proposal) {
      const gap = 1 - offer.proposal.pricePerKg / offer.pricePerKg;
      if (gap <= 0.08) agree(offer.id, "producer", "Agreed. Pay the deposit and we will start packing.");
      else {
        const middle = Math.round((offer.pricePerKg + offer.proposal.pricePerKg) / 2 / 500) * 500;
        counter(offer.id, "producer", { kg: offer.proposal.kg, pricePerKg: middle, text: `We can meet you halfway at ${middle.toLocaleString("vi-VN")} ₫/kg.` });
      }
    }
  }
}

/**
 * Demo only: buyers and producers other than the demo accounts answer offers after a few seconds
 * (accept, propose a lower price, or decline), and offers lapse when their time is up.
 */
export function useOfferSimulation() {
  useEffect(() => {
    simulations += 1;
    if (simulations > 1) return () => void (simulations -= 1);
    const timer = window.setInterval(() => simulate(Date.now()), TICK_MS);
    return () => {
      simulations -= 1;
      window.clearInterval(timer);
    };
  }, []);
}
