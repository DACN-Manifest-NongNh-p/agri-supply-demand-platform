// One-to-one conversations between a producer and a buyer, optionally about one offer, demand,
// order or batch. One store for every area, so a message sent as the producer is in the buyer's inbox.
// Drivers are never in a conversation: deliveries go through the coordinator (see docs/system).
import { useEffect } from "react";
import { createStore } from "./store";
import { partyId, SELF_BUYER_ID, SELF_PRODUCER_ID } from "./parties";

export type ConversationContext = { kind: "offer" | "demand" | "order" | "batch"; id: string; label: string };

export type Message = {
  id: string;
  /** Party id of the sender. */
  from: string;
  text: string;
  at: number;
  /** Party ids that have read it (the sender always has). */
  readBy: string[];
};

export type Conversation = {
  id: string;
  producer: string;
  buyer: string;
  context?: ConversationContext;
  messages: Message[];
  updatedAt: number;
};

const MINUTE = 60_000;
let seq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36).slice(-4)}${(seq++).toString(36)}`;

function seed(): Conversation[] {
  const now = Date.now();
  const msg = (id: string, from: string, text: string, minutesAgo: number, read: string[]): Message => ({ id, from, text, at: now - minutesAgo * MINUTE, readBy: [from, ...read] });
  const hoaPhat = SELF_PRODUCER_ID;
  const greenBasket = SELF_BUYER_ID;
  const saigonFresh = partyId("Saigon Fresh Kitchen");
  const lamHa = partyId("Lam Ha Avocado Cooperative");
  return [
    {
      id: "C-1",
      producer: "Hoa Phat Dragon Fruit Cooperative",
      buyer: "GreenBasket Supermarkets",
      context: { kind: "demand", id: "D-551", label: "Demand D-551 · 2,000 kg dragon fruit" },
      updatedAt: now - 35 * MINUTE,
      messages: [
        msg("m1", greenBasket, "Hi, do you have red flesh dragon fruit for D-551? We need it by the day after tomorrow.", 80, [hoaPhat]),
        msg("m2", hoaPhat, "Yes, B-104 is red flesh, 2,600 kg, harvested yesterday. I can offer it today.", 62, [greenBasket]),
        msg("m3", greenBasket, "Great. Can you pack in 10 kg crates with our labels?", 35, []),
      ],
    },
    {
      id: "C-2",
      producer: "Hoa Phat Dragon Fruit Cooperative",
      buyer: "Saigon Fresh Kitchen",
      context: { kind: "demand", id: "D-548", label: "Demand D-548 · 600 kg mango" },
      updatedAt: now - 300 * MINUTE,
      messages: [
        msg("m4", saigonFresh, "The mango last time was excellent. Will you have Cat Hoa Loc again this month?", 320, [hoaPhat]),
        msg("m5", hoaPhat, "Our next mango is grade C (B-112), sorry. Grade A again in about three weeks.", 300, [saigonFresh]),
      ],
    },
    {
      id: "C-3",
      producer: "Lam Ha Avocado Cooperative",
      buyer: "GreenBasket Supermarkets",
      context: { kind: "offer", id: "A-7", label: "Offer A-7 · 800 kg avocado" },
      updatedAt: now - 110 * MINUTE,
      messages: [msg("m6", lamHa, "We sent you an offer for D-572. Happy to adjust the carton size if your stores prefer 5 kg.", 110, [])],
    },
  ];
}

const store = createStore<Conversation[]>("farmora-messages-v1", seed);

export const useConversations = store.use;
export const getConversations = store.get;

/** Conversations the party takes part in, newest first. */
export function conversationsOf(party: string, all = store.get()) {
  const id = partyId(party);
  return all.filter((item) => partyId(item.producer) === id || partyId(item.buyer) === id).sort((a, b) => b.updatedAt - a.updatedAt);
}

export const unreadIn = (conversation: Conversation, party: string) => {
  const id = partyId(party);
  return conversation.messages.filter((message) => !message.readBy.includes(id)).length;
};

export function useUnreadCount(party: string) {
  const all = store.use();
  return conversationsOf(party, all).reduce((sum, item) => sum + unreadIn(item, party), 0);
}

/** The other party's name in a conversation. */
export const otherSide = (conversation: Conversation, party: string) =>
  partyId(conversation.producer) === partyId(party) ? conversation.buyer : conversation.producer;

/**
 * Finds the conversation between these two (about this context, when given) or starts one.
 * Returns its id.
 */
export function openConversation(producer: string, buyer: string, context?: ConversationContext) {
  const existing = store
    .get()
    .find(
      (item) =>
        partyId(item.producer) === partyId(producer) &&
        partyId(item.buyer) === partyId(buyer) &&
        (context ? item.context?.kind === context.kind && item.context.id === context.id : !item.context),
    );
  if (existing) return existing.id;
  const id = nextId("C");
  store.set((all) => [...all, { id, producer, buyer, context, messages: [], updatedAt: Date.now() }]);
  return id;
}

export function sendMessage(conversationId: string, from: string, text: string) {
  const body = text.trim();
  if (!body) return;
  const sender = partyId(from);
  const now = Date.now();
  store.set((all) =>
    all.map((item) =>
      item.id === conversationId
        ? { ...item, updatedAt: now, messages: [...item.messages, { id: nextId("m"), from: sender, text: body, at: now, readBy: [sender] }] }
        : item,
    ),
  );
}

export function markRead(conversationId: string, reader: string) {
  const id = partyId(reader);
  const conversation = store.get().find((item) => item.id === conversationId);
  if (!conversation || conversation.messages.every((message) => message.readBy.includes(id))) return;
  store.set((all) =>
    all.map((item) =>
      item.id === conversationId ? { ...item, messages: item.messages.map((message) => (message.readBy.includes(id) ? message : { ...message, readBy: [...message.readBy, id] })) } : item,
    ),
  );
}

// ---------- Demo: the other side replies ----------

const REPLY_MS = 7_000;
const REPLIES = [
  "Thanks, noted. Let me check with the team and get back to you within the hour.",
  "That works for us. Please put it in the offer so we can confirm it.",
  "Could you send a photo of the batch? Our QC team likes to see it before confirming.",
  "Understood. We can be flexible on the delivery window by half a day.",
];
let running = 0;

function simulate(now: number) {
  for (const conversation of store.get()) {
    const last = conversation.messages.at(-1);
    if (!last || now - last.at < REPLY_MS) continue;
    // Only the demo accounts write by hand; the simulated party answers the last message once.
    const fromSelf = last.from === SELF_PRODUCER_ID || last.from === SELF_BUYER_ID;
    if (!fromSelf) continue;
    const other = last.from === partyId(conversation.producer) ? conversation.buyer : conversation.producer;
    const otherId = partyId(other);
    if (otherId === SELF_PRODUCER_ID || otherId === SELF_BUYER_ID) continue;
    sendMessage(conversation.id, other, REPLIES[conversation.messages.length % REPLIES.length]);
  }
}

/** Demo only: parties other than the demo accounts answer a message after a few seconds. */
export function useMessageSimulation() {
  useEffect(() => {
    running += 1;
    if (running > 1) return () => void (running -= 1);
    const timer = window.setInterval(() => simulate(Date.now()), 3_000);
    return () => {
      running -= 1;
      window.clearInterval(timer);
    };
  }, []);
}
