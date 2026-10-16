import { useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, CircleCheck, PackageSearch } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { CriteriaChips, CriteriaList } from "./sections/Criteria";
import { ReservedNotice, type Reservation } from "./sections/ReservedNotice";
import { DemandStatusPill, DemandSteps, FulfilmentBar } from "./sections/Fulfilment";
import { ReserveControl, SupplyPair } from "./sections/SupplyPair";
import { OrderRow } from "./sections/OrderRow";
import { fulfilmentOf, openOf, rankSupply } from "./data/demands";
import { useBuyer } from "./data/buyerContext";
import { sortOrders } from "./data/orders";
import { formatDayInText, formatKg } from "../Producer/data/format";

/** Keyed by id so notices and open panels reset when moving between demands. */
export default function DemandDetailRoute() {
  const { id } = useParams();
  return <DemandDetailPage key={id} id={id} />;
}

function DemandDetailPage({ id }: { id?: string }) {
  const { demands, allocations, supply, reserve } = useBuyer();
  const [openWhy, setOpenWhy] = useState<string | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const [helpAsked, setHelpAsked] = useState(false);
  const [notice, setNotice] = useState<Reservation | null>(null);
  const [released, setReleased] = useState<string | null>(null);
  const demand = demands.find((item) => item.id === id);

  if (!demand) {
    return (
      <main className="ph-main">
        <Link to="/buyer/demands" className="ph-back"><ArrowLeft size={16} /> All demands</Link>
        <p className="ph-empty">Demand {id} was not found.</p>
      </main>
    );
  }

  const fulfilment = fulfilmentOf(demand, allocations);
  const ranking = rankSupply(demand, supply, fulfilment.openKg);
  const offers = fulfilment.parts.filter((part) => part.stage === "offered").length;

  return (
    <main className="ph-main">
      <Link to="/buyer/demands" className="ph-back">
        <ArrowLeft size={16} /> All demands
      </Link>

      <section className="ph-match-hero bu-detail-hero" aria-labelledby="demand-title">
        <div className="ph-match-hero-head">
          <div>
            <p className="ph-match-hero-eyebrow">Demand {demand.id}</p>
            <h1 id="demand-title" className="ph-mp-title">
              {formatKg(demand.quantityKg)} {demand.product.toLowerCase()}
            </h1>
            <p className="ph-match-hero-sub">
              {demand.gradeWanted} · needed by {formatDayInText(demand.neededByDay)} · to {demand.destination}
              {demand.note && <> · “{demand.note}”</>}
            </p>
          </div>
          <DemandStatusPill status={fulfilment.status} />
        </div>

        <div className="bu-detail-progress">
          <FulfilmentBar quantityKg={demand.quantityKg} fulfilment={fulfilment} />
          <DemandSteps status={fulfilment.status} />
        </div>
      </section>

      {notice && <ReservedNotice key={notice.allocationId} reservation={notice} onClose={() => setNotice(null)} />}
      {released && !notice && (
        <p className="bu-notice" role="status">
          <CircleCheck size={16} /> {released}
        </p>
      )}

      <section className="ph-card bu-sources" id="sources" aria-labelledby="sources-title">
        <div className="ph-section-head">
          <div>
            <h2 id="sources-title">Orders for this demand</h2>
            <p className="ph-section-sub">
              {offers > 0
                ? `${offers === 1 ? "A producer has" : `${offers} producers have`} offered supply: accept to confirm. `
                : ""}
              Reservations wait for the producer; an order counts once both sides agree.
            </p>
          </div>
          <Link to="/buyer/orders" className="ph-link-btn">
            All orders <ArrowRight size={14} />
          </Link>
        </div>
        {fulfilment.parts.length === 0 ? (
          <p className="ph-muted">No orders yet. Reserve a batch from the suggestions below, or wait for a producer's offer.</p>
        ) : (
          <ul className="ord-list">
            {sortOrders(fulfilment.parts).map((part) => (
              <OrderRow
                key={part.id}
                order={part}
                onReleased={(order) => {
                  setNotice(null);
                  setReleased(`Released ${formatKg(order.kg)} of ${order.batchCode} back to the market.`);
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="bu-suggest" aria-labelledby="suggest-title">
        <div className="ph-section-head">
          <div>
            <h2 id="suggest-title">Suggested supply</h2>
            <p className="ph-section-sub">
              {fulfilment.openKg === 0
                ? "Nothing left to source for this demand."
                : `Batches that can cover the ${formatKg(fulfilment.openKg)} still open, best match first.`}
            </p>
          </div>
          <Link to={`/buyer/supply?product=${encodeURIComponent(demand.product)}`} className="ph-link-btn">
            Browse all {demand.product.toLowerCase()} <ArrowRight size={14} />
          </Link>
        </div>

        {fulfilment.openKg === 0 ? (
          <p className="ph-card ph-muted bu-done-note">
            <CircleCheck size={16} /> {fulfilment.heldKg > 0 ? "Fully sourced once the producers confirm your reservations." : "This demand is fully sourced."}
          </p>
        ) : ranking.candidates.length === 0 ? (
          <div className="ph-card bu-nomatch">
            <PackageSearch size={22} />
            <div>
              <p className="bu-nomatch-title">No batch fits yet</p>
              <p className="ph-muted">{ranking.reason}</p>
            </div>
            {helpAsked ? (
              <span className="ph-offered"><CircleCheck size={16} /> A coordinator will look for supply</span>
            ) : (
              <button type="button" className="ph-btn" onClick={() => setHelpAsked(true)}>Ask a coordinator</button>
            )}
          </div>
        ) : (
          <ul className="ph-mp-list">
            {ranking.candidates.map((candidate, index) => {
              const code = candidate.batch.code;
              const isOpen = openWhy === code;
              return (
                <li key={code} className={isOpen ? "ph-mp-card ph-mp-card--open" : "ph-mp-card"}>
                  {index === 0 && <p className="bu-best-tag">Best match</p>}
                  <SupplyPair demand={demand} openKg={fulfilment.openKg} candidate={candidate} ringSize={80} />
                  <div className="ph-mp-foot">
                    <CriteriaChips criteria={candidate.criteria} />
                    <div className="ph-mp-actions">
                      <button type="button" className="ph-link-btn" aria-expanded={isOpen} onClick={() => setOpenWhy(isOpen ? null : code)}>
                        {isOpen ? "Hide details" : "See why"} <ChevronDown size={14} className={isOpen ? "ph-flip" : undefined} />
                      </button>
                      <ReserveControl
                        key={`${code}-${fulfilment.openKg}-${openOf(candidate.batch)}`}
                        batch={candidate.batch}
                        openKg={fulfilment.openKg}
                        onReserve={(kg) => {
                          const allocationId = reserve(demand.id, code, kg);
                          if (allocationId) {
                            setReleased(null);
                            setNotice({ allocationId, demandId: demand.id, batchCode: code, producer: candidate.batch.producer, product: candidate.batch.product, kg });
                          }
                        }}
                      />
                    </div>
                  </div>
                  {isOpen && (
                    <div className="ph-mp-details bu-why">
                      <CriteriaList criteria={candidate.criteria} />
                      <p className="ph-muted">
                        {candidate.batch.producer}, {candidate.batch.region}. Harvest {formatDayInText(candidate.batch.harvestDay)}, {candidate.batch.plot.toLowerCase()}.
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {ranking.rejected.length > 0 && fulfilment.openKg > 0 && (
          <div className="bu-rejected">
            <button type="button" className="ph-link-btn" aria-expanded={showRejected} onClick={() => setShowRejected((value) => !value)}>
              {ranking.rejected.length} {ranking.rejected.length === 1 ? "batch was" : "batches were"} considered but do not fit{" "}
              <ChevronDown size={14} className={showRejected ? "ph-flip" : undefined} />
            </button>
            {showRejected && (
              <ul>
                {ranking.rejected.map((candidate) => (
                  <li key={candidate.batch.code}>
                    <strong>{candidate.batch.code}</strong> · {candidate.batch.producer}, grade {candidate.batch.grade}
                    <small>{candidate.criteria.find((criterion) => criterion.state === "fail")?.detail}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
