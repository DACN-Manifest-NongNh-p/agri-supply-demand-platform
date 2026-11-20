// Time rules. Deadlines, cut-offs and session times follow the server clock in Asia/Ho_Chi_Minh
// (NFR-B3-02); this demo uses the browser clock shifted to UTC+7.
import type { SessionType } from "./types";

const VN_OFFSET = 7 * 3_600_000;
export const HOUR = 3_600_000;
export const MINUTE = 60_000;
export const DAY = 24 * HOUR;

/** Calendar date in Vietnam, YYYY-MM-DD. */
export function vnDate(ms: number) {
  return new Date(ms + VN_OFFSET).toISOString().slice(0, 10);
}

/** The instant of a Vietnam wall-clock time on a Vietnam date. */
export function vnInstant(date: string, hours: number, minutes = 0) {
  return Date.parse(`${date}T00:00:00Z`) - VN_OFFSET + hours * HOUR + minutes * MINUTE;
}

export const todayIso = () => vnDate(Date.now());

export function addDays(date: string, days: number) {
  return vnDate(vnInstant(date, 12) + days * DAY);
}

/** End of a Vietnam calendar day (DAY orders end with the trading day, A-06). */
export const endOfDay = (date: string) => vnInstant(date, 23, 59);

/** Three sessions a day; the book closes 10 minutes before each (B3.3 §6.2). */
export const SESSION_TIMES: { type: SessionType; hour: number }[] = [
  { type: "MORNING", hour: 8 },
  { type: "MIDDAY", hour: 11 },
  { type: "AFTERNOON", hour: 14 },
];
export const CUTOFF_MINUTES = 10;

/** Distinct per session (MORNING and MIDDAY share a first letter). */
const SESSION_CODE: Record<SessionType, string> = { MORNING: "AM", MIDDAY: "MD", AFTERNOON: "PM" };

export type SessionSlot = { code: string; date: string; type: SessionType; cutoff: number; scheduled: number };

export function slotsOn(date: string): SessionSlot[] {
  return SESSION_TIMES.map(({ type, hour }) => {
    const scheduled = vnInstant(date, hour);
    return { code: `MS-${date.replaceAll("-", "")}-${SESSION_CODE[type]}`, date, type, scheduled, cutoff: scheduled - CUTOFF_MINUTES * MINUTE };
  });
}

/** The session an order placed now takes part in: the next one whose book is still open. */
export function nextSlot(now: number): SessionSlot {
  for (let day = 0; day < 3; day += 1) {
    const slot = slotsOn(addDays(vnDate(now), day)).find((item) => item.cutoff > now);
    if (slot) return slot;
  }
  return slotsOn(addDays(vnDate(now), 1))[0];
}

/** The session whose book is closed right now (between its cut-off and its match time), if any. */
export function lockedSlot(now: number): SessionSlot | undefined {
  return slotsOn(vnDate(now)).find((slot) => now >= slot.cutoff && now < slot.scheduled);
}

// ── Formatting ─────────────────────────────────────────────────────────────

export function formatDate(date: string, withWeekday = true) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: withWeekday ? "short" : undefined,
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatDateRange(from: string, to: string) {
  return from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`;
}

export function formatTime(ms: number) {
  return new Date(ms + VN_OFFSET).toISOString().slice(11, 16);
}

export function formatDateTime(ms: number) {
  const date = vnDate(ms);
  const prefix = date === todayIso() ? "Today" : date === addDays(todayIso(), 1) ? "Tomorrow" : date === addDays(todayIso(), -1) ? "Yesterday" : formatDate(date);
  return `${prefix}, ${formatTime(ms)}`;
}

/** "2 h 15 min", "45 min", "30 s"; "now" once passed. */
export function formatLeft(ms: number) {
  if (ms <= 0) return "now";
  const minutes = Math.floor(ms / MINUTE);
  if (minutes < 1) return `${Math.ceil(ms / 1000)} s`;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
  return `${Math.round(hours / 24)} days`;
}

/** "01:23:45" for a live clock; "2 days" past a day. */
export function formatClock(ms: number) {
  if (ms <= 0) return "00:00:00";
  if (ms >= DAY) return formatLeft(ms);
  const total = Math.floor(ms / 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** Value for an <input type="datetime-local"> in Vietnam time. */
export function toLocalInput(ms: number) {
  return new Date(ms + VN_OFFSET).toISOString().slice(0, 16);
}

export function fromLocalInput(value: string) {
  return value ? Date.parse(`${value}:00Z`) - VN_OFFSET : NaN;
}
