import { ArrowRight, Thermometer } from "lucide-react";
import { Link } from "react-router-dom";
import { useNow } from "@/components/orders/useNow";
import { ShelfLifeBar } from "./ShelfLifeBar";
import { spoilageRisk, type RiskLevel } from "./shelfLife";
import type { SpoilageItem } from "./useSpoilageAlerts";
import "./freshness.css";

const LEVEL_LABEL: Record<RiskLevel, string> = { low: "Low", watch: "Watch", high: "High" };

type Props = {
  items: SpoilageItem[];
  /** Temperature excursions reported per batch code. */
  excursions: Record<string, string>;
  /** Rows shown, riskiest first. */
  limit?: number;
  actionLabel?: string;
  /** Where "See all" leads. */
  allTo?: string;
};

/**
 * The batches most at risk of spoiling unsold, ranked by spoilage risk and recomputed every 15 s:
 * shelf life left, the score, the main reason and what to do.
 */
export function SpoilageWatch({ items, excursions, limit = 5, actionLabel = "Find a buyer", allTo }: Props) {
  const now = useNow(15_000);
  const ranked = items
    .filter((item) => item.openKg > 0)
    .map((item) => ({ item, risk: spoilageRisk(item, now, excursions[item.code]) }))
    .sort((a, b) => b.risk.score - a.risk.score);
  const high = ranked.filter(({ risk }) => risk.level === "high").length;
  const watch = ranked.filter(({ risk }) => risk.level === "watch").length;
  const checked = new Date(now).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <section className={high > 0 ? "ph-card fr-watch is-alert" : "ph-card fr-watch"} aria-labelledby="spoilage-title">
      <header className="fr-watch-head">
        <span className="fr-watch-icon" aria-hidden="true">
          <Thermometer size={18} />
        </span>
        <div>
          <h2 id="spoilage-title">Spoilage watch</h2>
          <p>
            {high > 0 ? <strong className="fr-watch-high">{high} at high risk</strong> : "Nothing at high risk"}
            {watch > 0 && <> · {watch} to watch</>} · unsold batches, riskiest first
          </p>
        </div>
        <span className="fr-live" title="Recomputed every 15 seconds and whenever the data changes">
          <span className="fr-live-dot" aria-hidden="true" /> Live · checked {checked}
        </span>
      </header>

      {ranked.length === 0 ? (
        <p className="ph-muted">No unsold batches to watch.</p>
      ) : (
        <ol className="fr-watch-list">
          {ranked.slice(0, limit).map(({ item, risk }) => (
            <li key={item.code} className={`fr-watch-row fr-watch-row--${risk.level}`}>
              <span className="fr-watch-what">
                <strong>
                  {item.code} · {item.product}
                </strong>
                <small>
                  {item.producer} · {item.openKg.toLocaleString("en-GB")} kg unsold
                </small>
              </span>
              <ShelfLifeBar batch={item} />
              <span className="fr-watch-why">{risk.factors[0] ? risk.factors[0] : "Plenty of shelf life left"}</span>
              <span className={`fr-watch-score fr-watch-score--${risk.level}`} title={risk.factors.join(", ")}>
                <strong>{risk.score}</strong>
                <small>{LEVEL_LABEL[risk.level]}</small>
              </span>
              <Link to={item.to} className="fr-watch-action">
                {actionLabel} <ArrowRight size={14} />
              </Link>
            </li>
          ))}
        </ol>
      )}
      {allTo && ranked.length > limit && (
        <Link to={allTo} className="ph-link-btn fr-watch-all">
          See all {ranked.length} unsold batches <ArrowRight size={14} />
        </Link>
      )}
    </section>
  );
}
