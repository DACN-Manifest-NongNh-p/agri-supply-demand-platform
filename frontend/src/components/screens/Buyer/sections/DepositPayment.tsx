import { useEffect, useRef, useState } from "react";
import { CircleCheck, CreditCard, Landmark, Loader2, Lock, Wallet, X, type LucideIcon } from "lucide-react";
import "@/components/orders/orders.css";
import { Countdown } from "@/components/orders/Countdown";
import { RULES } from "@/lib/site";
import { formatKg, formatVnd } from "../../Producer/data/format";
import { useBuyer } from "../data/buyerContext";
import { PAYMENT_METHOD_LABEL, depositFor, type Allocation, type PaymentMethod } from "../data/mockBuyer";

/** How long the demo "payment provider" takes to answer. */
const PROCESSING_MS = 1200;

const METHOD_ICON: Record<PaymentMethod, LucideIcon> = { bank: Landmark, card: CreditCard, wallet: Wallet };

/** Header of a checkout popup: icon, title, one line, and the lock's countdown while it runs. */
export function CheckoutHead({ order, title, text }: { order: Allocation; title: string; text: string }) {
  return (
    <header className="ord-checkout-head">
      <span className="ord-checkout-icon" aria-hidden="true">
        <Lock size={18} />
      </span>
      <div>
        <h2 id="checkout-title">{title}</h2>
        <p>{text}</p>
        {order.stage === "locked" && order.lockExpiresAt && (
          <p className="ord-checkout-timer">
            Locked for you · <Countdown expiresAt={order.lockExpiresAt} /> left to pay
          </p>
        )}
      </div>
    </header>
  );
}

type Props = {
  order: Allocation;
  /** After the deposit went through. */
  onPaid?: () => void;
  /** A quiet button left of Pay (e.g. Release); none when omitted. */
  secondary?: { label: string; onClick: () => void };
};

/**
 * Order value, the deposit due now and the balance on delivery, a payment method and Pay. Paying is
 * what confirms an order: a locked batch goes to the producer, an accepted offer is confirmed.
 */
export function DepositPayment({ order, onPaid, secondary }: Props) {
  const { supply, payDeposit } = useBuyer();
  const [method, setMethod] = useState<PaymentMethod>("bank");
  const [paying, setPaying] = useState(false);
  const batch = supply.find((item) => item.code === order.batchCode);
  const pricePerKg = order.pricePerKg ?? batch?.pricePerKg ?? 0;
  const percent = RULES.depositPercent;
  const { total, deposit, balance } = depositFor(order.kg, pricePerKg, percent);

  const pay = () => {
    setPaying(true);
    window.setTimeout(() => {
      payDeposit(order.id, method);
      onPaid?.();
    }, PROCESSING_MS);
  };

  return (
    <div className="ord-pay">
      <dl className="ord-pay-sum">
        <div>
          <dt>
            {formatKg(order.kg)} × {formatVnd(pricePerKg)}/kg
          </dt>
          <dd>{formatVnd(total)}</dd>
        </div>
        <div>
          <dt>Paid on delivery</dt>
          <dd>{formatVnd(balance)}</dd>
        </div>
        <div className="is-due">
          <dt>Deposit due now · {percent}%</dt>
          <dd>{formatVnd(deposit)}</dd>
        </div>
      </dl>

      <fieldset className="ord-pay-methods" disabled={paying}>
        <legend>Pay with</legend>
        <div>
          {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((id) => {
            const Icon = METHOD_ICON[id];
            return (
              <label key={id} className={method === id ? "is-chosen" : undefined}>
                <input type="radio" name={`pay-${order.id}`} value={id} checked={method === id} onChange={() => setMethod(id)} />
                <Icon size={18} aria-hidden="true" />
                {PAYMENT_METHOD_LABEL[id]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="ord-pay-actions">
        {secondary && (
          <button type="button" className="ph-text-btn" onClick={secondary.onClick} disabled={paying}>
            {secondary.label}
          </button>
        )}
        <button type="button" className="ph-btn ph-btn--primary" onClick={pay} disabled={paying || pricePerKg === 0}>
          {paying ? (
            <>
              <Loader2 size={16} className="ord-spin" /> Processing…
            </>
          ) : (
            `Pay ${formatVnd(deposit)}`
          )}
        </button>
      </div>
      <p className="ord-pay-note">Demo payment, no money is moved. Refunded in full if the producer declines.</p>
    </div>
  );
}

/** The payment on its own, from an order card (a locked batch, or accepting an offer). */
export function DepositDialog({ order, onClose }: { order: Allocation; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { allocations } = useBuyer();
  const current = allocations.find((item) => item.id === order.id);
  const payable = current && (current.stage === "locked" || current.stage === "offered");

  // No close() in cleanup: StrictMode re-runs effects and would close the dialog right away.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={payable ? "ph-form-dialog ord-checkout" : "ph-form-dialog ord-notice"}
      aria-labelledby={payable ? "checkout-title" : "deposit-title"}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button type="button" className="ord-notice-close" aria-label="Close" onClick={onClose}>
        <X size={18} />
      </button>
      {payable ? (
        <>
          <CheckoutHead
            order={current}
            title={current.stage === "offered" ? `Accept ${current.producer}'s offer` : `Pay the deposit for ${current.batchCode}`}
            text={`For ${current.demandId}. Paying the deposit ${current.stage === "offered" ? "confirms the order" : "sends the order to the producer"}.`}
          />
          <DepositPayment order={current} />
        </>
      ) : current?.deposit ? (
        <>
          <span className="ord-notice-icon" aria-hidden="true">
            <CircleCheck size={28} />
          </span>
          <h2 id="deposit-title">Deposit paid</h2>
          <p className="ord-notice-sub">
            {formatVnd(current.deposit.amount)} · ref {current.deposit.ref}.
            <br />
            {current.stage === "confirmed" ? "The order is confirmed. A truck is being booked." : `Sent to ${current.producer}, who has ${RULES.holdHours} hours to confirm.`}
          </p>
          <div className="ord-notice-actions">
            <button type="button" className="ph-btn ph-btn--primary" onClick={onClose}>
              Done
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 id="deposit-title">This order can no longer be paid</h2>
          <p className="ord-notice-sub">The lock ran out or the offer was withdrawn; the kilograms are back on the market.</p>
          <div className="ord-notice-actions">
            <button type="button" className="ph-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
