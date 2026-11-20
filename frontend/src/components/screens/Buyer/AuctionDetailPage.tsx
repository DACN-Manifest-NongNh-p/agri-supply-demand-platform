// One auction (B3.2.3 + B3.2.5): what is offered, the buyer's single bid (price + quantity) with its
// history, and the result to confirm if the supplier selects it. Other buyers' bids are not shown:
// visibility between buyers is still an open question (Q-02), so Farmora shows only your own.
import { useState } from "react";
import { ArrowLeft, FileText, MapPin, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PartyLink } from "@/components/parties/PartyLink";
import { AUCTION_ALLOCATION_LABEL, AUCTION_LABEL, BID_LABEL, GRADE_LABEL, zoneLabel } from "./model/catalog";
import { answerAuctionAllocation, submitBid, useBuyerData, withdrawBid } from "./model/store";
import { formatClock, formatDateTime, formatLeft } from "./model/time";
import { useNow } from "@/components/orders/useNow";
import { Deal, useMarketPrice } from "./sections/Deal";
import type { Errors } from "./model/validation";
import { LotEvidence } from "./MarketPage";
import { ConfirmFacts, Field, FormError, GateNote, History, PageHead, Pill, ReasonDialog, TimeLeft } from "./ui/parts";
import { kg, perKg, useVerified, vnd } from "./ui/format";
import { AUCTION_ALLOCATION_TONE, AUCTION_TONE, BID_TONE } from "./ui/tones";

export default function AuctionDetailPage() {
  const { id } = useParams();
  const data = useBuyerData();
  const verified = useVerified();
  const auction = data.auctions.find((item) => item.code === id);
  const bid = data.bids.find((item) => item.auctionCode === id && item.status !== "WITHDRAWN");
  const withdrawn = data.bids.filter((item) => item.auctionCode === id && item.status === "WITHDRAWN");
  const allocation = data.auctionAllocations.find((item) => item.auctionCode === id && item.bidCode === bid?.code);
  const [price, setPrice] = useState(String(bid?.price ?? auction?.startingPrice ?? ""));
  const [quantity, setQuantity] = useState(String(bid?.quantity ?? auction?.minBidQuantity ?? ""));
  const [preference, setPreference] = useState(bid?.deliveryPreference ?? "");
  const [conditions, setConditions] = useState(bid?.conditions ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const now = useNow(1000);
  const market = useMarketPrice();

  if (!auction) {
    return (
      <main className="ph-main">
        <Link to="/buyer/auctions" className="ph-back">
          <ArrowLeft size={16} /> Auctions
        </Link>
        <p className="ph-empty">Auction {id} was not found.</p>
      </main>
    );
  }

  const lot = data.lots.find((item) => item.code === auction.lotCode);
  const active = auction.status === "ACTIVE";
  const canBid = active && (!bid || bid.status === "SUBMITTED");
  const value = Number(price) * Number(quantity);

  const send = () => {
    const result = submitBid(auction.code, { price: Number(price), quantity: Number(quantity), deliveryPreference: preference || undefined, conditions: conditions || undefined });
    if (!result.ok) {
      setErrors(result.errors);
      setMessage(null);
      return;
    }
    setErrors({});
    setMessage(bid ? "Bid updated. The supplier sees the new price and quantity." : "Bid submitted. You can change or withdraw it until the auction ends.");
  };

  return (
    <main className="ph-main bf-page bf-auction-detail">
      <Link to="/buyer/auctions" className="ph-back">
        <ArrowLeft size={16} /> Auctions
      </Link>
      <PageHead
        eyebrow={`Auction ${auction.code}`}
        title={auction.name}
        summary={
          <>
            <PartyLink name={auction.supplier} role="producer" /> · {auction.crop}, {auction.variety}, {GRADE_LABEL[auction.grade]}
          </>
        }
        actions={<Pill tone={AUCTION_TONE[auction.status]}>{AUCTION_LABEL[auction.status]}</Pill>}
      />

      <div className="bf-columns">
        <div className="bf-col-main">
          <section className="ph-card bf-section of">
            <div className="of-heading">
              <p className="rq-eyebrow">What is offered</p>
              <h2>{auction.crop}</h2>
              <p>
                {auction.variety} <span>·</span> {GRADE_LABEL[auction.grade]}
              </p>
            </div>
            {lot && <LotEvidence lot={lot} />}

            <div className="of-stats">
              <div>
                <small>Quantity</small>
                <strong>{kg(auction.quantity)}</strong>
                <span>bid from {kg(auction.minBidQuantity)}</span>
              </div>
              <div>
                <small>Starting price</small>
                <strong>{perKg(auction.startingPrice)}</strong>
                <Deal start={auction.startingPrice} market={market(auction)} />
              </div>
              <div className={active && auction.endTime - now < 3_600_000 ? "of-clock is-hot" : "of-clock"}>
                <small>{active ? "Time left" : auction.status === "SCHEDULED" ? "Opens in" : "Ended"}</small>
                <strong>
                  {active ? formatClock(auction.endTime - now) : auction.status === "SCHEDULED" ? formatLeft(auction.startTime - now) : formatDateTime(auction.endedAt ?? auction.endTime)}
                </strong>
                {auction.endReason && <span>{auction.endReason}</span>}
              </div>
            </div>

            <div className="of-timeline">
              <span>
                <small>Opens</small>
                {formatDateTime(auction.startTime)}
              </span>
              <span className="of-track" aria-hidden="true">
                <i style={{ width: `${Math.max(0, Math.min(1, (now - auction.startTime) / (auction.endTime - auction.startTime))) * 100}%` }} />
              </span>
              <span>
                <small>{auction.endedAt ? "Ended" : "Ends"}</small>
                {formatDateTime(auction.endedAt ?? auction.endTime)}
              </span>
            </div>

            <ul className="of-list">
              <li>
                <Truck size={16} aria-hidden="true" />
                <span>
                  <strong>{auction.deliveryLocation}</strong>
                  {auction.deliveryTerms && <small>{auction.deliveryTerms}</small>}
                </span>
              </li>
              <li>
                <MapPin size={16} aria-hidden="true" />
                <span>
                  <strong>Ships from {zoneLabel(auction.zone)}</strong>
                  <small>
                    Supply lot <Link to={`/buyer/market/${auction.lotCode}`}>{auction.lotCode}</Link>
                  </small>
                </span>
              </li>
              {auction.additionalConditions && (
                <li>
                  <FileText size={16} aria-hidden="true" />
                  <span>
                    <strong>Other conditions</strong>
                    <small>{auction.additionalConditions}</small>
                  </span>
                </li>
              )}
            </ul>
          </section>

          {allocation && (
            <section className={allocation.status === "PENDING_CONFIRMATION" ? "ph-card bf-section bf-section--alert" : "ph-card bf-section"}>
              <h2>Result for you</h2>
              <p className="bf-big">
                {kg(allocation.quantity)} at {perKg(allocation.acceptedPrice)} · {vnd(allocation.quantity * allocation.acceptedPrice)}
              </p>
              <p className="ph-muted">The supplier chose your bid{allocation.quantity < (bid?.quantity ?? 0) ? ` and allocated part of it (${kg(allocation.quantity)} of ${kg(bid!.quantity)})` : ""}. Price and quantity are fixed at this step.</p>
              <Pill tone={AUCTION_ALLOCATION_TONE[allocation.status]}>{AUCTION_ALLOCATION_LABEL[allocation.status]}</Pill>
              {allocation.status === "PENDING_CONFIRMATION" && (
                <>
                  <p>
                    Confirm within <TimeLeft until={allocation.deadline} passed="deadline passed" />. If you decline or let it expire, the quantity goes back to the supplier.
                  </p>
                  <GateNote />
                  <FormError errors={errors} />
                  <div className="bf-actions">
                    <button type="button" className="ph-btn" disabled={!verified} onClick={() => setDeclining(true)}>
                      Decline
                    </button>
                    <button
                      type="button"
                      className="ph-btn ph-btn--primary"
                      disabled={!verified}
                      onClick={() => setConfirming(true)}
                    >
                      Confirm result
                    </button>
                  </div>
                </>
              )}
              {allocation.status === "CONFIRMED" &&
                (() => {
                  const transaction = data.transactions.find((item) => item.sourceRef === allocation.id);
                  return transaction ? (
                    <p>
                      <Link to={`/buyer/transactions/${transaction.code}`} className="ph-link-btn">
                        Transaction {transaction.code}
                      </Link>
                    </p>
                  ) : null;
                })()}
            </section>
          )}

          {allocation && (
            <ReasonDialog
              open={confirming}
              noReason
              title={`Confirm ${kg(allocation.quantity)} from this auction?`}
              text="Once you confirm, you cannot change your answer."
              confirmLabel="Yes, confirm"
              extra={
                <ConfirmFacts
                  rows={[
                    ["Quantity", kg(allocation.quantity)],
                    ["Price", perKg(allocation.acceptedPrice)],
                    ["Total value", <strong key="v">{vnd(allocation.quantity * allocation.acceptedPrice)}</strong>],
                  ]}
                  note="A transaction with the supplier is created right away. Payment is agreed in the contract, outside Farmora."
                />
              }
              onClose={() => setConfirming(false)}
              onConfirm={() => {
                const result = answerAuctionAllocation(allocation.id, "CONFIRM");
                setErrors(result.ok ? {} : result.errors);
                return result.ok ? null : result.errors;
              }}
            />
          )}

          {bid && <History entries={bid.history} title="Your bid history" />}
        </div>

        <aside className="bf-col-side">
          <section className="ph-card bf-sticky bf-bid-panel">
            <h2>{bid && bid.status !== "SUBMITTED" ? "Your bid" : bid ? "Change your bid" : "Place a bid"}</h2>
            <p className="bf-sealed">
              Other buyers' bids are not shown. The supplier picks bids on price, quantity and terms, not only the highest price.
            </p>
            {bid && (
              <p>
                <Pill tone={BID_TONE[bid.status]}>{BID_LABEL[bid.status]}</Pill> {perKg(bid.price)} × {kg(bid.quantity)}
              </p>
            )}
            {withdrawn.length > 0 && !bid && <p className="ph-muted">You withdrew an earlier bid. You can bid again while the auction is open.</p>}

            {canBid ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  send();
                }}
                noValidate
              >
                <div className="bf-grid bf-grid--1">
                  <Field label="Price (VND/kg)" error={errors.price} hint={`At least ${perKg(auction.startingPrice)}`}>
                    <input type="number" min={auction.startingPrice} step={100} value={price} onChange={(event) => setPrice(event.target.value)} />
                  </Field>
                  <Field label="Quantity (kg)" error={errors.quantity} hint={`${kg(auction.minBidQuantity)} – ${kg(auction.quantity)}`}>
                    <input type="number" min={auction.minBidQuantity} max={auction.quantity} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                  </Field>
                  <Field label="Delivery preference (optional)">
                    <input value={preference} onChange={(event) => setPreference(event.target.value)} />
                  </Field>
                  <Field label="Conditions or note (optional)">
                    <input value={conditions} onChange={(event) => setConditions(event.target.value)} />
                  </Field>
                </div>
                {value > 0 && (
                  <p className="bf-auction-total">
                    <span>Value if fully selected</span>
                    <strong>{vnd(value)}</strong>
                  </p>
                )}
                <GateNote />
                <FormError errors={errors} />
                {message && (
                  <p className="bf-callout" role="status">
                    {message}
                  </p>
                )}
                <div className="bf-stack">
                  <button type="submit" className="ph-btn ph-btn--primary" disabled={!verified}>
                    {bid ? "Update bid" : "Submit bid"}
                  </button>
                  {bid && (
                    <button
                      type="button"
                      className="ph-btn"
                      disabled={!verified}
                      onClick={() => {
                        const result = withdrawBid(auction.code);
                        setErrors(result.ok ? {} : result.errors);
                        setMessage(result.ok ? "Bid withdrawn." : null);
                      }}
                    >
                      Withdraw bid
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <p className="ph-muted">
                {auction.status === "SCHEDULED"
                  ? `Bidding opens ${formatDateTime(auction.startTime)}.`
                  : auction.status === "ENDED"
                    ? "Bidding has ended. The supplier is choosing bids."
                    : "This auction no longer takes bids."}
              </p>
            )}
          </section>
        </aside>
      </div>

      {allocation && (
        <ReasonDialog
          open={declining}
          title="Decline this result?"
          text={`${kg(allocation.quantity)} goes back to ${auction.supplier}, who may choose another bid.`}
          confirmLabel="Decline result"
          danger
          onClose={() => setDeclining(false)}
          onConfirm={(reason) => {
            const result = answerAuctionAllocation(allocation.id, "DECLINE", reason);
            return result.ok ? null : result.errors;
          }}
        />
      )}
    </main>
  );
}
