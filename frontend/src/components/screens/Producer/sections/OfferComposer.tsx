import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Send, X } from "lucide-react";
import { evaluate } from "../data/matching";
import { demands, producer, type Batch } from "../data/mockProducer";
import { formatDay, formatKg, formatVnd } from "../data/format";
import { MatchScore } from "./MatchScore";
import { suggestedPrice } from "../data/pricing";
import { isOpen, sendOffers, useOffers, type Offer } from "@/lib/offerStore";
import { buyersFor, RELATION_LABEL } from "@/lib/tradeHistory";
import { partyId } from "@/lib/parties";
import "@/components/offers/offers.css";

const VALIDITY = [6, 12, 24, 48];

export type ComposerStart = { batchCode?: string; demandId?: string; buyer?: string };

type Row = {
  key: string;
  buyer: string;
  buyerType: string;
  demandId?: string;
  destination?: string;
  neededByDay?: number;
  wantedKg?: number;
  score?: number;
  eligible: boolean;
  why?: string;
  /** Why this buyer is listed without an open demand. */
  relation?: string;
  alreadyOffered: boolean;
};

const openKg = (batch: Batch) => (batch.status === "in_transit" || batch.status === "delivered" ? 0 : batch.quantityKg - batch.allocatedKg);

/** Everyone the batch could be offered to: open demands for its product, then past buyers without one. */
function rowsFor(batch: Batch | undefined, offers: Offer[]): Row[] {
  if (!batch) return [];
  const openOffer = (buyer: string, demandId?: string) =>
    offers.some((offer) => offer.batchCode === batch.code && isOpen(offer) && partyId(offer.buyer) === partyId(buyer) && offer.demandId === demandId);
  const fromDemands: Row[] = demands
    .filter((demand) => demand.product === batch.product)
    .map((demand) => {
      const candidate = evaluate(demand, batch);
      return {
        key: demand.id,
        buyer: demand.buyer,
        buyerType: demand.buyerType,
        demandId: demand.id,
        destination: demand.destination,
        neededByDay: demand.neededByDay,
        wantedKg: demand.quantityKg,
        score: candidate.score,
        eligible: candidate.eligible,
        why: candidate.eligible ? undefined : candidate.criteria.find((criterion) => criterion.state === "fail")?.detail,
        alreadyOffered: openOffer(demand.buyer, demand.id),
      };
    })
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || (b.score ?? 0) - (a.score ?? 0));
  const withDemand = new Set(fromDemands.map((row) => partyId(row.buyer)));
  // Buyers with no open demand for this product, but who bought it before: a direct offer.
  const direct: Row[] = buyersFor(batch.product, producer.name)
    .filter((item) => !withDemand.has(item.party.id) && item.relation !== "new")
    .slice(0, 5)
    .map((item) => ({
      key: `direct-${item.party.id}`,
      buyer: item.party.name,
      buyerType: item.party.type,
      eligible: true,
      relation: `${RELATION_LABEL[item.relation]}${item.lastDay !== undefined ? ` · last ${formatDay(item.lastDay)}` : ""}`,
      alreadyOffered: openOffer(item.party.name, undefined),
    }));
  return [...fromDemands, ...direct];
}

const defaultKg = (row: Row, batch: Batch) => Math.min(row.wantedKg ?? openKg(batch), openKg(batch));

/** The demand or buyer the offer was started from, ticked with its kilograms. */
function startPicks(batch: Batch | undefined, offers: Offer[], start: ComposerStart): Record<string, number> {
  if (!batch) return {};
  const target = rowsFor(batch, offers).find(
    (row) => !row.alreadyOffered && ((start.demandId && row.demandId === start.demandId) || (start.buyer && partyId(row.buyer) === partyId(start.buyer))),
  );
  return target ? { [target.key]: defaultKg(target, batch) } : {};
}

/**
 * Offer one batch to one or several buyers: each gets its own kilograms, all on the same price, note
 * and deadline. Offering more than the batch has open is allowed: the first buyer to pay the deposit
 * gets the kilograms and the rest shrink or are withdrawn.
 */
export function OfferComposer({ batches, start, onClose, onSent }: { batches: Batch[]; start: ComposerStart; onClose: () => void; onSent: (ids: string[]) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const offers = useOffers();
  const sellable = batches.filter((batch) => openKg(batch) > 0);
  const startDemand = demands.find((demand) => demand.id === start.demandId);
  const firstBatch =
    sellable.find((batch) => batch.code === start.batchCode) ??
    (startDemand
      ? sellable
          .map((batch) => ({ batch, fit: evaluate(startDemand, batch) }))
          .filter((item) => item.fit.eligible)
          .sort((a, b) => b.fit.score - a.fit.score)[0]?.batch
      : undefined) ??
    sellable[0];
  const [batchCode, setBatchCode] = useState(firstBatch?.code ?? "");
  const batch = sellable.find((item) => item.code === batchCode);
  const rows = rowsFor(batch, offers);

  const [picked, setPicked] = useState<Record<string, number>>(() => startPicks(firstBatch, offers, start));
  const [price, setPrice] = useState(() => (firstBatch ? suggestedPrice(firstBatch) : 0));
  const [note, setNote] = useState("");
  const [validHours, setValidHours] = useState(24);

  const chooseBatch = (code: string) => {
    const next = sellable.find((item) => item.code === code);
    setBatchCode(code);
    setPicked(startPicks(next, offers, start));
    if (next) setPrice(suggestedPrice(next));
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const chosen = rows.filter((row) => picked[row.key] !== undefined);
  const total = chosen.reduce((sum, row) => sum + (picked[row.key] || 0), 0);
  const open = batch ? openKg(batch) : 0;
  const invalid = chosen.length === 0 || chosen.some((row) => !(picked[row.key] > 0) || picked[row.key] > open) || !(price > 0);

  const submit = () => {
    if (!batch || invalid) return;
    const ids = sendOffers(
      { code: batch.code, product: batch.product, variety: batch.variety, grade: batch.grade, producer: producer.name, openKg: open },
      chosen.map((row) => ({ buyer: row.buyer, demandId: row.demandId, destination: row.destination, neededByDay: row.neededByDay, kg: picked[row.key] })),
      { pricePerKg: price, note, validHours },
    );
    onSent(ids);
  };

  return (
    <dialog
      ref={dialogRef}
      className="ph-form-dialog of-composer"
      aria-labelledby="offer-composer-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="ph-form-dialog-head">
        <div>
          <h2 id="offer-composer-title">Offer a batch</h2>
          <p className="ph-muted">Pick one or more buyers. Each buyer sees only their own offer.</p>
        </div>
        <button type="button" className="ord-notice-close" aria-label="Close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <form
        className="ph-declare-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label className="ph-field">
          <span>Batch</span>
          <select value={batchCode} onChange={(event) => chooseBatch(event.target.value)}>
            {sellable.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} · {item.product} {item.variety}, grade {item.grade} · {formatKg(openKg(item))} open · sell by {formatDay(item.sellByDay)}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="ph-field">
          <legend>Buyers</legend>
          {rows.length === 0 ? (
            <p className="ph-muted">No buyer is asking for {batch?.product.toLowerCase()} right now.</p>
          ) : (
            <ul className="of-recipients">
              {rows.map((row) => {
                const on = picked[row.key] !== undefined;
                const disabled = row.alreadyOffered;
                return (
                  <li key={row.key} className={disabled ? "is-off" : on ? "is-on" : undefined}>
                    <label className="of-recipient-main">
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={disabled}
                        onChange={() =>
                          setPicked((current) => {
                            const next = { ...current };
                            if (on) delete next[row.key];
                            else if (batch) next[row.key] = defaultKg(row, batch);
                            return next;
                          })
                        }
                      />
                      <span>
                        <strong>{row.buyer}</strong> <span className="ph-mp-type">{row.buyerType}</span>
                        <small>
                          {row.demandId
                            ? `${row.demandId} · wants ${formatKg(row.wantedKg ?? 0)} by ${formatDay(row.neededByDay ?? 0)}`
                            : `No open demand · ${row.relation}`}
                          {row.alreadyOffered && " · already offered"}
                          {!row.eligible && row.why && ` · does not fit: ${row.why}`}
                        </small>
                      </span>
                      {row.score !== undefined && row.eligible && <MatchScore score={row.score} />}
                    </label>
                    {on && (
                      <label className="of-recipient-kg">
                        <input
                          type="number"
                          min={1}
                          max={open}
                          step={1}
                          value={picked[row.key] || ""}
                          onChange={(event) => setPicked((current) => ({ ...current, [row.key]: Number(event.target.value) }))}
                          aria-label={`Kilograms for ${row.buyer}`}
                        />
                        kg
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>

        <div className="ph-field-row">
          <label className="ph-field">
            <span>Price per kg (VND)</span>
            <input type="number" min={1000} step={100} value={price || ""} onChange={(event) => setPrice(Number(event.target.value))} />
          </label>
          <label className="ph-field">
            <span>Offer valid for</span>
            <select value={validHours} onChange={(event) => setValidHours(Number(event.target.value))}>
              {VALIDITY.map((hours) => (
                <option key={hours} value={hours}>
                  {hours} hours
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="ph-field">
          <span>Note to the buyer (optional)</span>
          <textarea
            className="of-textarea"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Packing, delivery day, quality notes, payment terms…"
          />
        </label>

        <div className="of-summary" aria-live="polite">
          <p>
            <strong>{formatKg(total)}</strong> offered to {chosen.length} {chosen.length === 1 ? "buyer" : "buyers"} · {formatKg(open)} open ·{" "}
            {price > 0 && <>about {formatVnd(total * price)} in total</>}
          </p>
          {total > open && (
            <p className="of-warning">
              <AlertTriangle size={14} /> More than the batch has open. The first buyer to pay the deposit gets their kilograms; the other offers shrink
              to what is left, or are withdrawn when it is sold out.
            </p>
          )}
        </div>

        <div className="ord-notice-actions">
          <button type="submit" className="ph-btn ph-btn--primary" disabled={invalid}>
            <Send size={16} /> Send {chosen.length > 1 ? `${chosen.length} offers` : "offer"}
          </button>
          <button type="button" className="ph-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  );
}
