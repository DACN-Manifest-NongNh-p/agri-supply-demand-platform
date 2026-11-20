// B3.1.5 + B3.1.6: compare proposals (manually or by weighted criteria), negotiate, select one or
// more and confirm the award. Totals against the demand are shown for reference only: Farmora never
// allocates quantity nor blocks a total above or below the demand (FR-B3.1-27, FR-B3.1-28).
import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { PartyLink } from "@/components/parties/PartyLink";
import { CRITERIA_LABEL, PROPOSAL_LABEL } from "../model/catalog";
import { SCORE_RULES, scoreProposals } from "../model/evaluation";
import { confirmAward, useBuyerData } from "../model/store";
import { formatDate } from "../model/time";
import type { CriteriaType, Demand, Proposal } from "../model/types";
import type { Errors } from "../model/validation";
import { ConfirmFacts, FormError, GateNote, Pill, ReasonDialog, Tabs } from "../ui/parts";
import { kg, perKg, useVerified, vnd } from "../ui/format";
import { PROPOSAL_TONE } from "../ui/tones";
import { Negotiation } from "./Negotiation";

type Sort = "rank" | "price" | "quantity" | "delivery" | "supplier";

export function ProposalDetails({ proposal }: { proposal: Proposal }) {
  const data = useBuyerData();
  const lot = data.lots.find((item) => item.code === proposal.lotCode);
  return (
    <div className="bf-proposal-details">
      <dl className="bf-facts bf-facts--grid">
        <div>
          <dt>Supply lot</dt>
          <dd>
            <Link to={`/buyer/market/${proposal.lotCode}`}>{proposal.lotCode}</Link>
            {lot && ` · ${lot.region}${lot.puc ? ` · ${lot.puc}` : ""}`}
          </dd>
        </div>
        <div>
          <dt>Quality</dt>
          <dd>{proposal.qualityDescription}</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>
            {formatDate(proposal.deliveryDate)} · {proposal.deliveryMethod}
          </dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>{proposal.evidence.length ? proposal.evidence.map((item) => `${item.type}: ${item.name}`).join(", ") : "None attached"}</dd>
        </div>
        {proposal.additionalTerms && (
          <div>
            <dt>Supplier's terms</dt>
            <dd>{proposal.additionalTerms}</dd>
          </div>
        )}
        {proposal.agreed.terms && (
          <div>
            <dt>Agreed terms</dt>
            <dd>{proposal.agreed.terms}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export function EvaluationBoard({ demand, adding = false }: { demand: Demand; adding?: boolean }) {
  const data = useBuyerData();
  const verified = useVerified();
  const [mode, setMode] = useState<"manual" | "criteria">(demand.criteria.length ? "criteria" : "manual");
  const [sort, setSort] = useState<Sort>(demand.criteria.length ? "rank" : "price");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [confirming, setConfirming] = useState(false);
  // Criteria may also be set while evaluating (B3.1.5 B) when none were published.
  const [localCriteria, setLocalCriteria] = useState(
    demand.criteria.length
      ? demand.criteria
      : [
          { type: "PRICE" as CriteriaType, weight: 50 },
          { type: "QUALITY" as CriteriaType, weight: 30 },
          { type: "DELIVERY_TIME" as CriteriaType, weight: 20 },
        ],
  );
  const criteria = demand.criteria.length ? demand.criteria : localCriteria;
  const weightTotal = criteria.reduce((sum, item) => sum + item.weight, 0);

  const all = data.proposals.filter((item) => item.demandCode === demand.code);
  const eligibleStatus = adding ? "NOT_SELECTED" : "UNDER_REVIEW";
  const valid = all.filter((item) => item.status === eligibleStatus);
  const others = all.filter((item) => item.status !== eligibleStatus && !(adding && item.status === "SELECTED"));
  const scores = scoreProposals({ ...demand, criteria }, valid, data.lots);
  const scoreOf = (code: string) => scores.find((item) => item.proposal.code === code);
  const rows = [...valid].sort((a, b) => {
    if (sort === "rank") return (scoreOf(a.code)?.rank ?? 0) - (scoreOf(b.code)?.rank ?? 0);
    if (sort === "price") return a.agreed.price - b.agreed.price;
    if (sort === "quantity") return b.agreed.quantity - a.agreed.quantity;
    if (sort === "delivery") return a.deliveryDate.localeCompare(b.deliveryDate);
    return a.supplier.localeCompare(b.supplier);
  });
  const chosen = valid.filter((item) => selected.includes(item.code));
  const totalKg = chosen.reduce((sum, item) => sum + item.agreed.quantity, 0);
  const totalValue = chosen.reduce((sum, item) => sum + item.agreed.quantity * item.agreed.price, 0);
  const alreadyKg = adding ? data.awardAllocations.filter((item) => item.demandCode === demand.code && item.status !== "DECLINED").reduce((sum, item) => sum + item.quantity, 0) : 0;
  const best = scores[0]?.proposal.code;

  const header = (key: Sort, label: string, className?: string) => (
    <th className={className}>
      <button type="button" className={sort === key ? "bf-sort is-on" : "bf-sort"} onClick={() => setSort(key)}>
        {label}
      </button>
    </th>
  );

  return (
    <section className="ph-card bf-section bf-evaluation" aria-labelledby="eval-title">
      <div className="ph-section-head">
        <div>
          <h2 id="eval-title">{adding ? "Choose a replacement" : "Compare and choose"}</h2>
          <p className="ph-section-sub">
            {adding ? "A supplier declined. Add another valid proposal from this demand." : "Select one or more proposals. Ranking is advice; the decision is yours."}
          </p>
        </div>
        <Tabs
          label="How to compare"
          value={mode}
          onChange={(value) => {
            setMode(value);
            setSort(value === "criteria" ? "rank" : "price");
          }}
          tabs={[
            { id: "manual", label: "Compare myself" },
            { id: "criteria", label: "Score by criteria" },
          ]}
        />
      </div>

      {mode === "criteria" && (
        <div className="bf-criteria-note">
          {demand.criteria.length ? (
            <p className="ph-muted">Weights published with the demand: {criteria.map((item) => `${CRITERIA_LABEL[item.type]} ${item.weight}%`).join(" · ")}.</p>
          ) : (
            <div className="bf-weights">
              {localCriteria.map((item, index) => (
                <label key={item.type} className="ph-field">
                  <span>{CRITERIA_LABEL[item.type]}</span>
                  <span className="bf-suffix">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.weight}
                      onChange={(event) => setLocalCriteria(localCriteria.map((entry, at) => (at === index ? { ...entry, weight: Number(event.target.value) } : entry)))}
                    />
                    %
                  </span>
                </label>
              ))}
              <p className={weightTotal === 100 ? "bf-hint" : "bf-error"}>Total {weightTotal}%</p>
            </div>
          )}
          <details>
            <summary>How each criterion is scored</summary>
            <ul>
              {criteria.map((item) => (
                <li key={item.type}>
                  <strong>{CRITERIA_LABEL[item.type]}:</strong> {SCORE_RULES[item.type]}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {valid.length === 0 ? (
        <p className="ph-empty">No proposal can be selected.</p>
      ) : (
        <div className="ph-table-scroll">
          <table className="bf-table bf-compare">
            <thead>
              <tr>
                <th aria-label="Select" />
                {mode === "criteria" && header("rank", "Score")}
                {header("supplier", "Supplier")}
                {header("quantity", "Quantity", "bf-num")}
                {header("price", "Price", "bf-num")}
                <th>Quality</th>
                {header("delivery", "Delivery")}
                <th aria-label="Details" />
              </tr>
            </thead>
            <tbody>
              {rows.map((proposal) => {
                const score = scoreOf(proposal.code);
                const negotiated = proposal.agreed.price !== proposal.unitPrice || proposal.agreed.quantity !== proposal.quantity;
                const pending = proposal.negotiations.find((round) => round.status === "PENDING");
                const isOpen = open === proposal.code;
                return (
                  <Fragment key={proposal.code}>
                    <tr className={selected.includes(proposal.code) ? "is-selected" : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${proposal.code}`}
                          checked={selected.includes(proposal.code)}
                          onChange={() => setSelected(selected.includes(proposal.code) ? selected.filter((code) => code !== proposal.code) : [...selected, proposal.code])}
                        />
                      </td>
                      {mode === "criteria" && (
                        <td>
                          <strong>{score?.total ?? "—"}</strong>
                          <small className="bf-block">
                            #{score?.rank}
                            {proposal.code === best && " · best"}
                          </small>
                        </td>
                      )}
                      <td>
                        <PartyLink name={proposal.supplier} role="producer" />
                        <small className="bf-block">{proposal.code}</small>
                      </td>
                      <td className="bf-num">
                        {kg(proposal.agreed.quantity)}
                        {proposal.agreed.quantity !== proposal.quantity && <s className="bf-block">{kg(proposal.quantity)}</s>}
                      </td>
                      <td className="bf-num">
                        <strong>{perKg(proposal.agreed.price)}</strong>
                        {negotiated && proposal.agreed.price !== proposal.unitPrice && <s className="bf-block">{perKg(proposal.unitPrice)}</s>}
                      </td>
                      <td>
                        <Pill tone={proposal.qualityEvidence === "DOCUMENT_VERIFIED" ? "good" : "neutral"}>{proposal.qualityEvidence === "DOCUMENT_VERIFIED" ? "Document-verified" : "Self-declared"}</Pill>
                      </td>
                      <td>{formatDate(proposal.deliveryDate)}</td>
                      <td>
                        <button type="button" className="ph-link-btn" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : proposal.code)}>
                          {pending ? (pending.by === "SUPPLIER" ? "Counter to answer" : "Waiting") : "Details"} <ChevronDown size={14} className={isOpen ? "ph-flip" : undefined} />
                        </button>
                        {errors[proposal.code] && <small className="bf-error bf-block">{errors[proposal.code]}</small>}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bf-expand">
                        <td colSpan={mode === "criteria" ? 8 : 7}>
                          <ProposalDetails proposal={proposal} />
                          {mode === "criteria" && score && (
                            <p className="ph-muted">
                              Scores: {Object.entries(score.scores).map(([type, value]) => `${CRITERIA_LABEL[type as CriteriaType]} ${value}`).join(" · ")}
                            </p>
                          )}
                          {!adding && <Negotiation proposal={proposal} canNegotiate={verified} />}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {others.length > 0 && (
        <details className="bf-others">
          <summary>
            {others.length} proposal{others.length === 1 ? "" : "s"} that cannot be selected
          </summary>
          <ul>
            {others.map((proposal) => (
              <li key={proposal.code}>
                <strong>{proposal.code}</strong> · {proposal.supplier} · {kg(proposal.quantity)} at {perKg(proposal.unitPrice)} <Pill tone={PROPOSAL_TONE[proposal.status]}>{PROPOSAL_LABEL[proposal.status]}</Pill>
                {proposal.invalidReason && <small className="bf-block">{proposal.invalidReason}</small>}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="bf-award-bar">
        <div>
          <strong>
            {chosen.length} selected · {kg(totalKg + alreadyKg)} of {kg(demand.quantity)} needed
          </strong>
          <span className="ph-muted">
            Value {vnd(totalValue)}.{" "}
            {totalKg + alreadyKg > demand.quantity ? "More than the demand: allowed, your choice." : totalKg + alreadyKg < demand.quantity && chosen.length ? "Less than the demand: allowed, your choice." : ""}
          </span>
        </div>
        <GateNote />
        <FormError errors={errors} />
        <button
          type="button"
          className="ph-btn ph-btn--primary"
          disabled={!verified || chosen.length === 0}
          onClick={() => setConfirming(true)}
        >
          {adding ? "Add to award" : "Confirm award"}
        </button>
        <ReasonDialog
          open={confirming}
          noReason
          title={adding ? `Add ${chosen.length} supplier${chosen.length === 1 ? "" : "s"} to the award?` : `Award ${demand.code} to ${chosen.length} supplier${chosen.length === 1 ? "" : "s"}?`}
          text="The selected suppliers are asked to confirm. Suppliers not selected are told when the award is final."
          confirmLabel={adding ? "Yes, add" : "Yes, award"}
          extra={
            <ConfirmFacts
              rows={[
                ["Suppliers", String(chosen.length)],
                ["Quantity", `${kg(totalKg)}${alreadyKg ? ` (+ ${kg(alreadyKg)} already awarded)` : ""}`],
                ["Total value", <strong key="v">{vnd(totalValue)}</strong>],
              ]}
            />
          }
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            const result = confirmAward(demand.code, selected);
            setErrors(result.ok ? {} : result.errors);
            return result.ok ? null : result.errors;
          }}
        />
      </div>
    </section>
  );
}
