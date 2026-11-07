import { useState } from "react";
import { RULES } from "@/lib/site";
import { ArrowLeft, ArrowRight, Check, LayoutGrid, List, Search, ShieldAlert, TriangleAlert } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { MatchScore, ScoreRing } from "../Producer/sections/MatchScore";
import { formatDay, formatDayInText, formatKg } from "../Producer/data/format";
import { CriteriaChips } from "../Buyer/sections/Criteria";
import { ProducerBadge } from "../Buyer/sections/ProducerTrust";
import { openOf, type SupplyCandidate } from "../Buyer/data/demands";
import {
  contestedBatches,
  exceptionsFor,
  needsDecision,
  unsoldSupply,
  type BoardRow,
  type UnsoldBatch,
} from "./data/market";
import { useCoordinator } from "./data/coordinatorContext";
import { DetailLink } from "./sections/DetailDrawer";
import { RiskBadge, ShelfLifeBar } from "@/components/freshness/ShelfLifeBar";
import { DemandGapResolver, SupplyGapResolver } from "./sections/GapResolver";
import { ACTION_LABEL } from "./data/coordinatorContext";
import { PartyLink } from "@/components/parties/PartyLink";
import { buyerCity, provinceOf } from "./data/places";

type Tab = "decide" | "gaps" | "holds";

function MatchCard({ row, rivals, focused }: { row: BoardRow; rivals: BoardRow[]; focused: boolean }) {
  const { approve, verifiedProducers } = useCoordinator();
  const [showOthers, setShowOthers] = useState(false);
  const [chosen, setChosen] = useState<SupplyCandidate | undefined>(undefined);
  const { demand, fulfilment } = row;
  // A picked alternative stays chosen only while it is still eligible.
  const candidate = (chosen && row.alternatives.find((item) => item.batch.code === chosen.batch.code)) ?? row.best!;
  const batch = candidate.batch;
  const kg = Math.min(fulfilment.openKg, openOf(batch));
  const rivalsHere = candidate === row.best ? rivals : [];
  const exceptions = candidate === row.best ? row.exceptions : exceptionsFor(demand, candidate, fulfilment.openKg, { verified: new Set(verifiedProducers) });

  return (
    <article id={`demand-${demand.id}`} className={focused ? "ph-card co-match co-match--focus" : "ph-card co-match"}>
      <div className="co-match-pair">
        <div className="co-match-side">
          <p className="co-kicker">
            Demand <DetailLink kind="demand" id={demand.id}>{demand.id}</DetailLink> · needed by {formatDayInText(demand.neededByDay)}
          </p>
          <h3>
            <DetailLink kind="demand" id={demand.id}>{demand.buyer}</DetailLink>
          </h3>
          <p className="co-match-qty">
            {formatKg(fulfilment.openKg)} {demand.product.toLowerCase()} <span className="ph-muted">open of {formatKg(demand.quantityKg)} · {demand.gradeWanted}</span>
          </p>
          <p className="ph-muted">{demand.destination}</p>
          {demand.note && <p className="co-match-note">{demand.note}</p>}
        </div>

        <div className="co-match-score">
          <ScoreRing score={candidate.score} size={76} />
        </div>

        <div className="co-match-side">
          <p className="co-kicker">
            {candidate === row.best ? "Proposed" : "Chosen"} batch <DetailLink kind="batch" id={batch.code}>{batch.code}</DetailLink> ·{" "}
            {batch.readyDay <= 0 ? "ready now" : `ready ${formatDayInText(batch.readyDay)}`}
          </p>
          <h3>
            <DetailLink kind="batch" id={batch.code}>{batch.producer}</DetailLink>
          </h3>
          <p className="co-match-qty">
            {formatKg(openOf(batch))} {batch.variety} <span className="ph-muted">open · grade {batch.grade} · sells by {formatDay(batch.sellByDay)}</span>
          </p>
          <p className="ph-muted">
            {batch.region} · {batch.distanceKm} km
          </p>
          <p className="co-match-trust">
            <ProducerBadge name={batch.producer} />
          </p>
        </div>
      </div>

      {exceptions.length > 0 && (
        <div className="co-match-why">
          <p>
            <ShieldAlert size={15} aria-hidden="true" /> Why this needs you
          </p>
          <ul>
            {exceptions.map((item) => (
              <li key={item.code}>{item.text}</li>
            ))}
          </ul>
        </div>
      )}

      <CriteriaChips criteria={candidate.criteria} />

      {batch.issue && (
        <p className="co-match-warn">
          <TriangleAlert size={15} aria-hidden="true" /> Producer reported: {batch.issue}
        </p>
      )}
      {rivalsHere.length > 0 && (
        <p className="co-match-warn co-match-warn--soft">
          {batch.code} is also the proposal for {rivalsHere.map((rival) => `${rival.demand.id} (${rival.demand.buyer})`).join(", ")}. Whichever you approve first takes
          it; the other moves to its next best batch.
        </p>
      )}

      <div className="co-match-actions">
        <button type="button" className="ph-btn ph-btn--primary" onClick={() => approve(demand.id, batch.code, kg)}>
          <Check size={16} /> Approve {formatKg(kg)}
        </button>
        <span className="ph-muted">
          Sends it to {batch.producer.split(" ").slice(0, 2).join(" ")}, who has 24 h to confirm.
          {kg < fulfilment.openKg && ` ${formatKg(fulfilment.openKg - kg)} stays open.`}
        </span>
        {row.alternatives.length > 0 && (
          <button type="button" className="ph-link-btn co-push-right" aria-expanded={showOthers} onClick={() => setShowOthers((value) => !value)}>
            {showOthers ? "Hide other batches" : `Other batches (${row.alternatives.length})`}
          </button>
        )}
      </div>

      {showOthers && (
        <ul className="co-alternatives">
          {[row.best!, ...row.alternatives].map((item) => (
            <li key={item.batch.code}>
              <span>
                <DetailLink kind="batch" id={item.batch.code}>{item.batch.code}</DetailLink> · {item.batch.producer}
                <span className="ph-muted"> · grade {item.batch.grade}, {formatKg(openOf(item.batch))} open</span>
              </span>
              <MatchScore score={item.score} />
              {item.batch.code === batch.code ? (
                <span className="ph-muted co-alt-current">Selected</span>
              ) : (
                <button type="button" className="ph-btn" onClick={() => setChosen(item)}>
                  Use this
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function sellsBy(day: number) {
  if (day === 0) return "sells by today";
  if (day === 1) return "sells by tomorrow · 1 day left";
  return `sells by ${formatDayInText(day)} · ${day} days left`;
}

/** One unsold batch: what it is, how long it can still be sold, and why nobody has bought it. */
function UnsoldGapRow({ item, open, onToggle, status }: { item: UnsoldBatch; open: boolean; onToggle: () => void; status?: string }) {
  const { batch, openKg, reason } = item;
  const { excursions, demands } = useCoordinator();
  return (
    <li id={`batch-${batch.code}`} className={open ? "co-gap-open" : undefined}>
      <p className="co-gap-head">
        <span>
          <DetailLink kind="batch" id={batch.code}>{batch.code}</DetailLink> · <PartyLink name={batch.producer} role="producer" />
          {item.soon && <span className="co-unsold-tag co-unsold-tag--soon">Sells soon</span>}
          {status && <span className="co-gap-status">{status}</span>}
        </span>
        <span>{formatKg(openKg)}</span>
      </p>
      <p className="ph-muted">
        {batch.product} {batch.variety}, grade {batch.grade} · {batch.region} · <span className={batch.sellByDay <= 1 ? "co-low" : undefined}>{sellsBy(batch.sellByDay)}</span>
      </p>
      <p className="co-unsold-fresh">
        <ShelfLifeBar batch={batch} compact />
        <RiskBadge batch={{ ...batch, openKg }} excursion={excursions[batch.code]} />
      </p>
      {reason.kind === "no_demand" ? (
        <p className="co-gap-reason">{reason.text}</p>
      ) : (
        <p className="co-gap-reason">
          <span className="co-unsold-tag co-unsold-tag--act">
            {reason.kind === "decision" ? `Fits ${reason.demandId}, needs your decision` : `Fits ${reason.demandId}, not held yet`}
          </span>{" "}
          <Link to={item.to} className="ph-link-btn">
            Open {reason.demandId} <ArrowRight size={14} />
          </Link>
        </p>
      )}
      <button type="button" className={open ? "ph-btn" : "ph-btn ph-btn--primary"} aria-expanded={open} onClick={onToggle}>
        {open ? "Close" : "Find a buyer"}
      </button>
      {open && <SupplyGapResolver batch={batch} openKg={openKg} demands={demands} />}
    </li>
  );
}

function DemandGapRow({ row, open, onToggle, status }: { row: BoardRow; open: boolean; onToggle: () => void; status?: string }) {
  const { notified, notifyProducers } = useCoordinator();
  const { demand, fulfilment, reason } = row;
  return (
    <li id={`demand-${demand.id}`} className={open ? "co-gap-open" : undefined}>
      <p className="co-gap-head">
        <span>
          <DetailLink kind="demand" id={demand.id}>{demand.id}</DetailLink> · <PartyLink name={demand.buyer} role="buyer" />
          {status && <span className="co-gap-status">{status}</span>}
        </span>
        <span>{formatKg(fulfilment.openKg)} {demand.product.toLowerCase()}</span>
      </p>
      <p className="ph-muted">
        {demand.gradeWanted} · needed by {formatDayInText(demand.neededByDay)} · {demand.destination}
      </p>
      <p className="co-gap-reason">{reason}</p>
      <div className="co-gap-buttons">
        <button type="button" className={open ? "ph-btn" : "ph-btn ph-btn--primary"} aria-expanded={open} onClick={onToggle}>
          {open ? "Close" : "Find supply"}
        </button>
        {notified[demand.id] ? (
          <span className="co-done">
            <Check size={14} aria-hidden="true" /> Producers asked to declare {demand.product.toLowerCase()}
          </span>
        ) : (
          <button type="button" className="ph-btn" onClick={() => notifyProducers(demand.id)}>
            Ask all producers
          </button>
        )}
      </div>
      {open && <DemandGapResolver row={row} />}
    </li>
  );
}

type GapItem =
  | { kind: "demand"; key: string; id: string; product: string; party: string; area: string; kg: number; day: number; row: BoardRow }
  | { kind: "supply"; key: string; id: string; product: string; party: string; area: string; kg: number; day: number; item: UnsoldBatch };

type GapSort = "deadline" | "kg" | "product";
const GAP_SORT: Record<GapSort, string> = { deadline: "Most urgent first", kg: "Largest first", product: "Product" };

function Gaps({ rows }: { rows: BoardRow[] }) {
  const { market, gapLog } = useCoordinator();
  const [params, setParams] = useSearchParams();
  const [openKey, setOpenKey] = useState<string | null>(() => {
    const focus = params.get("demand");
    return focus ? `demand:${focus}` : null;
  });
  const unsold = unsoldSupply(rows, market);
  const missing = rows.filter((row) => !row.best);

  const items: GapItem[] = [
    ...missing.map((row): GapItem => ({
      kind: "demand",
      key: `demand:${row.demand.id}`,
      id: row.demand.id,
      product: row.demand.product,
      party: row.demand.buyer,
      area: buyerCity(row.demand.destination).name,
      kg: row.fulfilment.openKg,
      day: row.demand.neededByDay,
      row,
    })),
    ...unsold.map((item): GapItem => ({
      kind: "supply",
      key: `batch:${item.batch.code}`,
      id: item.batch.code,
      product: item.batch.product,
      party: item.batch.producer,
      area: provinceOf(item.batch.region) ?? item.batch.region,
      kg: item.openKg,
      day: item.batch.sellByDay,
      item,
    })),
  ];

  // Filters live in the URL so a link can open the same view.
  const query = params.get("q") ?? "";
  const product = params.get("product") ?? "";
  const area = params.get("area") ?? "";
  const sort: GapSort = (Object.keys(GAP_SORT) as GapSort[]).find((key) => key === params.get("sort")) ?? "deadline";
  const view = params.get("view") === "list" ? "list" : "cards";
  const set = (changes: Record<string, string>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );

  const products = [...new Set(items.map((item) => item.product))].sort();
  const areas = [...new Set(items.map((item) => item.area))].sort();
  const q = query.trim().toLowerCase();
  const shown = items
    .filter((item) => !product || item.product === product)
    .filter((item) => !area || item.area === area)
    .filter((item) => !q || [item.id, item.product, item.party, item.area].some((text) => text.toLowerCase().includes(q)))
    .sort((a, b) => (sort === "kg" ? b.kg - a.kg : sort === "product" ? a.product.localeCompare(b.product) || a.day - b.day : a.day - b.day));
  const demandsShown = shown.filter((item) => item.kind === "demand");
  const supplyShown = shown.filter((item) => item.kind === "supply");

  const statusOf = (key: string) => {
    const last = gapLog[key]?.at(-1);
    return last ? ACTION_LABEL[last.action] : undefined;
  };
  const toggle = (key: string) => setOpenKey((current) => (current === key ? null : key));

  return (
    <div className="co-gaps-wrap">
      <div className="ph-cal-toolbar co-toolbar co-gap-toolbar">
        <label className="ph-search">
          <Search size={15} aria-hidden="true" />
          <input type="search" value={query} placeholder="Search code, product, buyer or producer…" aria-label="Search gaps" onChange={(event) => set({ q: event.target.value })} />
        </label>
        <select value={product} onChange={(event) => set({ product: event.target.value })} aria-label="Product">
          <option value="">All products</option>
          {products.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={area} onChange={(event) => set({ area: event.target.value })} aria-label="Area">
          <option value="">All areas</option>
          {areas.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={sort} onChange={(event) => set({ sort: event.target.value })} aria-label="Sort">
          {(Object.keys(GAP_SORT) as GapSort[]).map((key) => (
            <option key={key} value={key}>
              {GAP_SORT[key]}
            </option>
          ))}
        </select>
        <div className="ph-segmented" role="group" aria-label="View">
          <button type="button" aria-pressed={view === "cards"} onClick={() => set({ view: "" })}>
            <LayoutGrid size={14} /> Cards
          </button>
          <button type="button" aria-pressed={view === "list"} onClick={() => set({ view: "list" })}>
            <List size={14} /> List
          </button>
        </div>
      </div>

      {view === "list" ? (
        <section className="ph-card" aria-label="All gaps">
          {shown.length === 0 ? (
            <p className="ph-muted">Nothing matches these filters.</p>
          ) : (
            <div className="ph-table-scroll">
              <table className="co-table">
                <thead>
                  <tr>
                    <th scope="col">Gap</th>
                    <th scope="col">Item</th>
                    <th scope="col">Buyer / producer</th>
                    <th scope="col">Area</th>
                    <th scope="col" className="co-num">Kilograms</th>
                    <th scope="col">Deadline</th>
                    <th scope="col">Why</th>
                    <th scope="col">Status</th>
                    <th scope="col" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((item) => (
                    <GapTableRow key={item.key} item={item} status={statusOf(item.key)} open={openKey === item.key} onToggle={() => toggle(item.key)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <div className="co-gaps">
          <section className="ph-card" aria-labelledby="missing-title">
            <div className="ph-section-head">
              <div>
                <h2 id="missing-title">Demands with no supply</h2>
                <p className="ph-section-sub">No batch on the market passes every rule. Ask past suppliers first, then producers new to the buyer.</p>
              </div>
            </div>
            {demandsShown.length === 0 ? (
              <p className="ph-muted">{missing.length === 0 ? "Every open demand has a proposal." : "Nothing matches these filters."}</p>
            ) : (
              <ul className="co-gap-list">
                {demandsShown.map((item) =>
                  item.kind === "demand" ? <DemandGapRow key={item.key} row={item.row} open={openKey === item.key} onToggle={() => toggle(item.key)} status={statusOf(item.key)} /> : null,
                )}
              </ul>
            )}
          </section>

          <section className="ph-card" aria-labelledby="idle-list-title">
            <div className="ph-section-head">
              <div>
                <h2 id="idle-list-title">Unsold supply</h2>
                <p className="ph-section-sub">
                  Open kilograms nobody has bought. Anything selling within {RULES.sellSoonDays} days is marked. Offer to past buyers first, or send it to rescue.
                </p>
              </div>
            </div>
            {supplyShown.length === 0 ? (
              <p className="ph-muted">{unsold.length === 0 ? "Every open batch is held or has a buyer in sight." : "Nothing matches these filters."}</p>
            ) : (
              <ul className="co-gap-list">
                {supplyShown.map((item) =>
                  item.kind === "supply" ? <UnsoldGapRow key={item.key} item={item.item} open={openKey === item.key} onToggle={() => toggle(item.key)} status={statusOf(item.key)} /> : null,
                )}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function GapTableRow({ item, status, open, onToggle }: { item: GapItem; status?: string; open: boolean; onToggle: () => void }) {
  const { demands } = useCoordinator();
  const why = item.kind === "demand" ? item.row.reason : item.item.reason.kind === "no_demand" ? item.item.reason.text : `Fits ${item.item.reason.demandId}`;
  return (
    <>
      <tr className={open ? "co-gap-tr is-open" : "co-gap-tr"}>
        <td>
          <span className={item.kind === "demand" ? "co-unsold-tag co-unsold-tag--act" : "co-unsold-tag"}>{item.kind === "demand" ? "No supply" : "Unsold"}</span>
        </td>
        <td>
          <DetailLink kind={item.kind === "demand" ? "demand" : "batch"} id={item.id}>
            {item.id}
          </DetailLink>
          <small className="ph-muted"> {item.product}</small>
        </td>
        <td>
          <PartyLink name={item.party} role={item.kind === "demand" ? "buyer" : "producer"} />
        </td>
        <td>{item.area}</td>
        <td className="co-num">{formatKg(item.kg)}</td>
        <td className={item.day <= 1 ? "co-low" : undefined}>{item.kind === "demand" ? "Needed " : "Sell by "}{formatDayInText(item.day)}</td>
        <td className="co-gap-why">{why}</td>
        <td>{status ?? <span className="ph-muted">Open</span>}</td>
        <td>
          <button type="button" className="ph-link-btn" aria-expanded={open} onClick={onToggle}>
            {open ? "Close" : "Resolve"}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="co-gap-detail">
          <td colSpan={9}>
            {item.kind === "demand" ? <DemandGapResolver row={item.row} /> : <SupplyGapResolver batch={item.item.batch} openKg={item.item.openKg} demands={demands} />}
          </td>
        </tr>
      )}
    </>
  );
}

function Holds() {
  const { allocations, demands, release, extendHold } = useCoordinator();
  const held = allocations
    .filter((allocation) => allocation.stage === "held")
    .sort((a, b) => (a.holdHoursLeft ?? 0) - (b.holdHoursLeft ?? 0));

  return (
    <section className="ph-card" aria-labelledby="holds-title">
      <div className="ph-section-head">
        <div>
          <h2 id="holds-title">Holds waiting on producers</h2>
          <p className="ph-section-sub">
            Most were placed by the system on its own. Nothing to do unless one looks wrong: releasing a hold overrides the match, and the demand moves on to its
            next batch. A hold lapses when its time runs out.
          </p>
        </div>
      </div>
      {held.length === 0 ? (
        <p className="ph-muted">No holds waiting.</p>
      ) : (
        <div className="ph-table-scroll">
          <table className="co-table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Producer</th>
                <th>For</th>
                <th>Matched by</th>
                <th className="co-num">Quantity</th>
                <th className="co-num">Time left</th>
                <th><span className="ph-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {held.map((allocation) => {
                const demand = demands.find((item) => item.id === allocation.demandId);
                const hours = allocation.holdHoursLeft ?? 0;
                return (
                  <tr key={allocation.id}>
                    <td>
                      <DetailLink kind="batch" id={allocation.batchCode}>{allocation.batchCode}</DetailLink>
                    </td>
                    <td>{allocation.producer}</td>
                    <td>
                      <DetailLink kind="demand" id={allocation.demandId}>{allocation.demandId}</DetailLink>
                      <span className="ph-muted"> · {demand?.buyer}</span>
                    </td>
                    <td>
                      {allocation.matchedBy === "system" ? (
                        <span className="co-by co-by--system">System{allocation.score !== undefined && ` · ${allocation.score}%`}</span>
                      ) : allocation.matchedBy === "coordinator" ? (
                        <span className="co-by">You</span>
                      ) : (
                        <span className="ph-muted">Earlier</span>
                      )}
                    </td>
                    <td className="co-num">{formatKg(allocation.kg)}</td>
                    <td className={hours <= 6 ? "co-num co-low" : "co-num"}>{hours} h</td>
                    <td className="co-row-actions">
                      <button type="button" className="ph-btn" onClick={() => extendHold(allocation.id, 12)}>
                        Extend 12 h
                      </button>
                      <button
                        type="button"
                        className="ph-btn"
                        onClick={() => release(allocation.id)}
                        title="Give the quantity back and stop proposing this batch for this demand"
                      >
                        Release
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/**
 * Matching as the coordinator sees it. The system holds clean matches on its own; this page shows
 * the exceptions it would not commit to, the gaps it cannot fill, and the holds it placed.
 */
export default function MatchingPage() {
  const { board, allocations } = useCoordinator();
  const [params, setParams] = useSearchParams();
  const focus = params.get("demand");
  const focusRow = board.find((row) => row.demand.id === focus);
  const requested = params.get("tab");
  const tab: Tab = requested === "gaps" || requested === "holds" ? requested : focusRow && !focusRow.best ? "gaps" : "decide";

  const decide = needsDecision(board);
  const contested = contestedBatches(board);
  const held = allocations.filter((allocation) => allocation.stage === "held");
  const systemHeld = held.filter((allocation) => allocation.matchedBy === "system").length;
  const counts: Record<Tab, number> = {
    decide: decide.length,
    gaps: board.filter((row) => !row.best).length,
    holds: held.length,
  };
  const tabs: { id: Tab; label: string }[] = [
    { id: "decide", label: "Needs your decision" },
    { id: "gaps", label: "Gaps" },
    { id: "holds", label: "Holds" },
  ];

  return (
    <main className="ph-main">
      <Link to="/coordinator" className="ph-back">
        <ArrowLeft size={16} /> Back to overview
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Matching</p>
          <h1>Exceptions to decide</h1>
          <p className="ph-hello-summary">
            The system matches demand and supply on its own and holds every clean match ({systemHeld} {systemHeld === 1 ? "hold" : "holds"} right now). It only
            stops for a person when a match scores under {RULES.autoMatchMinScore}%, is {RULES.signOffKg.toLocaleString("en-US")} kg or more, is for export, or involves
            a reported problem or an unverified producer.
          </p>
        </div>
      </section>

      <div className="ph-cal-toolbar co-toolbar">
        <div className="ph-segmented" role="group" aria-label="Show">
          {tabs.map((option) => (
            <button key={option.id} type="button" aria-pressed={tab === option.id} onClick={() => setParams(option.id === "decide" ? {} : { tab: option.id })}>
              {option.label} <span className="ph-count-badge">{counts[option.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === "decide" &&
        (decide.length === 0 ? (
          <p className="ph-empty">Nothing needs a decision. The system is holding every match it found; exceptions show up here.</p>
        ) : (
          <div className="co-stack">
            {decide.map((row) => (
              <MatchCard
                key={row.demand.id}
                row={row}
                focused={row.demand.id === focus}
                rivals={(contested.get(row.best!.batch.code) ?? []).filter((rival) => rival.demand.id !== row.demand.id)}
              />
            ))}
          </div>
        ))}
      {tab === "gaps" && <Gaps rows={board} />}
      {tab === "holds" && <Holds />}
    </main>
  );
}
