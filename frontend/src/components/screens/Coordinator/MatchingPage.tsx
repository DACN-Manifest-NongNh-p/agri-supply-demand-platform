import { useState } from "react";
import { RULES } from "@/lib/site";
import { ArrowLeft, ArrowRight, Check, ShieldAlert, TriangleAlert } from "lucide-react";
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
            Demand {demand.id} · needed by {formatDayInText(demand.neededByDay)}
          </p>
          <h3>{demand.buyer}</h3>
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
            {candidate === row.best ? "Proposed" : "Chosen"} batch {batch.code} · {batch.readyDay <= 0 ? "ready now" : `ready ${formatDayInText(batch.readyDay)}`}
          </p>
          <h3>{batch.producer}</h3>
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
                {item.batch.code} · {item.batch.producer}
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
function UnsoldGapRow({ item }: { item: UnsoldBatch }) {
  const { batch, openKg, reason } = item;
  return (
    <li id={`batch-${batch.code}`}>
      <p className="co-gap-head">
        <span>
          {batch.code} · {batch.producer}
        </span>
        <span>{formatKg(openKg)}</span>
      </p>
      <p className="ph-muted">
        {batch.product} {batch.variety}, grade {batch.grade} · <span className={batch.sellByDay <= 1 ? "co-low" : undefined}>{sellsBy(batch.sellByDay)}</span>
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
    </li>
  );
}

function Gaps({ rows }: { rows: BoardRow[] }) {
  const { market, notified, notifyProducers } = useCoordinator();
  const unsold = unsoldSupply(rows, market);
  const soon = unsold.filter((item) => item.soon);
  const later = unsold.filter((item) => !item.soon);
  const missing = rows.filter((row) => !row.best);

  return (
    <div className="co-gaps">
      <section className="ph-card" aria-labelledby="missing-title">
        <div className="ph-section-head">
          <div>
            <h2 id="missing-title">Demands with no supply</h2>
            <p className="ph-section-sub">No batch on the market passes every rule.</p>
          </div>
        </div>
        {missing.length === 0 ? (
          <p className="ph-muted">Every open demand has a proposal.</p>
        ) : (
          <ul className="co-gap-list">
            {missing.map(({ demand, fulfilment, reason }) => (
              <li key={demand.id} id={`demand-${demand.id}`}>
                <p className="co-gap-head">
                  <span>{demand.id} · {demand.buyer}</span>
                  <span>{formatKg(fulfilment.openKg)} {demand.product.toLowerCase()}</span>
                </p>
                <p className="ph-muted">
                  {demand.gradeWanted} · needed by {formatDayInText(demand.neededByDay)}
                </p>
                <p className="co-gap-reason">{reason}</p>
                {notified[demand.id] ? (
                  <p className="co-done">
                    <Check size={14} aria-hidden="true" /> Producers asked to declare {demand.product.toLowerCase()}
                  </p>
                ) : (
                  <button type="button" className="ph-btn" onClick={() => notifyProducers(demand.id)}>
                    Ask producers for supply
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ph-card" aria-labelledby="idle-list-title">
        <div className="ph-section-head">
          <div>
            <h2 id="idle-list-title">Unsold supply</h2>
            <p className="ph-section-sub">
              Open kilograms nobody has bought. Anything selling within {RULES.sellSoonDays} days comes first, whatever the reason.
            </p>
          </div>
        </div>
        {unsold.length === 0 ? (
          <p className="ph-muted">Every open batch is held or has a buyer in sight.</p>
        ) : (
          <>
            {soon.length > 0 && (
              <>
                <p className="co-unsold-group co-unsold-group--soon">Selling within {RULES.sellSoonDays} days</p>
                <ul className="co-gap-list">
                  {soon.map((item) => (
                    <UnsoldGapRow key={item.batch.code} item={item} />
                  ))}
                </ul>
              </>
            )}
            {later.length > 0 && (
              <>
                <p className="co-unsold-group">No buyer, more time</p>
                <ul className="co-gap-list">
                  {later.map((item) => (
                    <UnsoldGapRow key={item.batch.code} item={item} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>
    </div>
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
                    <td>{allocation.batchCode}</td>
                    <td>{allocation.producer}</td>
                    <td>
                      {allocation.demandId}
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
