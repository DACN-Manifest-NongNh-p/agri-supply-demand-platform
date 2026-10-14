import { Fragment, useState } from "react";
import { ArrowLeft, Check, ChevronDown, CircleCheck, Info, Minus, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { MatchScore } from "./sections/MatchScore";
import { OfferTracker } from "./sections/OfferTracker";
import { demands, producer } from "./data/mockProducer";
import { matchAll, type CriterionState, type MatchResult } from "./data/matching";
import { formatDay, formatKg } from "./data/format";
import { useProducer } from "./data/producerContext";

type View = "all" | "matched" | "unmatched";

const VIEWS: { id: View; label: string }[] = [
  { id: "all", label: "All" },
  { id: "matched", label: "Matched" },
  { id: "unmatched", label: "No match" },
];

const CRITERION_ICON: Record<CriterionState, typeof Check> = { pass: Check, partial: Minus, fail: X };

export default function MarketDemandPage() {
  const { batches, offers, offer, offerLog } = useProducer();
  // Links from the home page can pre-open a match (?open=D-551) or pre-filter (?view=unmatched).
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<View>(() => VIEWS.find((option) => option.id === searchParams.get("view"))?.id ?? "all");
  const [product, setProduct] = useState("All");
  const [openId, setOpenId] = useState<string | null>(() => searchParams.get("open"));
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [helpAsked, setHelpAsked] = useState<Record<string, boolean>>({});

  const matches = matchAll(demands, batches);
  const matchedCount = matches.filter((match) => match.best).length;
  const visible = matches.filter(
    (match) =>
      (product === "All" || match.demand.product === product) &&
      (view === "all" || (view === "matched" ? Boolean(match.best) : !match.best)),
  );

  return (
    <main className="ph-main">
      <Link to="/producer" className="ph-back">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Market demand</p>
          <h1>Matching opportunities</h1>
          <p className="ph-hello-summary">
            {demands.length} open demands for what you grow · {matchedCount} matched to your batches ·{" "}
            {demands.length - matchedCount} without a suitable batch
          </p>
        </div>
      </section>

      <section className="ph-card" aria-label="Match list">
        <div className="ph-cal-toolbar">
          <div className="ph-segmented" role="group" aria-label="Show">
            {VIEWS.map((option) => (
              <button key={option.id} type="button" aria-pressed={view === option.id} onClick={() => setView(option.id)}>
                {option.label}
              </button>
            ))}
          </div>
          <div className="ph-chips" role="group" aria-label="Filter by product">
            {["All", ...producer.products].map((item) => (
              <button
                key={item}
                type="button"
                className={product === item ? "ph-chip ph-chip--active" : "ph-chip"}
                aria-pressed={product === item}
                onClick={() => setProduct(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <p className="ph-match-note">
          <Info size={14} /> Farmora matches open buyer demand against the batches you have declared. Review a match, then offer the batch if it works for you.
        </p>

        <div className="ph-table-scroll">
          <table className="ph-match-table">
            <thead>
              <tr>
                <th scope="col">Buyer</th>
                <th scope="col">Demand</th>
                <th scope="col" className="ph-num">Required</th>
                <th scope="col">Needed by</th>
                <th scope="col">Matched batch</th>
                <th scope="col">Match</th>
                <th scope="col"><span className="ph-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="ph-empty">Nothing here for this filter.</td>
                </tr>
              )}
              {visible.map((match) => {
                const { demand, best } = match;
                const isOpen = openId === demand.id;
                const offered = offers[demand.id];
                return (
                  <Fragment key={demand.id}>
                    <tr className={isOpen ? "ph-match-tr ph-match-tr--open" : "ph-match-tr"}>
                      <td>
                        <strong>{demand.buyer}</strong>
                        <small>{demand.buyerType}</small>
                      </td>
                      <td>
                        {demand.product}
                        <small>{demand.gradeWanted}</small>
                      </td>
                      <td className="ph-num">{formatKg(demand.quantityKg)}</td>
                      <td>{formatDay(demand.neededByDay)}</td>
                      <td>
                        {best ? (
                          <>
                            {best.batch.code}
                            <small>{formatKg(best.batch.quantityKg - best.batch.allocatedKg)} open</small>
                          </>
                        ) : (
                          <span className="ph-muted">—</span>
                        )}
                      </td>
                      <td>{best ? <MatchScore score={best.score} /> : <span className="ph-match-none">No match</span>}</td>
                      <td>
                        <div className="ph-row-actions">
                          {offered ? (
                            <span className="ph-offered"><CircleCheck size={16} /> Offered {offered}</span>
                          ) : best ? (
                            <button type="button" className="ph-btn ph-btn--primary" onClick={() => offer(demand.id, best.batch.code)}>
                              Offer batch
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="ph-btn ph-btn--icon"
                            aria-expanded={isOpen}
                            aria-label={`${isOpen ? "Hide" : "View"} match details for ${demand.buyer}`}
                            onClick={() => setOpenId(isOpen ? null : demand.id)}
                          >
                            <ChevronDown size={16} className={isOpen ? "ph-flip" : undefined} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="ph-match-details-row">
                        <td colSpan={7}>
                          <MatchDetails
                            match={match}
                            offered={offered}
                            chosen={chosen[demand.id] ?? best?.batch.code}
                            onChoose={(code) => setChosen((current) => ({ ...current, [demand.id]: code }))}
                            onOffer={(code) => offer(demand.id, code)}
                            helpAsked={Boolean(helpAsked[demand.id])}
                            onAskHelp={() => setHelpAsked((current) => ({ ...current, [demand.id]: true }))}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <OfferTracker offers={offerLog} />
    </main>
  );
}

type DetailsProps = {
  match: MatchResult;
  offered?: string;
  chosen?: string;
  onChoose: (code: string) => void;
  onOffer: (code: string) => void;
  helpAsked: boolean;
  onAskHelp: () => void;
};

function MatchDetails({ match, offered, chosen, onChoose, onOffer, helpAsked, onAskHelp }: DetailsProps) {
  const { demand, considered, reason } = match;
  const focus = considered.find((candidate) => candidate.batch.code === chosen) ?? considered[0];

  return (
    <div className="ph-match-details">
      <div>
        <h3 className="ph-details-title">
          {focus ? <>How {focus.batch.code} fits this demand</> : "No batch to compare"}
        </h3>
        {focus ? (
          <ul className="ph-criteria">
            {focus.criteria.map((criterion) => {
              const Icon = CRITERION_ICON[criterion.state];
              return (
                <li key={criterion.name} className={`ph-criterion ph-criterion--${criterion.state}`}>
                  <span className="ph-criterion-icon"><Icon size={14} strokeWidth={2.5} /></span>
                  <strong>{criterion.name}</strong>
                  <span>{criterion.detail}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="ph-muted">{reason}</p>
        )}
        {demand.note && <p className="ph-demand-note">Buyer note: “{demand.note}”</p>}
      </div>

      <div>
        <h3 className="ph-details-title">Batches considered</h3>
        {considered.length === 0 ? (
          <p className="ph-muted">You have no {demand.product.toLowerCase()} batches yet.</p>
        ) : (
          <ul className="ph-considered">
            {considered.map((candidate) => (
              <li key={candidate.batch.code}>
                <label className={candidate.eligible ? "" : "ph-considered--off"}>
                  <input
                    type="radio"
                    name={`batch-${demand.id}`}
                    checked={candidate.batch.code === focus?.batch.code}
                    onChange={() => onChoose(candidate.batch.code)}
                  />
                  <span>
                    <strong>{candidate.batch.code}</strong> · {candidate.batch.variety}, grade {candidate.batch.grade}
                    <small>
                      {candidate.eligible
                        ? `${Math.round(candidate.coverage * 100)}% of the quantity`
                        : candidate.criteria.find((criterion) => criterion.state === "fail")?.detail}
                    </small>
                  </span>
                  {candidate.eligible ? <MatchScore score={candidate.score} /> : <span className="ph-match-none">Not eligible</span>}
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="ph-details-actions">
          {offered ? (
            <span className="ph-offered"><CircleCheck size={16} /> Offered {offered} · waiting for the buyer</span>
          ) : focus?.eligible ? (
            <button type="button" className="ph-btn ph-btn--primary" onClick={() => onOffer(focus.batch.code)}>
              Offer {focus.batch.code}
            </button>
          ) : match.best ? (
            <span className="ph-muted">Pick an eligible batch to offer it.</span>
          ) : helpAsked ? (
            <span className="ph-offered"><CircleCheck size={16} /> A coordinator will look for options</span>
          ) : (
            <button type="button" className="ph-btn" onClick={onAskHelp}>
              Ask a coordinator for help
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
