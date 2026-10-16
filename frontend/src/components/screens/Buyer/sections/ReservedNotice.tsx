import { useEffect, useRef } from "react";
import { ArrowRight, Check, TimerOff, X } from "lucide-react";
import { Link } from "react-router-dom";
import "@/components/orders/orders.css";
import { RULES } from "@/lib/site";
import { formatKg, formatVnd } from "../../Producer/data/format";
import { useBuyer } from "../data/buyerContext";
import { CheckoutHead, DepositPayment } from "./DepositPayment";

/** What was just picked; the allocation id follows it through lock, deposit and the producer's answer. */
export type Reservation = { allocationId: string; demandId: string; batchCode: string; producer: string; product: string; kg: number };

const STEPS = ["Deposit paid", "Producer confirms", "On the way", "Delivered"];

type Props = {
  reservation: Reservation;
  onClose: () => void;
};

/**
 * Popup right after picking a batch. While locked: the live countdown and the deposit to pay. Once paid
 * it follows the order to the producer's answer. If the lock runs out it says so.
 */
export function ReservedNotice({ reservation, onClose }: Props) {
  const { allocations, release } = useBuyer();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const order = allocations.find((item) => item.id === reservation.allocationId);
  const what = `${formatKg(reservation.kg)} ${reservation.product.toLowerCase()}`;
  const locked = order?.stage === "locked";
  // 0 pay the deposit → 1 waiting for the producer → 2 confirmed (truck next).
  const step = locked ? 0 : order?.stage === "held" ? 1 : 2;

  // No close() in cleanup: StrictMode re-runs effects and would close the dialog right away.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={locked ? "ph-form-dialog ord-checkout" : "ph-form-dialog ord-notice"}
      aria-labelledby={locked ? "checkout-title" : "reserved-title"}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button type="button" className="ord-notice-close" aria-label="Close" onClick={onClose}>
        <X size={18} />
      </button>

      {!order ? (
        <>
          <span className="ord-notice-icon is-off" aria-hidden="true">
            <TimerOff size={26} />
          </span>
          <h2 id="reserved-title">The lock ran out</h2>
          <p className="ord-notice-sub">
            {what} of {reservation.batchCode} went back on the market because the deposit was not paid in time.
          </p>
          <div className="ord-notice-actions">
            <Link to={`/buyer/demands/${reservation.demandId}`} className="ph-btn ph-btn--primary" onClick={onClose}>
              Pick supply again <ArrowRight size={16} />
            </Link>
            <button type="button" className="ph-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </>
      ) : locked ? (
        <>
          <CheckoutHead
            order={order}
            title={`Pay the deposit for ${what}`}
            text={`${reservation.batchCode} from ${reservation.producer}, for ${reservation.demandId}. Nobody else can take it while it is locked.`}
          />
          <DepositPayment
            order={order}
            secondary={{
              label: "Release",
              onClick: () => {
                release(reservation.allocationId);
                onClose();
              },
            }}
          />
        </>
      ) : (
        <>
          <span className="ord-notice-icon" aria-hidden="true">
            <Check size={28} strokeWidth={2.5} />
          </span>
          <h2 id="reserved-title">{step === 1 ? `Order sent to ${reservation.producer}` : `${reservation.producer} confirmed`}</h2>
          <p className="ord-notice-sub">
            {what} for {reservation.demandId}
            {order.deposit && (
              <>
                {" "}· deposit {formatVnd(order.deposit.amount)} paid (ref {order.deposit.ref})
              </>
            )}
            .
            <br />
            {step === 1
              ? `The producer has ${RULES.holdHours} hours to confirm. If they decline, the deposit is refunded.`
              : "The order is yours. A truck is being booked; it shows under Deliveries once picked up. The rest is paid on delivery."}
          </p>

          <ol className="ord-notice-steps" aria-label={`Status: ${STEPS[step]}`}>
            {STEPS.map((label, index) => (
              <li key={label} className={index < step ? "is-done" : index === step ? "is-now" : undefined}>
                <span aria-hidden="true">{index < step ? <Check size={12} strokeWidth={3} /> : index + 1}</span>
                {label}
              </li>
            ))}
          </ol>

          <div className="ord-notice-actions">
            <Link to={`/buyer/orders#order-${reservation.allocationId}`} className="ph-btn ph-btn--primary" onClick={onClose}>
              View order <ArrowRight size={16} />
            </Link>
            <button type="button" className="ph-btn" onClick={onClose}>
              Keep browsing
            </button>
          </div>
          {order.stage === "held" && (
            <button
              type="button"
              className="ph-link-btn ord-notice-undo"
              onClick={() => {
                release(reservation.allocationId);
                onClose();
              }}
            >
              Cancel this order (deposit refunded)
            </button>
          )}
        </>
      )}
    </dialog>
  );
}
