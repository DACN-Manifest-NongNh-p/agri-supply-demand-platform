// One match result (B3.3.5): quantity and clearing price are fixed by the session; the buyer
// confirms or rejects before the deadline. Each result stands alone (FR-B3.3-40).
import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { PartyLink } from "@/components/parties/PartyLink";
import { GRADE_LABEL, MATCH_LABEL, SESSION_TYPE_LABEL } from "../model/catalog";
import { confirmMatch, rejectMatch, useBuyerData } from "../model/store";
import { formatDateTime } from "../model/time";
import type { MatchResult, PartyConfirmation } from "../model/types";
import type { Errors } from "../model/validation";
import { ConfirmFacts, FormError, Pill, ReasonDialog, TimeLeft } from "../ui/parts";
import { kg, perKg, vnd } from "../ui/format";
import { MATCH_TONE } from "../ui/tones";

function Side({ label, value }: { label: string; value: PartyConfirmation }) {
  const Icon = value === "CONFIRMED" ? CheckCircle2 : value === "REJECTED" ? XCircle : Circle;
  return (
    <span className={`bf-side bf-side--${value.toLowerCase()}`}>
      <Icon size={14} aria-hidden="true" /> {label}: {value === "PENDING" ? "not yet" : value.toLowerCase()}
    </span>
  );
}

export function MatchCard({ match, showOrder = true }: { match: MatchResult; showOrder?: boolean }) {
  const data = useBuyerData();
  const [rejecting, setRejecting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const open = (match.status === "PENDING_CONFIRMATION" || match.status === "PARTIALLY_CONFIRMED") && match.buyer === "PENDING";
  const session = data.sessions.find((item) => item.code === match.sessionCode);
  const transaction = data.transactions.find((item) => item.sourceRef === match.code);

  return (
    <li className={open ? "ph-card bf-match bf-match--open" : "ph-card bf-match"} id={`match-${match.code}`}>
      <div className="bf-match-top">
        <div>
          <p className="bf-code">
            {match.code}
            {showOrder && (
              <>
                {" · "}
                <Link to={`/buyer/orders/${match.buyOrderCode}`}>{match.buyOrderCode}</Link>
              </>
            )}
            {session && ` · ${SESSION_TYPE_LABEL[session.type]} session, ${formatDateTime(session.scheduled)}`}
          </p>
          <h3>
            {kg(match.quantity)} {match.crop.toLowerCase()} · {match.variety}, {GRADE_LABEL[match.grade]}
          </h3>
          <p className="bf-sub">
            From <PartyLink name={match.supplier} role="producer" />, lot <Link to={`/buyer/market/${match.lotCode}`}>{match.lotCode}</Link>
          </p>
        </div>
        <Pill tone={MATCH_TONE[match.status]}>{MATCH_LABEL[match.status]}</Pill>
      </div>

      <dl className="bf-match-figures">
        <div>
          <dt>Clearing price</dt>
          <dd>{perKg(match.clearingPrice)}</dd>
        </div>
        <div>
          <dt>Total value</dt>
          <dd>{vnd(match.total)}</dd>
        </div>
        <div>
          <dt>Confirmation</dt>
          <dd className="bf-sides">
            <Side label="You" value={match.buyer} />
            <Side label="Supplier" value={match.supplierSide} />
          </dd>
        </div>
      </dl>

      {match.reason && <p className="ph-muted">Reason: {match.reason}</p>}
      <FormError errors={errors} />

      {open ? (
        <div className="bf-match-actions">
          <span className="ph-muted">
            Confirm within <TimeLeft until={match.deadline} passed="deadline passed" />
          </span>
          <button type="button" className="ph-btn" onClick={() => setRejecting(true)}>
            Reject
          </button>
          <button
            type="button"
            className="ph-btn ph-btn--primary"
            onClick={() => setConfirming(true)}
          >
            Confirm
          </button>
        </div>
      ) : transaction ? (
        <p className="bf-match-actions">
          <span className="ph-muted">Both sides confirmed.</span>
          <Link to={`/buyer/transactions/${transaction.code}`} className="ph-link-btn">
            Transaction {transaction.code}
          </Link>
        </p>
      ) : match.status === "PARTIALLY_CONFIRMED" ? (
        <p className="ph-muted">You confirmed. Waiting for the supplier; the transaction is created when both sides have confirmed.</p>
      ) : null}

      <ReasonDialog
        open={confirming}
        noReason
        title={`Confirm ${kg(match.quantity)} of ${match.crop.toLowerCase()}?`}
        text="Once you confirm, you cannot change your answer."
        confirmLabel="Yes, confirm"
        extra={
          <ConfirmFacts
            rows={[
              ["Quantity", kg(match.quantity)],
              ["Price", perKg(match.clearingPrice)],
              ["Total value", <strong key="v">{vnd(match.total)}</strong>],
            ]}
            note="When the supplier confirms too, a transaction is created. Payment is agreed in the contract, outside Farmora."
          />
        }
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          const result = confirmMatch(match.code);
          setErrors(result.ok ? {} : result.errors);
          return result.ok ? null : result.errors;
        }}
      />
      <ReasonDialog
        open={rejecting}
        title={`Reject ${match.code}?`}
        text={`${kg(match.quantity)} goes back to your buy order if it is still valid, and joins the next session.`}
        confirmLabel="Reject result"
        danger
        onClose={() => setRejecting(false)}
        onConfirm={(reason) => {
          const result = rejectMatch(match.code, reason);
          return result.ok ? null : result.errors;
        }}
      />
    </li>
  );
}
