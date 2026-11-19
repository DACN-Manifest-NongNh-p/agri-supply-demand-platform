import { BATCH_STAGES, type BatchStatus } from "./mockProducer";

const kgFormat = new Intl.NumberFormat("en-US");
const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

export function formatKg(kg: number) {
  return `${kgFormat.format(kg)} kg`;
}

export function dateFromToday(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

export function formatDay(offset: number) {
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  if (offset === -1) return "Yesterday";
  return dayFormat.format(dateFromToday(offset));
}

const fullDateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
const shortDateFormat = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

/** A day offset as a full date: "Sat, 07/11/2026"; without the weekday: "07/11/2026". */
export function formatDate(offset: number, options: { weekday?: boolean } = {}) {
  const date = dateFromToday(offset);
  return options.weekday === false ? shortDateFormat.format(date) : fullDateFormat.format(date);
}

/** "31/10/2026 – 27/11/2026". */
export function formatRange(from: number, to: number) {
  return `${formatDate(from, { weekday: false })} – ${formatDate(to, { weekday: false })}`;
}

/** "November 2026". */
export function formatMonth(offset: number) {
  return monthFormat.format(dateFromToday(offset));
}

/** Days between today and a yyyy-mm-dd date (negative in the past). */
export function offsetOf(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return 0;
  const target = new Date(year, month - 1, day);
  return Math.round((target.getTime() - dateFromToday(0).getTime()) / 86_400_000);
}

/** The yyyy-mm-dd value of a day offset, for date inputs. */
export function isoOf(offset: number) {
  const date = dateFromToday(offset);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** formatDay for the middle of a sentence: "today", while dates keep their capitals ("Sat 17 Oct"). */
export function formatDayInText(offset: number) {
  const label = formatDay(offset);
  return label.includes(" ") ? label : label.toLowerCase();
}

export function stageLabel(status: BatchStatus) {
  return BATCH_STAGES.find((stage) => stage.status === status)?.label ?? status;
}

export function nextStatus(status: BatchStatus): BatchStatus | null {
  const index = BATCH_STAGES.findIndex((stage) => stage.status === status);
  return BATCH_STAGES[index + 1]?.status ?? null;
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const VND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

/** 13000000 → "13.000.000 ₫". */
export function formatVnd(amount: number) {
  return VND.format(Math.round(amount));
}
