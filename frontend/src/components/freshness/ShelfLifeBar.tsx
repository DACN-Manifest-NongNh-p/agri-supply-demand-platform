import { useNow } from "@/components/orders/useNow";
import { formatShelfLeft, shelfLifeOf, spoilageRisk, type RiskLevel, type ShelfLifeInput } from "./shelfLife";
import "./freshness.css";

const LEVEL_LABEL: Record<RiskLevel, string> = { low: "Low risk", watch: "Watch", high: "High risk" };

/** Tone of the bar from the share of shelf life left. */
const toneOf = (fraction: number) => (fraction > 0.5 ? "fresh" : fraction > 0.2 ? "aging" : "critical");

/**
 * Decay bar: the share of shelf life left, shrinking as time passes (refreshed every 30 s), with the
 * time left as text. Compact in tables.
 */
export function ShelfLifeBar({ batch, compact = false }: { batch: Pick<ShelfLifeInput, "harvestDay" | "sellByDay">; compact?: boolean }) {
  const now = useNow(30_000);
  const { fraction, leftMs, end } = shelfLifeOf(batch, now);
  const tone = toneOf(fraction);
  const ends = new Date(end).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <span className={compact ? "fr-shelf fr-shelf--compact" : "fr-shelf"} title={`Sell by ${ends}`}>
      <span className={`fr-shelf-track fr-shelf-track--${tone}`} role="img" aria-label={`${Math.round(fraction * 100)}% of shelf life left`}>
        <span style={{ width: `${Math.max(2, fraction * 100)}%` }} />
      </span>
      <small className={tone === "critical" ? "is-critical" : undefined}>{leftMs > 0 ? `${formatShelfLeft(leftMs)} left` : "Expired"}</small>
    </span>
  );
}

/** Spoilage risk score with its level; the factors are in the tooltip. */
export function RiskBadge({ batch, excursion }: { batch: ShelfLifeInput; excursion?: string }) {
  const now = useNow(30_000);
  const risk = spoilageRisk(batch, now, excursion);
  return (
    <span className={`fr-risk fr-risk--${risk.level}`} title={risk.factors.length ? `Why: ${risk.factors.join(", ")}` : "Plenty of shelf life left"}>
      {LEVEL_LABEL[risk.level]} · {risk.score}
    </span>
  );
}
