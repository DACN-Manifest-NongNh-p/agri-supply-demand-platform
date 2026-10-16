import { useEffect, useRef } from "react";
import { ArrowRight, Check, Send, X } from "lucide-react";
import { Link } from "react-router-dom";
import "@/components/orders/orders.css";
import { formatKg } from "../data/format";
import type { ProducerOrder } from "../data/orders";

const STEPS = ["You offered", "Buyer accepts", "On the way", "Delivered"];

/**
 * Popup right after offering a batch: to whom, what happens next, and a way to the order. It follows
 * the order live, so it shows when the buyer accepts.
 */
export function OfferSentNotice({ order, onClose }: { order: ProducerOrder; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const accepted = order.stage !== "offered" && order.stage !== "declined";
  const step = accepted ? 2 : 1;

  // No close() in cleanup: StrictMode re-runs effects and would close the dialog right away.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="ph-form-dialog ord-notice"
      aria-labelledby="offer-sent-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button type="button" className="ord-notice-close" aria-label="Close" onClick={onClose}>
        <X size={18} />
      </button>

      <span className="ord-notice-icon" aria-hidden="true">
        {accepted ? <Check size={28} strokeWidth={2.5} /> : <Send size={24} />}
      </span>
      <h2 id="offer-sent-title">{accepted ? `${order.buyer} accepted your offer` : `Offer sent to ${order.buyer}`}</h2>
      <p className="ord-notice-sub">
        {formatKg(order.quantityKg)} {order.product.toLowerCase()} from {order.batch}, for {order.demandId}.
        <br />
        {accepted
          ? "The buyer paid the deposit, so the order is confirmed. A truck is being booked to pick it up at your packhouse."
          : "The buyer accepts by paying a deposit. Until then the batch stays yours, and nothing is booked."}
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
        <Link to={`/producer/orders#order-${order.id}`} className="ph-btn ph-btn--primary" onClick={onClose}>
          View order <ArrowRight size={16} />
        </Link>
        <button type="button" className="ph-btn" onClick={onClose}>
          Keep browsing
        </button>
      </div>
    </dialog>
  );
}
