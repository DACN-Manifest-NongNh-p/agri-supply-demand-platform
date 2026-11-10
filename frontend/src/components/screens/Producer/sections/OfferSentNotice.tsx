import { useEffect, useRef } from "react";
import { ArrowRight, Check, Send, X } from "lucide-react";
import { Link } from "react-router-dom";
import "@/components/orders/orders.css";
import "@/components/offers/offers.css";
import { formatKg, formatVnd } from "../data/format";
import { OFFER_STATUS_LABEL, useOffers } from "@/lib/offerStore";

/**
 * Popup right after offering a batch: to whom, what happens next, and a way to the orders. It follows
 * the offers live, so it shows when a buyer accepts, proposes other terms or declines.
 */
export function OfferSentNotice({ offerIds, onClose }: { offerIds: string[]; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const offers = useOffers().filter((offer) => offerIds.includes(offer.id));
  const accepted = offers.filter((offer) => offer.status === "accepted");
  const first = offers[0];

  // No close() in cleanup: StrictMode re-runs effects and would close the dialog right away.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  if (!first) return null;
  const title =
    accepted.length > 0
      ? `${accepted.map((offer) => offer.buyer).join(", ")} accepted`
      : offers.length === 1
        ? `Offer sent to ${first.buyer}`
        : `${offers.length} offers sent for ${first.batchCode}`;

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
        {accepted.length > 0 ? <Check size={28} strokeWidth={2.5} /> : <Send size={24} />}
      </span>
      <h2 id="offer-sent-title">{title}</h2>
      <p className="ord-notice-sub">
        {first.product} from {first.batchCode} at {formatVnd(first.pricePerKg)}/kg.
        <br />
        Each buyer accepts by paying a deposit, or proposes other terms. Until then the batch stays yours, and nothing is booked.
      </p>

      <ul className="of-sent-list" aria-live="polite">
        {offers.map((offer) => (
          <li key={offer.id}>
            <span>
              <strong>{offer.buyer}</strong> · {formatKg(offer.kg)}
              {offer.demandId && <> · {offer.demandId}</>}
            </span>
            <span className={`of-status of-status--${offer.status}`}>{OFFER_STATUS_LABEL[offer.status]}</span>
          </li>
        ))}
      </ul>

      <div className="ord-notice-actions">
        <Link to={`/producer/orders?tab=offered#order-${first.id}`} className="ph-btn ph-btn--primary" onClick={onClose}>
          View offers <ArrowRight size={16} />
        </Link>
        <button type="button" className="ph-btn" onClick={onClose}>
          Keep browsing
        </button>
      </div>
    </dialog>
  );
}
