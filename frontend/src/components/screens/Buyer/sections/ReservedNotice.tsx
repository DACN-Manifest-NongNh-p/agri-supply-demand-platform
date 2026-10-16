import { useEffect, useRef } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatKg } from "../../Producer/data/format";
import { useBuyer } from "../data/buyerContext";

/** What was just reserved; the allocation id lets the buyer undo it. */
export type Reservation = { allocationId: string; demandId: string; batchCode: string; producer: string; product: string; kg: number };

const STEPS = ["Reserved", "Producer confirms", "Allocated"];

type Props = {
  reservation: Reservation;
  onClose: () => void;
};

/**
 * Popup right after reserving: what was reserved, from whom, what happens next, a way to the
 * order, and a way back out.
 */
export function ReservedNotice({ reservation, onClose }: Props) {
  const { allocations, release } = useBuyer();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const allocation = allocations.find((item) => item.id === reservation.allocationId);
  // Confirmed by the producer in the meantime: nothing left to undo.
  const step = allocation && allocation.stage !== "held" ? 2 : 1;

  // No close() in cleanup: StrictMode re-runs effects and would close the dialog right away.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="ph-form-dialog bu-reserved"
      aria-labelledby="reserved-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button type="button" className="bu-reserved-close" aria-label="Close" onClick={onClose}>
        <X size={18} />
      </button>

      <span className="bu-reserved-icon" aria-hidden="true">
        <Check size={28} strokeWidth={2.5} />
      </span>
      <h2 id="reserved-title">
        {formatKg(reservation.kg)} {reservation.product.toLowerCase()} reserved
      </h2>
      <p className="bu-reserved-sub">
        For {reservation.demandId}, from {reservation.batchCode} by {reservation.producer}.
        <br />
        {step === 1 ? "The producer has 24 hours to confirm. Until then nobody else can take it." : "The producer has confirmed it."}
      </p>

      <ol className="bu-reserved-steps" aria-label={`Status: ${STEPS[step]}`}>
        {STEPS.map((label, index) => (
          <li key={label} className={index < step ? "is-done" : index === step ? "is-now" : undefined}>
            <span aria-hidden="true">{index < step ? <Check size={12} strokeWidth={3} /> : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="bu-reserved-actions">
        <Link to={`/buyer/demands/${reservation.demandId}#sources`} className="ph-btn ph-btn--primary" onClick={onClose}>
          View order <ArrowRight size={16} />
        </Link>
        <button type="button" className="ph-btn" onClick={onClose}>
          Keep browsing
        </button>
      </div>
      {allocation?.stage === "held" && (
        <button
          type="button"
          className="ph-link-btn bu-reserved-undo"
          onClick={() => {
            release(reservation.allocationId);
            onClose();
          }}
        >
          Undo this reservation
        </button>
      )}
    </dialog>
  );
}
