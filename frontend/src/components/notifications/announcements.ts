// Admin announcements shown as notifications under an area's bell. Dismissing one is remembered in
// this browser only; without storage it simply comes back on the next load.
import { useState } from "react";
import { useSite, type AnnouncementTone, type Audience } from "@/lib/site";
import type { Notice } from "./NotificationBell";

const DISMISSED_KEY = "farmora-dismissed-announcements";
const PREFIX = "announcement-";

function loadDismissed(): number[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]") as number[];
  } catch {
    return [];
  }
}

function saveDismissed(ids: number[]) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
  } catch {
    // Not remembered.
  }
}

const TONE: Record<AnnouncementTone, Notice["tone"]> = { URGENT: "urgent", WARNING: "warning", INFO: "info" };
const ORDER: Record<AnnouncementTone, number> = { URGENT: 0, WARNING: 1, INFO: 2 };

const until = (value: string) => new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Live announcements for this audience as bell notices (most serious first), and how to dismiss one. */
export function useAnnouncementNotices(audience: Audience) {
  const { announcements } = useSite();
  const [dismissed, setDismissed] = useState<number[]>(loadDismissed);

  const notices: Notice[] = announcements
    .filter((item) => item.live && item.audiences.includes(audience) && !dismissed.includes(item.id))
    .sort((a, b) => ORDER[a.tone] - ORDER[b.tone])
    .map((item) => ({
      id: `${PREFIX}${item.id}`,
      tone: TONE[item.tone],
      title: item.message,
      detail: item.endsAt ? `From Farmora · until ${until(item.endsAt)}` : "From Farmora",
    }));

  /** Handles announcement ids and returns true; any other id is left to the caller. */
  const dismiss = (id: string) => {
    if (!id.startsWith(PREFIX)) return false;
    const next = [...dismissed, Number(id.slice(PREFIX.length))];
    setDismissed(next);
    saveDismissed(next);
    return true;
  };

  return { notices, dismiss };
}
