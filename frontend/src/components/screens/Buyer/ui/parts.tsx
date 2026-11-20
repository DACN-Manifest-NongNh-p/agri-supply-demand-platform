// Small building blocks shared by the buyer pages: status pills, fields with errors, the reason
// dialog every cancel/close/decline needs, the audit trail, the verification gate and session clock.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Info, Lock, PlayCircle, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { useNow } from "@/components/orders/useNow";
import { SESSION_TYPE_LABEL, VERIFICATION_LABEL } from "../model/catalog";
import { formatDateTime, formatLeft, formatTime, slotsOn, todayIso } from "../model/time";
import { upcomingSlot, useBuyerData, verificationBlock } from "../model/store";
import type { HistoryEntry } from "../model/types";
import type { Errors } from "../model/validation";


export type Tone = "neutral" | "info" | "good" | "warn" | "bad" | "muted";

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`bf-pill bf-pill--${tone}`}>{children}</span>;
}

/** A labelled control. `group` for several inputs (radios, checkboxes): a fieldset, not a label. */
export function Field({ label, error, hint, children, wide, group }: { label: string; error?: string; hint?: string; children: ReactNode; wide?: boolean; group?: boolean }) {
  const className = wide ? "ph-field bf-field bf-field--wide" : "ph-field bf-field";
  const body = (
    <>
      {children}
      {hint && !error && <small className="bf-hint">{hint}</small>}
      {error && (
        <small className="bf-error" role="alert">
          {error}
        </small>
      )}
    </>
  );
  return group ? (
    <fieldset className={className}>
      <legend>{label}</legend>
      {body}
    </fieldset>
  ) : (
    <label className={className}>
      <span>{label}</span>
      {body}
    </label>
  );
}

/** Form-level error, with a way to the profile when it is the verification gate. */
export function FormError({ errors }: { errors: Errors }) {
  if (!errors.form) return null;
  return (
    <p className="bf-form-error" role="alert">
      <ShieldAlert size={16} aria-hidden="true" />
      <span>
        {errors.form}
        {errors.gate === "verification" && (
          <>
            {" "}
            <Link to="/buyer/company">Open business profile</Link>
          </>
        )}
      </span>
    </p>
  );
}


/** Shown above an action the gate blocks, instead of letting the click fail. */
export function GateNote() {
  const data = useBuyerData();
  if (data.profile.status === "VERIFIED") return null;
  return (
    <p className="bf-gate">
      <Lock size={14} aria-hidden="true" />
      <span>
        {verificationBlock()?.form} <Link to="/buyer/company">Business profile</Link>
      </span>
    </p>
  );
}

/** Banner under the top bar on every page while the buyer is not verified (B0B.1 step 7). */
export function VerificationBanner() {
  const { profile } = useBuyerData();
  if (profile.status === "VERIFIED") return null;
  const urgent = profile.status === "NEEDS_ADDITIONAL_INFORMATION" || profile.status === "REJECTED" || profile.status === "NOT_SUBMITTED";
  return (
    <div className={urgent ? "bf-banner bf-banner--warn" : "bf-banner"} role="status">
      <ShieldAlert size={18} aria-hidden="true" />
      <p>
        <strong>Verification: {VERIFICATION_LABEL[profile.status]}.</strong> You can browse the market and keep demand drafts. Publishing demands, bidding,
        buy orders and confirming results open once your business is verified.
        {profile.reviewNote && <em> Farmora: “{profile.reviewNote}”</em>}
      </p>
      <Link to="/buyer/company" className="ph-btn">
        {profile.status === "NOT_SUBMITTED" ? "Complete profile" : "Open profile"}
      </Link>
    </div>
  );
}

export function VerifiedBadge() {
  const { profile } = useBuyerData();
  return profile.status === "VERIFIED" ? (
    <Pill tone="good">
      <ShieldCheck size={13} aria-hidden="true" /> Verified buyer
    </Pill>
  ) : (
    <Pill tone="warn">{VERIFICATION_LABEL[profile.status]}</Pill>
  );
}

/** Asks for the reason a BRD requires (close early, cancel, reject, decline). */
/** Key figures shown in a confirmation popup, so the buyer sees exactly what they commit to. */
export function ConfirmFacts({ rows, note }: { rows: [string, ReactNode][]; note?: string }) {
  return (
    <>
      <dl className="bf-confirm-facts">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="bf-confirm-note">{note}</p>}
    </>
  );
}

export function ReasonDialog({
  open,
  title,
  text,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
  extra,
  noReason,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: (reason: string) => Errors | null;
  onClose: () => void;
  extra?: ReactNode;
  /** A plain confirmation, for actions the BRD does not require a reason for. */
  noReason?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setReason("");
      setErrors({});
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="ph-form-dialog bf-dialog" onClose={onClose} aria-labelledby="reason-title">
      <form
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          const result = onConfirm(reason);
          if (result) setErrors(result);
          else onClose();
        }}
      >
        <div className="ph-form-dialog-head">
          <div>
            <h2 id="reason-title">{title}</h2>
            <p className="ph-muted">{text}</p>
          </div>
          <button type="button" className="ph-btn ph-btn--icon" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="bf-dialog-body">
          {extra}
          {!noReason && (
            <Field label="Reason (recorded and shared with the other side)" error={errors.reason}>
              <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} autoFocus />
            </Field>
          )}
          <FormError errors={errors} />
        </div>
        <div className="bf-dialog-foot">
          <button type="button" className="ph-btn" onClick={onClose}>
            Back
          </button>
          <button type="submit" className={danger ? "ph-btn ph-btn--warn" : "ph-btn ph-btn--primary"}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}

const ACTOR = { BUYER: "You", SUPPLIER: "Supplier", SYSTEM: "Farmora", COORDINATOR: "Coordinator" } as const;

const ACTION_LABEL: Record<string, string> = {
  CREATED: "Order placed",
  UPDATED: "Order changed",
  CANCELLED: "Order cancelled",
  PARTIALLY_FILLED: "Partly matched",
  FILLED: "Fully matched",
  EXPIRED: "Order expired",
};

/** Audit trail, newest first (FR-B3-06: never edited after the fact). */
export function History({ entries, title = "History" }: { entries: HistoryEntry[]; title?: string }) {
  return (
    <section className="ph-card bf-history" aria-label={title}>
      <h2>{title}</h2>
      <ol>
        {[...entries].reverse().map((entry, index) => (
          <li key={`${entry.at}-${index}`}>
            <time>{formatDateTime(entry.at)}</time>
            <span>
              <strong>{ACTOR[entry.by]}</strong> · {ACTION_LABEL[entry.action] ?? entry.action}
              {entry.note && <small>{entry.note}</small>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** "3 h 10 min left" that keeps counting. */
export function TimeLeft({ until, prefix = "", passed = "Passed" }: { until: number; prefix?: string; passed?: string }) {
  const now = useNow(1000);
  const left = until - now;
  return <span className={left < 3_600_000 && left > 0 ? "bf-left bf-left--soon" : "bf-left"}>{left > 0 ? `${prefix}${formatLeft(left)}` : passed}</span>;
}

/** Today's three matching sessions and when the next one closes its book (B3.3 §6.2). */
export function SessionStrip({ compact }: { compact?: boolean }) {
  const now = useNow(1000);
  const data = useBuyerData();
  const slot = upcomingSlot(now, data);
  const ran = new Set(data.sessions.map((session) => session.code));
  const bookClosed = now >= slot.cutoff;
  return (
    <section className={compact ? "bf-sessions bf-sessions--compact" : "ph-card bf-sessions"} aria-label="Matching sessions">
      <div className="bf-sessions-next">
        <CalendarClock size={18} aria-hidden="true" />
        <p>
          <strong>
            {SESSION_TYPE_LABEL[slot.type]} session {formatTime(slot.scheduled)}
            {slot.date !== todayIso() && " tomorrow"}
          </strong>
          <span>
            {bookClosed ? (
              <>Book closed, matching at {formatTime(slot.scheduled)}</>
            ) : (
              <>
                Book closes in <TimeLeft until={slot.cutoff} /> ({formatTime(slot.cutoff)})
              </>
            )}
          </span>
        </p>
      </div>
      {!compact && (
        <ol className="bf-sessions-day">
          {slotsOn(todayIso()).map((item) => {
            const done = ran.has(item.code);
            const current = item.code === slot.code;
            return (
              <li key={item.code} className={done ? "is-done" : current ? "is-current" : undefined}>
                <strong>{formatTime(item.scheduled)}</strong>
                <span>{done ? "Matched" : current ? (now >= item.cutoff ? "Book closed" : "Taking orders") : now > item.scheduled ? "Missed" : `Cut-off ${formatTime(item.cutoff)}`}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/** Simple vertical list of label → value. */
export function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="bf-facts">
      {items
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}

/** Steps of a lifecycle with the current one marked. */
export function Steps({ steps, current, stopped }: { steps: string[]; current: number; stopped?: string }) {
  return (
    <ol className="bf-steps" aria-label="Progress">
      {steps.map((step, index) => (
        <li key={step} className={index < current ? "is-done" : index === current ? (stopped ? "is-stopped" : "is-current") : undefined}>
          <span aria-hidden="true">{index + 1}</span>
          {index === current && stopped ? stopped : step}
        </li>
      ))}
    </ol>
  );
}

/** Page title. `summary` is one short line; longer explanations go in `help`, shown on demand. */
/**
 * Page title. `summary` is one short line. "How it works" opens a short demo video (`demo`) with the
 * explanation (`help`) as its caption; without a demo it shows the text alone.
 */
export function PageHead({
  eyebrow,
  title,
  summary,
  actions,
  help,
  demo,
}: {
  eyebrow: string;
  title: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
  help?: ReactNode;
  demo?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <section className="ph-page-head bf-page-head">
      <div>
        <p className="ph-eyebrow">{eyebrow}</p>
        <h1>
          {title}
          {(help || demo) && (
            <button type="button" className={open ? "bf-help is-on" : "bf-help"} aria-expanded={open} onClick={() => setOpen(!open)}>
              {demo ? <PlayCircle size={15} /> : <Info size={15} />} How it works
            </button>
          )}
        </h1>
        {summary && <p className="ph-hello-summary">{summary}</p>}
        {help && !demo && open && <div className="bf-help-panel">{help}</div>}
      </div>
      {actions && <div className="bf-head-actions">{actions}</div>}
      {demo && (
        <dialog
          ref={ref}
          className="bf-howto"
          aria-label={`How it works: ${eyebrow}`}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target === ref.current) setOpen(false);
          }}
        >
          <div className="bf-howto-head">
            <strong>How it works · {eyebrow}</strong>
            <button type="button" className="ph-btn ph-btn--icon" aria-label="Close" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>
          {open && demo}
          {help && <p className="bf-howto-text">{help}</p>}
        </dialog>
      )}
    </section>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  panel,
}: {
  tabs: { id: T; label: string; count?: number; alert?: boolean }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  /** Underlined tabs across the top of a list card (`ph-card bo-panel`). */
  panel?: boolean;
}) {
  if (panel) {
    return (
      <div className="bo-tabs" role="tablist" aria-label={label}>
        {tabs.map((tab) => (
          <button key={tab.id} type="button" role="tab" aria-selected={value === tab.id} onClick={() => onChange(tab.id)}>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && <span className={tab.alert ? "ph-count-badge is-alert" : "ph-count-badge"}>{tab.count}</span>}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="ph-segmented bf-tabs" role="group" aria-label={label}>
      {tabs.map((tab) => (
        <button key={tab.id} type="button" aria-pressed={value === tab.id} onClick={() => onChange(tab.id)}>
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && <span className={tab.alert ? "ph-count-badge is-alert" : "ph-count-badge"}>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
