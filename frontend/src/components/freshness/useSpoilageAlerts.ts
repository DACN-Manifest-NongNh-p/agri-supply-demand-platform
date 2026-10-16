import { useEffect, useState } from "react";
import { useNow } from "@/components/orders/useNow";
import { RISK_HIGH, formatShelfLeft, shelfLifeOf, spoilageRisk, type ShelfLifeInput } from "./shelfLife";

export type SpoilageItem = ShelfLifeInput & {
  /** Who grows it, shown in the alert. */
  producer: string;
  /** Where the alert's action leads (e.g. find a buyer for the batch). */
  to: string;
};

export type SpoilageAlert = {
  id: string;
  code: string;
  title: string;
  detail: string;
  score: number;
  to: string;
};

/** How often the risk is recomputed in the background. */
const RECHECK_MS = 15_000;
/** Demo only: when the simulated sensor reading arrives after the page opens. */
const EXCURSION_AFTER_MS = 20_000;

/**
 * Watches unsold batches and raises an alert the moment one reaches high spoilage risk with kilograms
 * still unsold: no reload needed, the score is recomputed every 15 s and whenever the data changes.
 *
 * Demo only: there are no real sensors, so 20 s after opening, a cold-room temperature excursion is
 * reported for `excursionCode` (an unsold cold-chain batch), which pushes its risk over the line.
 */
export function useSpoilageAlerts(items: SpoilageItem[], excursionCode?: string) {
  const now = useNow(RECHECK_MS);
  const [excursions, setExcursions] = useState<Record<string, string>>({});
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!excursionCode) return;
    const timer = window.setTimeout(
      () => setExcursions((current) => ({ ...current, [excursionCode]: "cold room read 11 °C for 40 min" })),
      EXCURSION_AFTER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [excursionCode]);

  const alerts: SpoilageAlert[] = items
    .filter((item) => item.openKg > 0)
    .map((item) => ({ item, risk: spoilageRisk(item, now, excursions[item.code]) }))
    .filter(({ risk }) => risk.score >= RISK_HIGH)
    .sort((a, b) => b.risk.score - a.risk.score)
    .map(({ item, risk }) => ({
      id: `spoil-${item.code}`,
      code: item.code,
      title: `Spoilage risk ${risk.score}: ${item.code} ${item.product.toLowerCase()}`,
      detail: `${item.producer} · ${item.openKg.toLocaleString("en-GB")} kg unsold · ${formatShelfLeft(shelfLifeOf(item, now).leftMs)} of shelf life left${
        risk.factors[0] ? ` · ${risk.factors[0]}` : ""
      }`,
      score: risk.score,
      to: item.to,
    }))
    .filter((alert) => !dismissed[alert.id]);

  return {
    alerts,
    /** Reported temperature excursions by batch code (for the risk badges). */
    excursions,
    dismiss: (id: string) => setDismissed((current) => ({ ...current, [id]: true })),
  };
}
