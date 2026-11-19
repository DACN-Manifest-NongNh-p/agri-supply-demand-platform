// How each user wants to hear about things: which events, on which channels, how often, and when to
// stay quiet. Kept per account in this browser until the backend stores it. In-app notices are
// filtered here; email, SMS and Zalo are recorded in a demo outbox (nothing is really sent yet).
import { createStore } from "./store";
import { getKeycloakUsername } from "./keycloak";

export type NotifyArea = "producer" | "buyer" | "coordinator" | "logistics";
export type NotifyChannel = "in_app" | "email" | "sms" | "zalo";
export type NotifyEvent = "offer" | "offer_reply" | "message" | "order" | "hold" | "spoilage" | "coordinator";

export const CHANNEL_LABEL: Record<NotifyChannel, string> = {
  in_app: "In the app",
  email: "Email",
  sms: "SMS",
  zalo: "Zalo",
};

export const EVENT_LABEL: Record<NotifyEvent, { label: string; hint: string }> = {
  offer: { label: "New offers", hint: "A producer offers a batch, or a buyer reserves yours." },
  offer_reply: { label: "Answers to offers", hint: "Accepted, declined, or new terms proposed." },
  message: { label: "Messages", hint: "Someone writes to you in Messages." },
  order: { label: "Order updates", hint: "Confirmed, picked up, delivered, problems on the way." },
  hold: { label: "Deadlines", hint: "A hold or offer is about to run out." },
  spoilage: { label: "Freshness alerts", hint: "A batch is close to its sell-by date or a sensor reads out of range." },
  coordinator: { label: "From Farmora", hint: "Coordinator requests and platform announcements." },
};

/** Events each area can get; buyers never get freshness alerts on batches they do not own, and so on. */
export const AREA_EVENTS: Record<NotifyArea, NotifyEvent[]> = {
  producer: ["offer", "offer_reply", "message", "order", "hold", "spoilage", "coordinator"],
  buyer: ["offer", "offer_reply", "message", "order", "hold", "coordinator"],
  coordinator: ["offer", "order", "hold", "spoilage", "coordinator"],
  logistics: ["order", "coordinator"],
};

export type NotifyPrefs = {
  channels: Record<NotifyEvent, NotifyChannel[]>;
  /** "instant" sends each one; "digest" collects email/SMS/Zalo into one message a day at 18:00. */
  frequency: "instant" | "digest";
  quietHours: { enabled: boolean; from: string; to: string };
  /** Where outside channels go (defaults to the profile's contact details). */
  email: string;
  phone: string;
};

const DEFAULT_CHANNELS: Record<NotifyEvent, NotifyChannel[]> = {
  offer: ["in_app", "email"],
  offer_reply: ["in_app", "email"],
  message: ["in_app"],
  order: ["in_app", "email"],
  hold: ["in_app", "sms"],
  spoilage: ["in_app", "sms"],
  coordinator: ["in_app"],
};

const defaults = (): NotifyPrefs => ({
  channels: structuredClone(DEFAULT_CHANNELS),
  frequency: "instant",
  quietHours: { enabled: false, from: "21:00", to: "06:00" },
  email: "",
  phone: "",
});

type State = Record<string, NotifyPrefs>;

const store = createStore<State>("farmora-notify-prefs-v1", () => ({}));

const keyOf = (area: NotifyArea) => `${area}:${getKeycloakUsername() || "demo"}`;

export function getPrefs(area: NotifyArea, state = store.get()): NotifyPrefs {
  const saved = state[keyOf(area)];
  const base = defaults();
  return saved ? { ...base, ...saved, channels: { ...base.channels, ...saved.channels }, quietHours: { ...base.quietHours, ...saved.quietHours } } : base;
}

export function usePrefs(area: NotifyArea) {
  return getPrefs(area, store.use());
}

export function savePrefs(area: NotifyArea, prefs: NotifyPrefs) {
  store.set((state) => ({ ...state, [keyOf(area)]: prefs }));
}

export const wants = (prefs: NotifyPrefs, event: NotifyEvent, channel: NotifyChannel) => prefs.channels[event]?.includes(channel) ?? false;

function inQuietHours(prefs: NotifyPrefs, at: Date) {
  if (!prefs.quietHours.enabled) return false;
  const minutes = at.getHours() * 60 + at.getMinutes();
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const from = toMinutes(prefs.quietHours.from);
  const to = toMinutes(prefs.quietHours.to);
  return from <= to ? minutes >= from && minutes < to : minutes >= from || minutes < to;
}

// ---------- Demo outbox: what would have gone out by email, SMS or Zalo ----------

export type OutboxEntry = {
  id: string;
  area: NotifyArea;
  channel: Exclude<NotifyChannel, "in_app">;
  to: string;
  title: string;
  at: number;
  /** Held back by quiet hours or waiting for the daily digest. */
  queued?: "quiet_hours" | "digest";
};

const outbox = createStore<OutboxEntry[]>("farmora-notify-outbox-v1", () => []);
export const useOutbox = outbox.use;
const delivered = new Set<string>();

/**
 * Records a notice on every outside channel the user picked for this event. Each notice id is sent
 * once per visit, however often the screen that raises it renders.
 */
export function dispatch(area: NotifyArea, event: NotifyEvent, notice: { id: string; title: string }, contact: { email: string; phone: string }) {
  const key = `${area}:${notice.id}`;
  if (delivered.has(key) || outbox.get().some((entry) => entry.id.startsWith(`${key}:`))) return;
  delivered.add(key);
  const prefs = getPrefs(area);
  const now = new Date();
  const queued = inQuietHours(prefs, now) ? "quiet_hours" : prefs.frequency === "digest" ? "digest" : undefined;
  const entries: OutboxEntry[] = (["email", "sms", "zalo"] as const)
    .filter((channel) => wants(prefs, event, channel))
    .map((channel) => ({
      id: `${key}:${channel}`,
      area,
      channel,
      to: channel === "email" ? prefs.email || contact.email || "(no email)" : prefs.phone || contact.phone || "(no phone)",
      title: notice.title,
      at: now.getTime(),
      queued,
    }));
  if (entries.length) outbox.set((list) => [...entries, ...list].slice(0, 50));
}

export function clearOutbox() {
  outbox.set([]);
}
