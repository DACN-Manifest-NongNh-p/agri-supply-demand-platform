import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDayInText, formatKg } from "../../Producer/data/format";
import { rankSupply, sortDemands } from "../data/demands";
import { useBuyer } from "../data/buyerContext";
import { CriteriaChips } from "./Criteria";
import { FulfilmentBar } from "./Fulfilment";
import { ReserveControl, SupplyPair } from "./SupplyPair";
import { ReservedNotice, type Reservation } from "./ReservedNotice";

const MORE_COUNT = 4;

/** The centrepiece of the buyer home: the most urgent open demand and the supply Farmora suggests for it. */
export function DemandHero() {
  const { demands, allocations, supply, reserve } = useBuyer();
  const [reserved, setReserved] = useState<Reservation | null>(null);

  const open = sortDemands(demands, allocations).filter(({ fulfilment }) => fulfilment.openKg > 0);
  const ranked = open.map((item) => ({ ...item, ranking: rankSupply(item.demand, supply, item.fulfilment.openKg) }));
  const withSupply = ranked.filter((item) => item.ranking.candidates.length > 0);
  const noSupply = ranked.length - withSupply.length;
  const featured = withSupply[0];
  const others = ranked.filter((item) => item !== featured).slice(0, MORE_COUNT);

  return (
    <section id="matching" className="ph-match-hero" aria-labelledby="matching-title">
      <div className="ph-match-hero-head">
        <div>
          <p className="ph-match-hero-eyebrow">Matching</p>
          <h2 id="matching-title">
            {withSupply.length === 0
              ? "No open demand has matching supply right now"
              : `Farmora found supply for ${withSupply.length} of your ${open.length} open ${open.length === 1 ? "demand" : "demands"}`}
          </h2>
          <p className="ph-match-hero-sub">Every declared producer batch is checked against what you still need.</p>
        </div>
        <Link to="/buyer/demands" className="ph-match-hero-link">
          All demands <ArrowRight size={16} />
        </Link>
      </div>

      {reserved && <ReservedNotice key={reserved.allocationId} reservation={reserved} onClose={() => setReserved(null)} />}

      {featured ? (
        <div className="ph-match-hero-body">
          <article className="ph-featured" aria-label={`Best supply for ${featured.demand.id}`}>
            <p className="ph-featured-tag">Most urgent</p>

            <div className="bu-featured-head">
              <p className="bu-featured-title">
                {formatKg(featured.demand.quantityKg)} {featured.demand.product.toLowerCase()}
                <span> · needed by {formatDayInText(featured.demand.neededByDay)}</span>
              </p>
              <FulfilmentBar quantityKg={featured.demand.quantityKg} fulfilment={featured.fulfilment} />
            </div>

            <SupplyPair demand={featured.demand} openKg={featured.fulfilment.openKg} candidate={featured.ranking.candidates[0]} />
            <CriteriaChips criteria={featured.ranking.candidates[0].criteria} />

            <div className="ph-featured-actions">
              <ReserveControl
                key={`${featured.demand.id}-${featured.ranking.candidates[0].batch.code}`}
                batch={featured.ranking.candidates[0].batch}
                openKg={featured.fulfilment.openKg}
                large
                onReserve={(kg) => {
                  const batch = featured.ranking.candidates[0].batch;
                  const allocationId = reserve(featured.demand.id, batch.code, kg);
                  if (allocationId) {
                    setReserved({ allocationId, demandId: featured.demand.id, batchCode: batch.code, producer: batch.producer, product: batch.product, kg });
                  }
                }}
              />
              <Link to={`/buyer/demands/${featured.demand.id}`} className="ph-link-btn">
                {featured.ranking.candidates.length > 1 ? `Compare ${featured.ranking.candidates.length} options` : "See why it matches"} <ArrowRight size={14} />
              </Link>
            </div>
          </article>

          <aside className="ph-match-more" aria-label="Other open demands">
            <p className="ph-match-more-title">Other open demands</p>
            {others.length === 0 ? (
              <p className="ph-match-more-meta">Nothing else is waiting for supply.</p>
            ) : (
              <ul>
                {others.map(({ demand, fulfilment, ranking }) => (
                  <li key={demand.id}>
                    <Link to={`/buyer/demands/${demand.id}`} className="bu-more-link">
                      <p className="ph-match-more-buyer">{formatKg(fulfilment.openKg)} {demand.product.toLowerCase()} open</p>
                      <p className="ph-match-more-meta">
                        {demand.id} · needed by {formatDayInText(demand.neededByDay)}
                      </p>
                      <span className="bu-more-track" aria-hidden="true">
                        <span style={{ width: `${Math.round(((demand.quantityKg - fulfilment.openKg) / demand.quantityKg) * 100)}%` }} />
                      </span>
                    </Link>
                    <span className={ranking.candidates.length > 0 ? "bu-more-count" : "bu-more-count bu-more-count--none"}>
                      {ranking.candidates.length > 0 ? `${ranking.candidates.length} ${ranking.candidates.length === 1 ? "option" : "options"}` : "No match"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {noSupply > 0 && (
              <Link to="/buyer/demands?status=open" className="ph-match-more-unmatched">
                {noSupply} {noSupply === 1 ? "demand has" : "demands have"} no matching supply <ArrowRight size={14} />
              </Link>
            )}
          </aside>
        </div>
      ) : (
        <p className="ph-match-hero-empty">
          {open.length === 0 ? "Every demand is sourced. " : "Farmora keeps checking new batches against your open demands. "}
          <Link to="/buyer/supply">Browse the market</Link> or <Link to="/buyer/demands/new">post a demand</Link>.
        </p>
      )}
    </section>
  );
}
