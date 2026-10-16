import { useEffect, useState } from "react";
import { ArrowLeft, Check, Info } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ShelfLifeBar } from "@/components/freshness/ShelfLifeBar";
import { formatKg, formatVnd } from "../Producer/data/format";
import { useCoordinator } from "./data/coordinatorContext";
import { DetailLink } from "./sections/DetailDrawer";
import { KIND_LABEL, PARTNERS, marketPrice, partnerPrice, type Proposal } from "./data/rescue";

const REJECT_REASONS = ["Price too low", "Quality not suitable for this buyer", "The producer prefers to wait for a buyer", "Already handled outside Farmora"];

const when = (at: number) => new Date(at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** The same ring as a match score; red for spoilage risk, green for how much of an order a combine covers. */
function Ring({ value, label, tone }: { value: number; label: string; tone: "high" | "watch" | "low" | "good" }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className={`ph-ring co-rescue-ring co-rescue-ring--${tone}`} style={{ width: 76, height: 76 }} role="img" aria-label={`${value} ${label}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ph-ring-track" cx="50" cy="50" r={radius} />
        <circle className="ph-ring-value" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - Math.min(100, value) / 100)} />
      </svg>
      <span className="ph-ring-label">
        <strong>{tone === "good" ? `${value}%` : value}</strong>
        <small>{label}</small>
      </span>
    </div>
  );
}

/** One proposal, laid out like a match to decide: the batch (or demand), the score, the proposed buyer, why, and the decision. */
function ProposalCard({ proposal }: { proposal: Proposal }) {
  const { market, approveRescue, rejectRescue } = useCoordinator();
  const [mode, setMode] = useState<"view" | "edit" | "reject">("view");
  const [partnerId, setPartnerId] = useState(proposal.partnerId);
  const [kgs, setKgs] = useState<Record<string, number>>(() => Object.fromEntries(proposal.parts.map((part) => [part.batchCode, part.kg])));
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [note, setNote] = useState("");

  const combine = proposal.kind === "combine";
  const partner = PARTNERS.find((item) => item.id === partnerId);
  const kg = proposal.parts.reduce((sum, part) => sum + (kgs[part.batchCode] ?? 0), 0);
  const price = partner ? partnerPrice(partner, proposal.product) : proposal.pricePerKg;
  const share = Math.round((price / marketPrice(proposal.product)) * 100);
  const edited = partnerId !== proposal.partnerId || proposal.parts.some((part) => kgs[part.batchCode] !== part.kg);
  const batch = market.find((item) => item.code === proposal.parts[0]?.batchCode);
  const risk = proposal.risk ?? 0;
  const tone = risk >= 70 ? "high" : risk >= 40 ? "watch" : "low";
  const covered = combine && proposal.needKg ? Math.round((kg / proposal.needKg) * 100) : 0;
  // One line: what triggered it and why this option.
  const why = combine
    ? "No single batch is big enough for this order."
    : [proposal.cause ? proposal.cause.charAt(0).toUpperCase() + proposal.cause.slice(1) : undefined, proposal.checks[0]?.toLowerCase()].filter(Boolean).join(" · ");
  const approve = () =>
    approveRescue(proposal, { partnerId, parts: proposal.parts.map((part) => ({ batchCode: part.batchCode, kg: kgs[part.batchCode] ?? 0 })) });

  return (
    <article id={`proposal-${proposal.id}`} className="ph-card co-match">
      <div className="co-match-pair">
        {combine ? (
          <div className="co-match-side">
            <p className="co-kicker">
              Demand <DetailLink kind="demand" id={proposal.demandId!}>{proposal.demandId}</DetailLink>
            </p>
            <h3>
              <DetailLink kind="demand" id={proposal.demandId!}>{proposal.buyer}</DetailLink>
            </h3>
            <p className="co-match-qty">
              {formatKg(proposal.needKg ?? kg)} {proposal.product.toLowerCase()}
            </p>
          </div>
        ) : (
          <div className="co-match-side">
            <p className="co-kicker">
              At-risk batch {batch && <DetailLink kind="batch" id={batch.code}>{batch.code}</DetailLink>}
            </p>
            <h3>{batch ? <DetailLink kind="batch" id={batch.code}>{batch.producer}</DetailLink> : null}</h3>
            <p className="co-match-qty">
              {formatKg(kg)} {proposal.product.toLowerCase()}
            </p>
            {batch && <ShelfLifeBar batch={batch} />}
          </div>
        )}

        <div className="co-match-score">
          {combine ? <Ring value={covered} label="of order" tone="good" /> : <Ring value={risk} label="risk" tone={tone} />}
        </div>

        {combine ? (
          <div className="co-match-side">
            <p className="co-kicker">Combine {proposal.parts.length} farms</p>
            <h3>{formatKg(kg)} combined</h3>
            <ul className="co-rescue-parts">
              {proposal.parts.map((part) => (
                <li key={part.batchCode}>
                  {part.batchCode} · {part.producer} <span className="ph-muted">{formatKg(kgs[part.batchCode] ?? part.kg)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="co-match-side">
            <p className="co-kicker">{KIND_LABEL[partner?.kind ?? proposal.kind]}</p>
            <h3>{partner?.name}</h3>
            <p className="co-match-qty">
              {formatVnd(price)}/kg <span className="ph-muted">· {share}% of value</span>
            </p>
            <p className="ph-muted">Pickup {partner && partner.pickupDays <= 1 ? "tomorrow" : `in ${partner?.pickupDays} days`}</p>
          </div>
        )}
      </div>

      {why && (
        <p className="co-rescue-why">
          <Info size={14} aria-hidden="true" /> {why}
        </p>
      )}

      {mode === "edit" && (
        <div className="co-rescue-edit">
          {proposal.options && proposal.options.length > 1 && (
            <label>
              Sell to
              <select value={partnerId} onChange={(event) => setPartnerId(event.target.value)}>
                {proposal.options.map((id) => {
                  const option = PARTNERS.find((item) => item.id === id)!;
                  return (
                    <option key={id} value={id}>
                      {option.name} ({option.use}) · {formatVnd(partnerPrice(option, proposal.product))}/kg
                    </option>
                  );
                })}
              </select>
            </label>
          )}
          {proposal.parts.map((part) => (
            <label key={part.batchCode}>
              {part.batchCode} · {part.producer}, kg (up to {formatKg(part.maxKg)})
              <input
                type="number"
                min={0}
                max={part.maxKg}
                step={50}
                value={kgs[part.batchCode] ?? 0}
                onChange={(event) => setKgs((current) => ({ ...current, [part.batchCode]: Math.max(0, Math.min(part.maxKg, Number(event.target.value) || 0)) }))}
              />
            </label>
          ))}
        </div>
      )}

      {mode === "reject" ? (
        <div className="co-rescue-edit">
          <label>
            Why not?
            <select value={reason} onChange={(event) => setReason(event.target.value)}>
              {REJECT_REASONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Note for the record (optional)
            <input value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <div className="co-match-actions">
            <button type="button" className="ph-btn" onClick={() => rejectRescue(proposal, note.trim() ? `${reason}: ${note.trim()}` : reason)}>
              Reject proposal
            </button>
            <button type="button" className="ph-link-btn" onClick={() => setMode("view")}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="co-match-actions">
          <button type="button" className="ph-btn ph-btn--primary" disabled={kg <= 0} onClick={approve}>
            <Check size={16} /> {edited ? "Approve as edited" : `Approve ${formatKg(kg)}`}
          </button>
          <button type="button" className="ph-link-btn co-push-right" aria-expanded={mode === "edit"} onClick={() => setMode(mode === "edit" ? "view" : "edit")}>
            {mode === "edit" ? "Done" : "Edit"}
          </button>
          <button type="button" className="ph-link-btn" onClick={() => setMode("reject")}>
            Reject
          </button>
        </div>
      )}
    </article>
  );
}

/**
 * Human-in-the-loop rescue: the system proposes what to do with batches at risk and with big demands
 * no single batch covers; the coordinator approves, edits or rejects. Approving is what creates holds
 * or a sale and sends the transport request.
 */
export default function RescuePage() {
  const { proposals, rescueDecisions } = useCoordinator();
  const location = useLocation();
  const decided = Object.entries(rescueDecisions).sort((a, b) => b[1].at - a[1].at);

  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [location.hash]);

  return (
    <main className="ph-main co-narrow">
      <Link to="/coordinator" className="ph-back">
        <ArrowLeft size={16} /> Back to overview
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Rescue</p>
          <h1>Proposals to decide</h1>
          <p className="ph-hello-summary">The system proposes. Nothing happens until you approve.</p>
        </div>
      </section>

      {proposals.length === 0 ? (
        <p className="ph-card ph-empty">No proposals right now. They appear when a batch is at risk or a big demand needs several farms.</p>
      ) : (
        <div className="co-rescue-stack">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <section className="ph-card co-rescue-done" aria-labelledby="decided-title">
          <div className="ph-section-head">
            <h2 id="decided-title">Decided today</h2>
          </div>
          <ul className="co-requests co-requests--flush">
            {decided.map(([id, decision]) => (
              <li key={id} className="co-request">
                <div className="co-request-head">
                  <span className="co-request-kind">
                    {KIND_LABEL[decision.kind]} · {decision.status === "approved" ? "approved" : "rejected"} at {when(decision.at)}
                  </span>
                </div>
                <p className="co-request-subject">{decision.title}</p>
                {decision.status === "approved" ? (
                  <p className="co-done">
                    <Check size={14} aria-hidden="true" /> {decision.summary}
                  </p>
                ) : (
                  <p className="co-request-detail">Rejected: {decision.reason}.</p>
                )}
                {decision.status === "approved" && decision.kind === "combine" && (
                  <Link to="/coordinator/matching?tab=holds" className="ph-link-btn">
                    See the holds
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
