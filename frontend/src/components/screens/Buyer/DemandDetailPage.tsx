// One demand through its lifecycle (B3.1 §9.1): draft → published → closed → under evaluation →
// awarded, or cancelled / no proposal. Each stage shows only what the buyer can do at that stage.
import { useState } from "react";
import { ArrowLeft, BadgeCheck, CalendarDays, MapPin, Package, Pencil, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PartyLink } from "@/components/parties/PartyLink";
import { AWARD_ALLOCATION_LABEL, CRITERIA_LABEL, DEMAND_LABEL, GRADE_LABEL } from "./model/catalog";
import { cancelDemand, closeDemandEarly, reopenDemand, startEvaluation, useBuyerData } from "./model/store";
import { formatDateRange, formatDateTime, fromLocalInput, toLocalInput } from "./model/time";
import type { Demand } from "./model/types";
import type { Errors } from "./model/validation";
import { EvaluationBoard } from "./sections/Evaluation";
import { PublishPanel } from "./sections/PublishPanel";
import { Facts, Field, FormError, GateNote, History, PageHead, Pill, ReasonDialog, Steps, TimeLeft } from "./ui/parts";
import { kg, perKg, useVerified, vnd } from "./ui/format";
import { AWARD_TONE, DEMAND_TONE } from "./ui/tones";
import { ProductIcon } from "./ui/ProductIcon";

const STEPS = ["Draft", "Receiving proposals", "Closed", "Evaluation", "Awarded"];
const STEP_OF: Record<Demand["status"], number> = { DRAFT: 0, PUBLISHED: 1, CLOSED: 2, UNDER_EVALUATION: 3, AWARDED: 5, CANCELLED: 1, NO_PROPOSAL: 2 };

/** The demand at a glance: product, three key figures, where it goes, who may propose, and how bids are scored. */
function Requirements({ demand }: { demand: Demand }) {
  const [place, ...rest] = demand.deliveryLocation.split(",");
  const extras = [
    ["Quality notes", demand.qualityNotes],
    ["Budget (only you see it)", demand.budget ? vnd(demand.budget) : undefined],
    ["Commercial terms", demand.commercialTerms],
    ["Other requirements", demand.additionalRequirements],
  ].filter(([, value]) => value) as [string, string][];

  return (
    <section className="ph-card bf-sticky rq">
      <div className="rq-head">
        <ProductIcon crop={demand.crop} size={44} />
        <div>
          <p className="rq-eyebrow">Requirements</p>
          <h2>
            {demand.crop}
            {demand.variety && <span> · {demand.variety}</span>}
          </h2>
        </div>
      </div>
      {demand.productDescription && <p className="rq-desc">{demand.productDescription}</p>}

      <div className="rq-stats">
        <div>
          <Package size={15} aria-hidden="true" />
          <small>Quantity</small>
          <strong>{kg(demand.quantity)}</strong>
        </div>
        <div>
          <BadgeCheck size={15} aria-hidden="true" />
          <small>Quality</small>
          <strong>{demand.qualityStandard ? GRADE_LABEL[demand.qualityStandard] : "Any"}</strong>
        </div>
        <div>
          <CalendarDays size={15} aria-hidden="true" />
          <small>Delivery</small>
          <strong>{formatDateRange(demand.deliveryFrom, demand.deliveryTo).replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun) /g, "")}</strong>
        </div>
      </div>

      <div className="rq-place">
        <MapPin size={16} aria-hidden="true" />
        <span>
          <strong>{place}</strong>
          {rest.length > 0 && <small>{rest.join(",").trim()}</small>}
        </span>
      </div>

      <div className="rq-tags">
        <span className="rq-tag">
          <Users size={13} aria-hidden="true" />
          {demand.scope && demand.scope.kind !== "ALL" ? `Suppliers in ${demand.scope.regions.join(", ")}` : "All verified suppliers"}
        </span>
        {demand.requiredCertifications.map((cert) => (
          <span key={cert} className="rq-tag rq-tag--cert">
            <BadgeCheck size={13} aria-hidden="true" />
            {cert}
          </span>
        ))}
      </div>

      {demand.criteria.length > 0 && (
        <div className="rq-criteria">
          <small>How proposals are scored</small>
          {demand.criteria.map((item) => (
            <div key={item.type} className="rq-crit">
              <span>{CRITERIA_LABEL[item.type]}</span>
              <span className="rq-crit-bar" aria-hidden="true">
                <i style={{ width: `${item.weight}%` }} />
              </span>
              <strong>{item.weight}%</strong>
            </div>
          ))}
        </div>
      )}

      {extras.length > 0 && <Facts items={extras} />}
    </section>
  );
}

function ReopenForm({ demand }: { demand: Demand }) {
  const [deadline, setDeadline] = useState(() => toLocalInput(Date.now() + 86_400_000));
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  return (
    <details className="bf-reopen">
      <summary>Reopen submissions</summary>
      <div className="bf-grid">
        <Field label="New deadline" error={errors.deadline}>
          <input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        </Field>
        <Field label="Reason" error={errors.reason}>
          <input value={reason} onChange={(event) => setReason(event.target.value)} />
        </Field>
      </div>
      <FormError errors={errors} />
      <button
        type="button"
        className="ph-btn"
        onClick={() => {
          const result = reopenDemand(demand.code, fromLocalInput(deadline), reason);
          setErrors(result.ok ? {} : result.errors);
        }}
      >
        Reopen
      </button>
    </details>
  );
}

export default function DemandDetailPage() {
  const { code } = useParams();
  const data = useBuyerData();
  const verified = useVerified();
  const [dialog, setDialog] = useState<"close" | "cancel" | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const demand = data.demands.find((item) => item.code === code);

  if (!demand) {
    return (
      <main className="ph-main">
        <Link to="/buyer/demands" className="ph-back">
          <ArrowLeft size={16} /> Demands
        </Link>
        <p className="ph-empty">Demand {code} was not found.</p>
      </main>
    );
  }

  const proposals = data.proposals.filter((item) => item.demandCode === demand.code);
  const live = proposals.filter((item) => item.status === "SUBMITTED").length;
  const allocations = data.awardAllocations.filter((item) => item.demandCode === demand.code);
  const declined = allocations.some((item) => item.status === "DECLINED");
  const replaceable = proposals.some((item) => item.status === "NOT_SELECTED");
  const cancellable = ["DRAFT", "PUBLISHED", "CLOSED", "UNDER_EVALUATION"].includes(demand.status);
  const similar = new URLSearchParams({ crop: demand.crop, ...(demand.variety ? { variety: demand.variety } : {}) }).toString();

  return (
    <main className="ph-main bf-page">
      <Link to="/buyer/demands" className="ph-back">
        <ArrowLeft size={16} /> Demands
      </Link>
      <PageHead
        eyebrow={`Demand ${demand.code}`}
        title={demand.title ?? `${kg(demand.quantity)} ${demand.crop.toLowerCase()}`}
        summary={`${kg(demand.quantity)} ${demand.crop.toLowerCase()}${demand.variety ? ` (${demand.variety})` : ""} · deliver ${formatDateRange(demand.deliveryFrom, demand.deliveryTo)}`}
        actions={<Pill tone={DEMAND_TONE[demand.status]}>{DEMAND_LABEL[demand.status]}</Pill>}
      />
      <section className="ph-card bf-verify">
        <Steps steps={STEPS} current={STEP_OF[demand.status]} stopped={demand.status === "CANCELLED" ? "Cancelled" : demand.status === "NO_PROPOSAL" ? "No proposals" : undefined} />
      </section>

      <div className="bf-columns">
        <div className="bf-col-main">
          {demand.status === "DRAFT" && (
            <>
              <section className="ph-card bf-section bf-actions">
                <span className="ph-muted">Only you can see a draft. Edit it as much as you like, then publish.</span>
                <Link to={`/buyer/demands/${demand.code}/edit`} className="ph-btn">
                  <Pencil size={15} /> Edit draft
                </Link>
              </section>
              <PublishPanel demand={demand} />
            </>
          )}

          {demand.status === "PUBLISHED" && (
            <section className="ph-card bf-section">
              <h2>Receiving proposals</h2>
              <p className="bf-big">
                {live} proposal{live === 1 ? "" : "s"} so far · closes in <TimeLeft until={demand.submissionDeadline!} /> ({formatDateTime(demand.submissionDeadline!)})
              </p>
              <p className="ph-muted">
                Suppliers can still change or withdraw their proposals until the deadline, so you compare them once submissions close. Suppliers never see each other's proposals.
              </p>
              <GateNote />
              <div className="bf-actions">
                <button type="button" className="ph-btn" onClick={() => setDialog("close")}>
                  Close early
                </button>
              </div>
            </section>
          )}

          {demand.status === "CLOSED" && (
            <section className="ph-card bf-section">
              <h2>Submissions closed</h2>
              <p className="bf-big">
                {live} proposal{live === 1 ? "" : "s"} to evaluate
              </p>
              <p className="ph-muted">
                Closed {demand.closedAt && formatDateTime(demand.closedAt)}
                {demand.closeReason && ` · ${demand.closeReason}`}. Proposals are locked: suppliers can no longer change or withdraw them.
              </p>
              <FormError errors={errors} />
              <div className="bf-actions">
                <button
                  type="button"
                  className="ph-btn ph-btn--primary"
                  onClick={() => {
                    const result = startEvaluation(demand.code);
                    setErrors(result.ok ? {} : result.errors);
                  }}
                >
                  Start evaluation
                </button>
              </div>
              <ReopenForm demand={demand} />
            </section>
          )}

          {demand.status === "UNDER_EVALUATION" && <EvaluationBoard demand={demand} />}

          {demand.status === "AWARDED" && (
            <section className="ph-card bf-section">
              <h2>Award</h2>
              <p className="ph-muted">Each chosen supplier confirms they can deliver on the agreed terms. A confirmed one becomes a transaction, then a term sheet.</p>
              <ul className="bf-rows">
                {allocations.map((allocation) => {
                  const transaction = data.transactions.find((item) => item.sourceRef === allocation.id);
                  return (
                    <li key={allocation.id} className="bf-row bf-row--static">
                      <span>
                        <strong>
                          <PartyLink name={allocation.supplier} role="producer" /> · {kg(allocation.quantity)} at {perKg(allocation.price)}
                          {allocation.negotiated && <small> (negotiated)</small>}
                        </strong>
                        <small>
                          {allocation.proposalCode} · lot {allocation.lotCode} · {vnd(allocation.quantity * allocation.price)}
                          {allocation.status === "PENDING_SUPPLIER_CONFIRMATION" && (
                            <>
                              {" "}
                              · answer due in <TimeLeft until={allocation.deadline} />
                            </>
                          )}
                          {allocation.declineReason && ` · “${allocation.declineReason}”`}
                        </small>
                      </span>
                      {transaction ? (
                        <Link to={`/buyer/transactions/${transaction.code}`} className="ph-link-btn">
                          {transaction.code}
                        </Link>
                      ) : (
                        <Pill tone={AWARD_TONE[allocation.status]}>{AWARD_ALLOCATION_LABEL[allocation.status]}</Pill>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {demand.status === "AWARDED" && declined && replaceable && verified && <EvaluationBoard demand={demand} adding />}

          {(demand.status === "NO_PROPOSAL" || demand.status === "CANCELLED") && (
            <section className="ph-card bf-section">
              <h2>{demand.status === "NO_PROPOSAL" ? "No supplier sent a proposal" : "Demand cancelled"}</h2>
              {demand.cancelReason && <p className="ph-muted">Reason: {demand.cancelReason}</p>}
              <div className="bf-actions">
                <Link to={`/buyer/demands/new?${similar}`} className="ph-btn ph-btn--primary">
                  Post a similar demand
                </Link>
                <Link to={`/buyer/orders/new?${similar}`} className="ph-btn">
                  Place a buy order instead
                </Link>
              </div>
            </section>
          )}

          {cancellable && (
            <p className="bf-actions bf-actions--end">
              <button type="button" className="ph-text-btn" onClick={() => setDialog("cancel")}>
                Cancel this demand
              </button>
            </p>
          )}

          <History entries={demand.history} />
        </div>

        <aside className="bf-col-side">
          <Requirements demand={demand} />
        </aside>
      </div>

      <ReasonDialog
        open={dialog === "close"}
        title="Close submissions early?"
        text={live > 0 ? `You will evaluate the ${live} proposal${live === 1 ? "" : "s"} received so far. Suppliers can no longer send or change proposals.` : "No proposal has arrived yet: the demand ends without proposals."}
        confirmLabel="Close now"
        onClose={() => setDialog(null)}
        onConfirm={(reason) => {
          const result = closeDemandEarly(demand.code, reason);
          return result.ok ? null : result.errors;
        }}
      />
      <ReasonDialog
        open={dialog === "cancel"}
        title={`Cancel ${demand.code}?`}
        text={proposals.length ? "Every supplier that sent a proposal is told, and all proposals are marked not selected." : "The demand is withdrawn."}
        confirmLabel="Cancel demand"
        danger
        onClose={() => setDialog(null)}
        onConfirm={(reason) => {
          const result = cancelDemand(demand.code, reason);
          return result.ok ? null : result.errors;
        }}
      />
    </main>
  );
}
