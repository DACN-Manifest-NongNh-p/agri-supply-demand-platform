import { useState } from "react";
import { Info, Megaphone, TriangleAlert, X } from "lucide-react";
import { useSite, type Audience, type AnnouncementTone } from "@/lib/site";
import "./notifications.css";

const DISMISSED_KEY = "farmora-dismissed-announcements";

// Dismissing is a per-browser convenience; without storage the banner just comes back on reload.
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

const ICON: Record<AnnouncementTone, typeof Info> = { INFO: Info, WARNING: Megaphone, URGENT: TriangleAlert };

type Props = {
  audience: Audience;
  /** "inline" at the top of an area's content; "floating" over the public pages (their nav is fixed). */
  placement?: "inline" | "floating";
};

/** System announcements an admin published for this audience, most serious first. */
export function AnnouncementBanner({ audience, placement = "inline" }: Props) {
  const { announcements } = useSite();
  const [dismissed, setDismissed] = useState<number[]>(loadDismissed);
  const order: Record<AnnouncementTone, number> = { URGENT: 0, WARNING: 1, INFO: 2 };
  const shown = announcements
    .filter((item) => item.live && item.audiences.includes(audience) && !dismissed.includes(item.id))
    .sort((a, b) => order[a.tone] - order[b.tone]);

  if (shown.length === 0) return null;

  const dismiss = (id: number) => {
    const next = [...dismissed, id];
    setDismissed(next);
    saveDismissed(next);
  };

  return (
    <div className={`ab ab--${placement}`} role="region" aria-label="Announcements">
      {shown.map((item) => {
        const Icon = ICON[item.tone];
        return (
          <p key={item.id} className={`ab-item ab-item--${item.tone.toLowerCase()}`} role={item.tone === "URGENT" ? "alert" : "status"}>
            <Icon size={16} aria-hidden="true" />
            <span>{item.message}</span>
            <button type="button" aria-label="Dismiss announcement" onClick={() => dismiss(item.id)}>
              <X size={15} />
            </button>
          </p>
        );
      })}
    </div>
  );
}
