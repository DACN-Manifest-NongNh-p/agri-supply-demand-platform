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
