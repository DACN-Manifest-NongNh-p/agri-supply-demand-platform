import { useState } from "react";
import { ArrowLeftRight, Check, MessageCircle, Send, Undo2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { addNote, agree, awaiting, counter, decline, hoursLeft, isOpen, OFFER_STATUS_LABEL, useOffers, withdraw, type Offer, type OfferEvent } from "@/lib/offerStore";
import { openConversation } from "@/lib/messageStore";
import { formatKg, formatVnd } from "@/components/screens/Producer/data/format";
import "./offers.css";

type Side = "producer" | "buyer";

const time = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function describe(entry: OfferEvent, offer: Offer) {
  const who = entry.by === "producer" ? offer.producer : entry.by === "buyer" ? offer.buyer : entry.by === "coordinator" ? "Farmora coordinator" : "Farmora";
  const terms = entry.kg && entry.pricePerKg ? `${formatKg(entry.kg)} at ${formatVnd(entry.pricePerKg)}/kg` : undefined;
  switch (entry.kind) {
    case "sent":
      return { who, action: entry.by === "coordinator" ? "offered on the producer's behalf" : "offered", terms };
    case "counter":
      return { who, action: "proposed", terms };
    case "agree":
      return { who, action: "agreed to", terms };
    case "accept":
      return { who, action: "accepted and paid the deposit for", terms };
    case "decline":
      return { who, action: "declined", terms: undefined };
    case "withdraw":
      return { who, action: "withdrew the offer", terms: undefined };
    case "expire":
      return { who, action: "offer expired", terms: undefined };
    case "shrink":
      return { who, action: "updated the quantity", terms: entry.kg ? formatKg(entry.kg) : undefined };
    default:
      return { who, action: "wrote", terms: undefined };
  }
}

/**
 * The negotiation on one offer, the same for both sides: every proposal and note in order, and what
 * this side can do next. The buyer's "accept" is the deposit payment, handled by the caller.
 */
export function OfferThread({ offerId, side, onAccept, defaultOpen = false }: { offerId: string; side: Side; onAccept?: () => void; defaultOpen?: boolean }) {
  const offer = useOffers().find((item) => item.id === offerId);
  const navigate = useNavigate();
  const [open, setOpen] = useState(defaultOpen);
  const [mode, setMode] = useState<"none" | "counter" | "decline">("none");
  const [kg, setKg] = useState(0);
  const [price, setPrice] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  if (!offer) return null;
  const turn = awaiting(offer);
  const mine = (entry: OfferEvent) => entry.by === side || (side === "producer" && entry.by === "coordinator");
  const live = isOpen(offer);

  const startCounter = () => {
    setKg(offer.proposal?.kg ?? offer.kg);
    setPrice(offer.proposal?.pricePerKg ?? offer.pricePerKg);
    setText("");
    setError("");
    setMode("counter");
    setOpen(true);
  };

  const submitCounter = () => {
    if (!(kg > 0) || !(price > 0)) return setError("Enter kilograms and a price per kg.");
    counter(offer.id, side, { kg, pricePerKg: price, text });
    setMode("none");
  };

  const chat = () => {
    const id = openConversation(offer.producer, offer.buyer, { kind: "offer", id: offer.id, label: `Offer ${offer.id} · ${formatKg(offer.kg)} ${offer.product.toLowerCase()}` });
    navigate(`/${side}/messages?c=${id}`);
  };


  return (
    <div className="of-thread">
      <div className="of-thread-head">
        <h4>
          <ArrowLeftRight size={14} /> {formatKg(offer.kg)} at {formatVnd(offer.pricePerKg)}/kg
        </h4>
        <span className={`of-status of-status--${offer.status}`}>
          {OFFER_STATUS_LABEL[offer.status]}
          {live && ` · ${hoursLeft(offer)} h left`}
        </span>
      </div>

      {offer.proposal && (
        <p className="of-terms">
          {side === "producer" ? `${offer.buyer} asks for` : "You proposed"} <strong>{formatKg(offer.proposal.kg)} at {formatVnd(offer.proposal.pricePerKg)}/kg</strong>
          {side === "buyer" && ` · waiting for ${offer.producer}`}
        </p>
      )}

      <div className="of-thread-actions">
        {side === "buyer" && turn === "buyer" && onAccept && (
          <button type="button" className="ph-btn ph-btn--primary" onClick={onAccept}>
            <Check size={16} /> Accept · pay deposit
          </button>
        )}
        {side === "producer" && turn === "producer" && (
          <button type="button" className="ph-btn ph-btn--primary" onClick={() => agree(offer.id, "producer")}>
            <Check size={16} /> Agree to {formatVnd(offer.proposal?.pricePerKg ?? 0)}/kg
          </button>
        )}
        {live && (side === "buyer" ? turn === "buyer" : true) && (
          <button type="button" className="ph-btn" onClick={startCounter}>
            <ArrowLeftRight size={16} /> Propose other terms
          </button>
        )}
        {live && side === "buyer" && (
          <button type="button" className="ph-btn" onClick={() => setMode(mode === "decline" ? "none" : "decline")}>
            <X size={16} /> Decline
          </button>
        )}
        {live && side === "producer" && (
          <button type="button" className="ph-btn" onClick={() => (turn === "producer" ? setMode(mode === "decline" ? "none" : "decline") : withdraw(offer.id, "producer"))}>
            {turn === "producer" ? <X size={16} /> : <Undo2 size={16} />} {turn === "producer" ? "Decline" : "Withdraw offer"}
          </button>
        )}
        <button type="button" className="ph-link-btn" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Hide discussion" : `Discussion (${offer.events.length})`}
        </button>
        <button type="button" className="ph-link-btn" onClick={chat}>
          <MessageCircle size={14} /> Chat
        </button>
      </div>

      {mode === "counter" && (
        <form
          className="of-thread-form"
          onSubmit={(event) => {
            event.preventDefault();
            submitCounter();
          }}
        >
          <div className="ph-field-row">
            <label className="ph-field">
              <span>Kilograms</span>
              <input type="number" min={1} step={1} value={kg || ""} onChange={(event) => setKg(Number(event.target.value))} />
            </label>
            <label className="ph-field">
              <span>Price per kg (VND)</span>
              <input type="number" min={1000} step={100} value={price || ""} onChange={(event) => setPrice(Number(event.target.value))} />
            </label>
          </div>
          <textarea rows={2} maxLength={400} value={text} onChange={(event) => setText(event.target.value)} placeholder="Why these terms? (optional)" />
          {error && <p className="of-error">{error}</p>}
          <div className="of-thread-actions">
            <button type="submit" className="ph-btn ph-btn--primary">
              <Send size={16} /> Send proposal
            </button>
            <button type="button" className="ph-btn" onClick={() => setMode("none")}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "decline" && (
        <form
          className="of-thread-form"
          onSubmit={(event) => {
            event.preventDefault();
            decline(offer.id, side, text);
            setMode("none");
          }}
        >
          <textarea rows={2} maxLength={300} value={text} onChange={(event) => setText(event.target.value)} placeholder="Reason (optional, the other side sees it)" />
          <div className="of-thread-actions">
            <button type="submit" className="ph-btn ph-btn--primary">
              Decline offer
            </button>
            <button type="button" className="ph-btn" onClick={() => setMode("none")}>
              Keep it open
            </button>
          </div>
        </form>
      )}

      {open && (
        <>
          <ol className="of-events">
            {offer.events.map((entry) => {
              const info = describe(entry, offer);
              const system = entry.by === "system";
              return (
                <li key={entry.id} className={system ? "of-event of-event--system" : mine(entry) ? "of-event of-event--mine" : "of-event"}>
                  <span className="of-event-meta">
                    {info.who} · {time.format(entry.at)}
                  </span>
                  {entry.kind !== "note" && (
                    <>
                      {info.action} {info.terms && <span className="of-event-terms">{info.terms}</span>}
                    </>
                  )}
                  {entry.text && <div>{entry.kind === "note" ? entry.text : `“${entry.text}”`}</div>}
                </li>
              );
            })}
          </ol>
          {live && (
            <form
              className="of-thread-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (addNote(offer.id, side, text)) setText("");
              }}
            >
              <textarea rows={2} maxLength={500} value={mode === "none" ? text : ""} onChange={(event) => setText(event.target.value)} placeholder="Add a note to this offer…" />
              <div className="of-thread-actions">
                <button type="submit" className="ph-btn" disabled={!text.trim() || mode !== "none"}>
                  Add note
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
