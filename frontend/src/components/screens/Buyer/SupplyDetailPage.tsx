import { useState } from "react";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { MatchScore } from "../Producer/sections/MatchScore";
import { PhotoGallery } from "../Producer/sections/BatchPhotos";
import { formatDay, formatDayInText, formatKg } from "../Producer/data/format";
import { CriteriaChips } from "./sections/Criteria";
import { ProducerBadge, ProducerCard } from "./sections/ProducerTrust";
import { ReserveDialog } from "./sections/ReserveDialog";
import { fulfilmentOf, openOf, scoreSupply } from "./data/demands";
import { ALLOCATION_STAGE_LABEL } from "./data/mockBuyer";
import { useBuyer } from "./data/buyerContext";

/** One market batch as a buyer sees it: photos, facts, producer, and how it fits each open demand. */
export default function SupplyDetailPage() {
  const { code } = useParams();
  const { supply, demands, allocations } = useBuyer();
  const [reserving, setReserving] = useState(false);
  const batch = supply.find((item) => item.code === code);

  if (!batch) {
    return (
      <main className="ph-main">
        <Link to="/buyer/supply" className="ph-back"><ArrowLeft size={16} /> All supply</Link>
        <p className="ph-empty">Batch {code} was not found.</p>
      </main>
    );
  }

  const open = openOf(batch);
  const name = `${batch.code}, ${batch.product} ${batch.variety}`;
  const yours = allocations.filter((allocation) => allocation.batchCode === batch.code);
  const fits = demands
    .filter((demand) => demand.product === batch.product)
    .map((demand) => {
      const fulfilment = fulfilmentOf(demand, allocations);
      return { demand, fulfilment, candidate: scoreSupply(demand, batch, fulfilment.openKg) };
    })
    .filter(({ fulfilment }) => fulfilment.openKg > 0)
    .sort((a, b) => Number(b.candidate.eligible) - Number(a.candidate.eligible) || b.candidate.score - a.candidate.score);
  const moreFromProducer = supply.filter(
    (item) => item.producer === batch.producer && item.code !== batch.code && openOf(item) > 0 && item.status !== "delivered" && item.status !== "in_transit",
  );
  const canReserve = open > 0 && fits.some(({ candidate }) => candidate.eligible);

  return (
    <main className="ph-main">
      <Link to="/buyer/supply" className="ph-back">
        <ArrowLeft size={16} /> All supply
      </Link>

      <section className="ph-card bu-batch" aria-labelledby="batch-title">
        <PhotoGallery photos={batch.photos} alt={name} />

        <div className="bu-batch-info">
          <div className="bu-supply-top">
            <span className={`ph-status-pill bu-ready bu-ready--${batch.readyDay <= 0 ? "now" : "later"}`}>
              {batch.readyDay <= 0 ? "Ready now" : `Ready ${formatDay(batch.readyDay)}`}
            </span>
            <span className="bu-grade">{batch.code} · Grade {batch.grade}</span>
          </div>

          <h1 id="batch-title" className="bu-batch-title">
            {batch.product} <span>· {batch.variety}</span>
          </h1>

          <p className="bu-batch-qty">
            {formatKg(open)} <small>available of {formatKg(batch.quantityKg)}</small>
          </p>

          {batch.issue && (
            <p className="bu-batch-issue">
              <TriangleAlert size={16} /> {batch.issue}
            </p>
          )}

          <dl className="bu-batch-facts">
            <div><dt>Harvest</dt><dd>{formatDay(batch.harvestDay)}</dd></div>
            <div><dt>Ready to ship</dt><dd>{formatDay(batch.readyDay)}</dd></div>
            <div><dt>Sell by</dt><dd>{formatDay(batch.sellByDay)}</dd></div>
            <div><dt>Plot</dt><dd>{batch.plot}</dd></div>
          </dl>

          <p className="bu-batch-by">
            by <a href="#producer-title">{batch.producer}</a> <ProducerBadge name={batch.producer} />
          </p>

          <div className="bu-batch-actions">
            <button type="button" className="ph-btn ph-btn--primary ph-btn--large" disabled={!canReserve} onClick={() => setReserving(true)}>
              Reserve
            </button>
            <span className="ph-muted">
              {open === 0
                ? "Fully allocated; nothing left to reserve."
                : canReserve
                  ? "Held for 24 hours while the producer confirms."
                  : `None of your open ${batch.product.toLowerCase()} demands fits this batch.`}
            </span>
          </div>
        </div>
      </section>

      <div className="bu-batch-columns">
        <div className="bu-batch-main">
          {yours.length > 0 && (
            <section className="ph-card" aria-labelledby="yours-title">
              <div className="ph-section-head">
                <h2 id="yours-title">Already yours</h2>
              </div>
              <ul className="bu-batch-yours">
                {yours.map((allocation) => (
                  <li key={allocation.id}>
                    <span>{formatKg(allocation.kg)}</span>
                    <span>for <Link to={`/buyer/demands/${allocation.demandId}`}>{allocation.demandId}</Link></span>
                    <span className="ph-status-pill">{ALLOCATION_STAGE_LABEL[allocation.stage]}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="ph-card" aria-labelledby="fits-title">
            <div className="ph-section-head">
              <div>
                <h2 id="fits-title">How it fits your demands</h2>
                <p className="ph-section-sub">Your open {batch.product.toLowerCase()} demands, scored against this batch.</p>
              </div>
            </div>

            {fits.length === 0 ? (
              <p className="ph-muted">
                You have no open {batch.product.toLowerCase()} demand.{" "}
                <Link to="/buyer/demands?new=1">Post a demand</Link> to get matched.
              </p>
            ) : (
              <ul className="bu-batch-fits">
                {fits.map(({ demand, fulfilment, candidate }) => (
                  <li key={demand.id}>
                    <div className="bu-batch-fit-head">
                      <span>
                        <Link to={`/buyer/demands/${demand.id}`}>{demand.id}</Link>
                        <span className="ph-muted">
                          {" "}· {formatKg(fulfilment.openKg)} still open · {demand.gradeWanted} · needed by {formatDayInText(demand.neededByDay)}
                        </span>
                      </span>
                      {candidate.eligible ? <MatchScore score={candidate.score} /> : <span className="ph-match-none">Does not fit</span>}
                    </div>
                    <CriteriaChips criteria={candidate.criteria} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {moreFromProducer.length > 0 && (
            <section className="ph-card" aria-labelledby="more-title">
              <div className="ph-section-head">
                <h2 id="more-title">More from this producer</h2>
              </div>
              <ul className="bu-batch-more">
                {moreFromProducer.map((item) => (
                  <li key={item.code}>
                    <Link to={`/buyer/supply/${item.code}`}>
                      {item.code} · {item.product} · {item.variety}, grade {item.grade}
                    </Link>
                    <span className="ph-muted">
                      {formatKg(openOf(item))} · {item.readyDay <= 0 ? "ready now" : `ready ${formatDayInText(item.readyDay)}`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="bu-batch-side">
          <ProducerCard name={batch.producer} region={batch.region} distanceKm={batch.distanceKm} />
        </aside>
      </div>

      {reserving && <ReserveDialog batch={batch} onClose={() => setReserving(false)} />}
    </main>
  );
}
