import { ArrowRight, Check, CircleCheck, Minus, Package, Store, X } from "lucide-react";
import { Link } from "react-router-dom";
import { batchesWithoutBuyer, type CriterionState, type MatchResult } from "../data/matching";
import { demands } from "../data/mockProducer";
import { useProducer } from "../data/producerContext";
import { formatDay, formatKg } from "../data/format";
import { MatchScore, ScoreRing } from "./MatchScore";

const CRITERION_ICON = { pass: Check, partial: Minus, fail: X } satisfies Record<CriterionState, typeof Check>;
const MORE_COUNT = 3;

type Props = {
  matches: MatchResult[];
  offers: Record<string, string>;
  onOffer: (demandId: string, batchCode: string) => void;
};

/** The centrepiece of the producer home: system-generated matches, best one featured. */
export function MatchHero({ matches, offers, onOffer }: Props) {
  const { batches } = useProducer();
  const matched = matches.filter((match) => match.best);
  const unsold = batchesWithoutBuyer(demands, batches).length;
  // Feature the best match the producer has not acted on yet; fall back to the best overall.
  const featured = matched.find((match) => !offers[match.demand.id]) ?? matched[0];
  const others = matched.filter((match) => match !== featured).slice(0, MORE_COUNT);

  return (
    <section id="matches" className="ph-match-hero" aria-labelledby="matches-title">
      <div className="ph-match-hero-head">
        <div>
          <p className="ph-match-hero-eyebrow">Matching</p>
          <h2 id="matches-title">
            {matched.length} {matched.length === 1 ? "buyer matches" : "buyers match"} your batches
          </h2>
          <p className="ph-match-hero-sub">Farmora checks every open demand against the batches you have declared.</p>
        </div>
        <Link to="/producer/demand" className="ph-match-hero-link">
          View all matches <ArrowRight size={16} />
        </Link>
      </div>

      {featured?.best ? (
        <div className="ph-match-hero-body">
          <FeaturedMatch match={featured} offered={offers[featured.demand.id]} onOffer={onOffer} />

          <aside className="ph-match-more" aria-label="More matches">
            <p className="ph-match-more-title">More matches</p>
            <ul>
              {others.map(({ demand, best }) => (
                <li key={demand.id}>
                  <div>
                    <p className="ph-match-more-buyer">{demand.buyer}</p>
                    <p className="ph-match-more-meta">
                      {formatKg(demand.quantityKg)} {demand.product} · {best?.batch.code}
                    </p>
                  </div>
                  {offers[demand.id] ? (
                    <span className="ph-offered"><CircleCheck size={14} /> Offered</span>
                  ) : (
                    best && <MatchScore score={best.score} />
                  )}
                </li>
              ))}
            </ul>
            {unsold > 0 && (
              <Link to="/producer/demand?view=unmatched" className="ph-match-more-unmatched">
                {unsold} {unsold === 1 ? "batch has" : "batches have"} no buyer yet <ArrowRight size={14} />
              </Link>
            )}
          </aside>
        </div>
      ) : (
        <p className="ph-match-hero-empty">
          No buyer demand matches your batches right now. Declare a batch or check{" "}
          <Link to="/producer/demand">all market demand</Link>.
        </p>
      )}
    </section>
  );
}

function FeaturedMatch({ match, offered, onOffer }: { match: MatchResult; offered?: string; onOffer: Props["onOffer"] }) {
  const { demand, best } = match;
  if (!best) return null;
  const batch = best.batch;

  return (
    <article className="ph-featured" aria-label={`Best match: ${demand.buyer} and ${batch.code}`}>
      <p className="ph-featured-tag">Best match</p>

      <div className="ph-featured-pair">
        <div className="ph-featured-side">
          <p className="ph-featured-kicker"><Store size={14} /> Buyer demand</p>
          <p className="ph-featured-name">{demand.buyer}</p>
          <p className="ph-featured-big">{formatKg(demand.quantityKg)}</p>
          <p className="ph-featured-meta">
            {demand.product} · {demand.gradeWanted}
            <br />
            Needed by {formatDay(demand.neededByDay)} · {demand.destination}
          </p>
        </div>

        <div className="ph-featured-link" aria-hidden="true">
          <span className="ph-featured-line" />
          <ScoreRing score={best.score} />
          <span className="ph-featured-line" />
        </div>

        <div className="ph-featured-side ph-featured-side--batch">
          <p className="ph-featured-kicker"><Package size={14} /> Your batch</p>
          <p className="ph-featured-name">{batch.code} · {batch.product}</p>
          <p className="ph-featured-big">{formatKg(batch.quantityKg - batch.allocatedKg)}</p>
          <p className="ph-featured-meta">
            open · {batch.variety}, grade {batch.grade}
            <br />
            Ready {formatDay(batch.readyDay)} · sell by {formatDay(batch.sellByDay)}
          </p>
        </div>
      </div>

      <ul className="ph-featured-criteria" aria-label="Why it matches">
        {best.criteria.map((criterion) => {
          const Icon = CRITERION_ICON[criterion.state];
          return (
            <li key={criterion.name} className={`ph-chip-criterion ph-chip-criterion--${criterion.state}`} title={criterion.detail}>
              <Icon size={12} strokeWidth={3} /> {criterion.name}
            </li>
          );
        })}
      </ul>

      <div className="ph-featured-actions">
        {offered ? (
          <span className="ph-offered"><CircleCheck size={16} /> Offered {offered} · waiting for {demand.buyer}</span>
        ) : (
          <button type="button" className="ph-btn ph-btn--primary ph-btn--large" onClick={() => onOffer(demand.id, batch.code)}>
            Offer {batch.code} to {demand.buyer}
          </button>
        )}
        <Link to={`/producer/demand?open=${demand.id}`} className="ph-link-btn">
          See why it matches <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
