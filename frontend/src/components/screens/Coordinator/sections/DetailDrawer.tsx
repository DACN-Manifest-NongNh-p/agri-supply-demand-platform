import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { RiskBadge, ShelfLifeBar } from "@/components/freshness/ShelfLifeBar";
import { formatDay, formatKg } from "../../Producer/data/format";
import { MatchScore } from "../../Producer/sections/MatchScore";
import { ProducerBadge } from "../../Buyer/sections/ProducerTrust";
import { fulfilmentOf, openOf } from "../../Buyer/data/demands";
import { ALLOCATION_STAGE_LABEL, type SupplyBatch } from "../../Buyer/data/mockBuyer";
import { UNAVAILABLE, scoreFor, type BoardRow } from "../data/market";
import type { MarketAllocation, MarketDemand } from "../data/mockCoordinator";

/** The URL parameter that opens the drawer: `?detail=demand:D-560` or `?detail=batch:B-107`. */
const PARAM = "detail";

/** Opens the detail drawer for a demand or a batch, keeping the rest of the URL. */
export function DetailLink({ kind, id, children, className }: { kind: "demand" | "batch"; id: string; children: ReactNode; className?: string }) {
  const [params, setParams] = useSearchParams();
  return (
    <button
      type="button"
      className={className ? `co-detail-link ${className}` : "co-detail-link"}
      title={`Open ${kind} ${id}`}
      onClick={() => {
        const next = new URLSearchParams(params);
        next.set(PARAM, `${kind}:${id}`);
        setParams(next);
      }}
    >
      {children}
    </button>
  );
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="co-detail-facts">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DemandDetail({ demand, allocations, market }: { demand: MarketDemand; allocations: MarketAllocation[]; market: SupplyBatch[] }) {
  const fulfilment = fulfilmentOf(demand, allocations);
  const parts = allocations.filter((item) => item.demandId === demand.id);
  const fits = market
    .filter((batch) => batch.product === demand.product && openOf(batch) > 0 && !UNAVAILABLE.includes(batch.status))
    .map((batch) => scoreFor(demand, batch, Math.max(1, fulfilment.openKg)))
    .filter((candidate) => candidate.eligible)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return (
    <>
      <p className="co-kicker">
        Demand {demand.id} · {demand.buyerType}
      </p>
      <h2>{demand.buyer}</h2>
      <p className="co-detail-lead">
        {formatKg(demand.quantityKg)} {demand.product.toLowerCase()} · {demand.gradeWanted}
      </p>

      <Facts
        rows={[
          ["Needed by", formatDay(demand.neededByDay)],
          ["Deliver to", demand.destination],
          ["Covered", `${formatKg(fulfilment.allocatedKg)} confirmed · ${formatKg(fulfilment.heldKg)} on hold`],
          ["Still open", formatKg(fulfilment.openKg)],
          ...(demand.note ? ([["Buyer note", demand.note]] as [string, ReactNode][]) : []),
        ]}
      />

      <h3>Supplied by</h3>
      {parts.length === 0 ? (
        <p className="ph-muted">Nothing held for it yet.</p>
      ) : (
        <ul className="co-detail-list">
          {parts.map((part) => (
            <li key={part.id}>
              <DetailLink kind="batch" id={part.batchCode}>
                {part.batchCode}
              </DetailLink>{" "}
              · {part.producer}
              <span>
                {formatKg(part.kg)} · {ALLOCATION_STAGE_LABEL[part.stage]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3>Batches that fit</h3>
      {fits.length === 0 ? (
        <p className="ph-muted">No open batch fits this demand.</p>
      ) : (
        <ul className="co-detail-list">
          {fits.map((candidate) => (
            <li key={candidate.batch.code}>
              <DetailLink kind="batch" id={candidate.batch.code}>
                {candidate.batch.code}
              </DetailLink>{" "}
              · {candidate.batch.producer}
              <span>
                {formatKg(openOf(candidate.batch))} open <MatchScore score={candidate.score} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function BatchDetail({ batch, allocations, board, excursions }: { batch: SupplyBatch; allocations: MarketAllocation[]; board: BoardRow[]; excursions: Record<string, string> }) {
  const open = openOf(batch);
  const holds = allocations.filter((item) => item.batchCode === batch.code);
  const fits = board
    .map((row) => ({ row, candidate: scoreFor(row.demand, batch, row.fulfilment.openKg) }))
    .filter(({ candidate }) => candidate.eligible)
    .sort((a, b) => b.candidate.score - a.candidate.score)
    .slice(0, 4);

  return (
    <>
      <p className="co-kicker">
        Batch {batch.code} · {batch.plot}
      </p>
      <h2>{batch.producer}</h2>
      <p className="co-detail-lead">
        {formatKg(batch.quantityKg)} {batch.product.toLowerCase()} {batch.variety} · grade {batch.grade}
      </p>
      <p className="co-detail-trust">
        <ProducerBadge name={batch.producer} />
      </p>

      {batch.status !== "delivered" && (
        <div className="co-detail-fresh">
          <ShelfLifeBar batch={batch} />
          {open > 0 && <RiskBadge batch={{ ...batch, openKg: open }} excursion={excursions[batch.code]} />}
        </div>
      )}

      <Facts
        rows={[
          ["Open", `${formatKg(open)} of ${formatKg(batch.quantityKg)}`],
          ["Harvest", formatDay(batch.harvestDay)],
          ["Ready", formatDay(batch.readyDay)],
          ["Sell by", formatDay(batch.sellByDay)],
          ["Farm", `${batch.region} · ${batch.distanceKm} km`],
          ...(batch.issue ? ([["Reported problem", batch.issue]] as [string, ReactNode][]) : []),
        ]}
      />

      <h3>Held for</h3>
      {holds.length === 0 ? (
        <p className="ph-muted">Nobody holds it yet.</p>
      ) : (
        <ul className="co-detail-list">
          {holds.map((hold) => (
            <li key={hold.id}>
              <DetailLink kind="demand" id={hold.demandId}>
                {hold.demandId}
              </DetailLink>
              <span>
                {formatKg(hold.kg)} · {ALLOCATION_STAGE_LABEL[hold.stage]}
                {hold.matchedBy === "system" ? " · by the system" : hold.matchedBy === "coordinator" ? " · by a coordinator" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3>Open demands it fits</h3>
      {fits.length === 0 ? (
        <p className="ph-muted">No open demand accepts it.</p>
      ) : (
        <ul className="co-detail-list">
          {fits.map(({ row, candidate }) => (
            <li key={row.demand.id}>
              <DetailLink kind="demand" id={row.demand.id}>
                {row.demand.id}
              </DetailLink>{" "}
              · {row.demand.buyer}
              <span>
                {formatKg(row.fulfilment.openKg)} open <MatchScore score={candidate.score} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

type Props = {
  demands: MarketDemand[];
  market: SupplyBatch[];
  allocations: MarketAllocation[];
  board: BoardRow[];
  excursions: Record<string, string>;
};

/** Side panel with everything about one demand or batch, opened from any coordinator page via `?detail=`. */
export function DetailDrawer({ demands, market, allocations, board, excursions }: Props) {
  const [params, setParams] = useSearchParams();
  const [kind, id] = (params.get(PARAM) ?? "").split(":");
  const demand = kind === "demand" ? demands.find((item) => item.id === id) : undefined;
  const batch = kind === "batch" ? market.find((item) => item.code === id) : undefined;
  const open = Boolean(demand || batch);

  const close = () => {
    const next = new URLSearchParams(params);
    next.delete(PARAM);
    setParams(next);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const next = new URLSearchParams(window.location.search);
        next.delete(PARAM);
        setParams(next);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setParams]);

  if (!open) return null;

  return (
    <div className="co-detail-backdrop" onClick={close}>
      <aside className="co-detail" role="dialog" aria-modal="true" aria-label={demand ? `Demand ${demand.id}` : `Batch ${batch?.code}`} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="co-detail-close" aria-label="Close" onClick={close}>
          <X size={18} />
        </button>
        {demand && <DemandDetail demand={demand} allocations={allocations} market={market} />}
        {batch && <BatchDetail batch={batch} allocations={allocations} board={board} excursions={excursions} />}
      </aside>
    </div>
  );
}
