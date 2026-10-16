import { useState } from "react";
import { ArrowLeft, Check, ChevronDown, CircleCheck, Minus, Package, PackageX, Store, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { MatchScore, ScoreRing } from "./sections/MatchScore";
import { demands, producer } from "./data/mockProducer";
import { batchesWithoutBuyer, matchAll, type CriterionState, type MatchResult } from "./data/matching";
import { formatDay, formatKg } from "./data/format";
import { useProducer } from "./data/producerContext";

type View = "all" | "matched" | "unmatched";

const VIEWS: { id: View; label: string }[] = [
  { id: "all", label: "All" },
  { id: "matched", label: "Matched" },
  { id: "unmatched", label: "No buyer yet" },
];

const CRITERION_ICON: Record<CriterionState, typeof Check> = { pass: Check, partial: Minus, fail: X };

export default function MarketDemandPage() {
  const { batches, offers, offer, offerAnswers } = useProducer();
  // Links from the home page can pre-open a match (?open=D-551) or pre-filter (?view=unmatched).
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<View>(() => VIEWS.find((option) => option.id === searchParams.get("view"))?.id ?? "all");
  const [product, setProduct] = useState("All");
  const [openId, setOpenId] = useState<string | null>(() => searchParams.get("open"));
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [helpAsked, setHelpAsked] = useState<Record<string, boolean>>({});

  const matches = matchAll(demands, batches);
  const matched = matches.filter((match) => match.best);
  const sellableKg = matched.reduce((sum, match) => sum + Math.min(match.demand.quantityKg, match.best!.batch.quantityKg - match.best!.batch.allocatedKg), 0);
  const averageScore = matched.length ? Math.round(matched.reduce((sum, match) => sum + match.best!.score, 0) / matched.length) : 0;

  const byProduct = (match: MatchResult) => product === "All" || match.demand.product === product;
  const shownMatched = view === "unmatched" ? [] : matched.filter(byProduct);
  // The producer's "no match" is supply nobody is asking for; demands without a batch are the buyer's side.
  const unsold = batchesWithoutBuyer(demands, batches);
  const shownUnmatched = view === "matched" ? [] : unsold.filter((item) => product === "All" || item.batch.product === product);

  const detailsFor = (match: MatchResult) => (
    <MatchDetails
      match={match}
      offered={offers[match.demand.id]}
      accepted={offerAnswers[match.demand.id] === "confirmed"}
      chosen={chosen[match.demand.id] ?? match.best?.batch.code}
      onChoose={(code) => setChosen((current) => ({ ...current, [match.demand.id]: code }))}
      onOffer={(code) => offer(match.demand.id, code)}
      helpAsked={Boolean(helpAsked[match.demand.id])}
      onAskHelp={() => setHelpAsked((current) => ({ ...current, [match.demand.id]: true }))}
    />
  );

  return (
    <main className="ph-main">
      <Link to="/producer" className="ph-back">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <section className="ph-match-hero ph-mp-hero" aria-labelledby="mp-title">
        <div className="ph-match-hero-head">
          <div>
            <p className="ph-match-hero-eyebrow">Matching</p>
            <h1 id="mp-title" className="ph-mp-title">
              {matched.length} {matched.length === 1 ? "buyer matches" : "buyers match"} your batches
            </h1>
            <p className="ph-match-hero-sub">Farmora checks every open demand against what you have declared. Review a match, then offer the batch.</p>
          </div>
        </div>

        <dl className="ph-mp-stats">
          <div>
            <dt>Open demand</dt>
            <dd>{demands.length}</dd>
          </div>
          <div>
            <dt>Matched</dt>
            <dd>{matched.length}</dd>
          </div>
          <div>
            <dt>You could sell</dt>
            <dd>{formatKg(sellableKg)}</dd>
          </div>
          <div>
            <dt>Average match</dt>
            <dd>{averageScore}%</dd>
          </div>
        </dl>

        <div className="ph-mp-filters">
          <div className="ph-mp-seg" role="group" aria-label="Show">
            {VIEWS.map((option) => (
              <button key={option.id} type="button" aria-pressed={view === option.id} onClick={() => setView(option.id)}>
                {option.label}
              </button>
            ))}
          </div>
          <div className="ph-mp-seg" role="group" aria-label="Filter by product">
            {["All", ...producer.products].map((item) => (
              <button key={item} type="button" aria-pressed={product === item} onClick={() => setProduct(item)}>
                {item === "All" ? "All products" : item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {shownMatched.length > 0 && (
        <ul className="ph-mp-list" aria-label="Matches">
          {shownMatched.map((match) => {
            const { demand, best } = match;
            if (!best) return null;
            const batch = best.batch;
            const offered = offers[demand.id];
            const isOpen = openId === demand.id;
            return (
              <li key={demand.id} className={isOpen ? "ph-mp-card ph-mp-card--open" : "ph-mp-card"}>
                <div className="ph-featured-pair">
                  <div className="ph-featured-side">
                    <p className="ph-featured-kicker"><Store size={14} /> Buyer demand</p>
                    <p className="ph-featured-name">{demand.buyer} <span className="ph-mp-type">{demand.buyerType}</span></p>
                    <p className="ph-featured-big">{formatKg(demand.quantityKg)}</p>
                    <p className="ph-featured-meta">
                      {demand.product} · {demand.gradeWanted}
                      <br />
                      Needed by {formatDay(demand.neededByDay)} · {demand.destination}
                    </p>
                  </div>

                  <div className="ph-featured-link" aria-hidden="true">
                    <span className="ph-featured-line" />
                    <ScoreRing score={best.score} size={80} />
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

                <div className="ph-mp-foot">
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
                  <div className="ph-mp-actions">
                    <button
                      type="button"
                      className="ph-link-btn"
                      aria-expanded={isOpen}
                      onClick={() => setOpenId(isOpen ? null : demand.id)}
                    >
                      {isOpen ? "Hide details" : "See why"} <ChevronDown size={14} className={isOpen ? "ph-flip" : undefined} />
                    </button>
                    {offered ? (
                      <span className="ph-offered">
                        <CircleCheck size={16} /> {offerAnswers[demand.id] === "confirmed" ? "Accepted" : `Offered ${offered}`} ·{" "}
                        <Link to={`/producer/orders#order-OF-${demand.id}`}>View order</Link>
                      </span>
                    ) : (
                      <button type="button" className="ph-btn ph-btn--primary" onClick={() => offer(demand.id, batch.code)}>
                        Offer {batch.code}
                      </button>
                    )}
                  </div>
                </div>

                {isOpen && <div className="ph-mp-details">{detailsFor(match)}</div>}
              </li>
            );
          })}
        </ul>
      )}

      {shownUnmatched.length > 0 && (
        <section className="ph-mp-unmatched" aria-labelledby="mp-unmatched-title">
          <h2 id="mp-unmatched-title">Batches without a buyer</h2>
          <p className="ph-section-sub">Supply no open demand fits yet. Farmora keeps checking new demand; a coordinator can also look for buyers.</p>
          <ul>
            {shownUnmatched.map(({ batch, openKg, reason }) => (
              <li key={batch.code} className="ph-mp-miss">
                <div className="ph-mp-miss-row">
                  <span className="ph-mp-miss-icon"><PackageX size={18} /></span>
                  <div className="ph-mp-miss-main">
                    <p className="ph-mp-miss-title">
                      {batch.code} · {formatKg(openKg)} {batch.product.toLowerCase()} <span className="ph-mp-type">grade {batch.grade}, sell by {formatDay(batch.sellByDay)}</span>
                    </p>
                    <p className="ph-mp-miss-reason">{reason}</p>
                  </div>
                  <div className="ph-mp-actions">
                    <Link to={`/producer/batches?batch=${batch.code}`} className="ph-link-btn">View batch</Link>
                    {helpAsked[batch.code] ? (
                      <span className="ph-offered"><CircleCheck size={16} /> Coordinator notified</span>
                    ) : (
                      <button type="button" className="ph-btn" onClick={() => setHelpAsked((current) => ({ ...current, [batch.code]: true }))}>
                        Find me a buyer
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {shownMatched.length === 0 && shownUnmatched.length === 0 && <p className="ph-empty">Nothing here for this filter.</p>}

    </main>
  );
}

type DetailsProps = {
  match: MatchResult;
  offered?: string;
  accepted: boolean;
  chosen?: string;
  onChoose: (code: string) => void;
  onOffer: (code: string) => void;
  helpAsked: boolean;
  onAskHelp: () => void;
};

function MatchDetails({ match, offered, accepted, chosen, onChoose, onOffer, helpAsked, onAskHelp }: DetailsProps) {
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
            <span className="ph-offered">
              <CircleCheck size={16} /> {accepted ? `Accepted by ${demand.buyer}` : `Offered ${offered} · waiting for the buyer`} ·{" "}
              <Link to={`/producer/orders#order-OF-${demand.id}`}>View order</Link>
            </span>
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
