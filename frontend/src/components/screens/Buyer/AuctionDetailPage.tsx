import { useState } from "react";
import { ArrowLeft, Gavel } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { AuctionStatus, AuctionTimer, BidHistory, ConfidencePanel, LastRaise, PriceSparkline } from "@/components/auction/AuctionParts";
import { currentBid, minNextBid, placeBid, useAuctions, type BidResult } from "@/components/auction/auctionStore";
import { estimate, vnd } from "@/components/auction/format";
import { useNow } from "@/components/orders/useNow";
import { formatDay } from "../Producer/data/format";

const REFUSED: Record<Exclude<BidResult, { ok: true }>["reason"], (current: number) => string> = {
  stale: (current) => `Another buyer bid ${vnd(current)}/kg a moment before you, so your bid was not placed. Bid again on the new price.`,
  too_low: (current) => `Your bid must be above ${vnd(current)}/kg.`,
  closed: () => "This auction has closed.",
};

/** One auction: what is offered and how sure the yield is, the live bid, and placing a bid. */
export default function AuctionDetailPage() {
  const { id } = useParams();
  const auctions = useAuctions();
  const now = useNow(1000);
  const auction = auctions.find((item) => item.id === id);
  const [amount, setAmount] = useState<number | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  // The version this buyer is looking at; a bid placed against an older one is refused.
  const [seen, setSeen] = useState<number | null>(null);

  if (!auction) {
    return (
      <main className="ph-main">
        <Link to="/buyer/auctions" className="ph-back">
          <ArrowLeft size={16} /> Pre-harvest auctions
        </Link>
        <p className="ph-empty">Auction {id} was not found.</p>
      </main>
    );
  }

  const min = minNextBid(auction);
  const bid = amount !== null && amount >= min ? amount : min;
  const leader = auction.bids.at(-1);
  const ended = auction.status !== "live" || now >= auction.endsAt;
  const youLead = Boolean(leader?.self);
  const youBid = auction.bids.some((item) => item.self);
  const version = seen ?? auction.version;

  // `against` is the version the bid is made on: the one the buyer was looking at, or the latest for one-tap rebids.
  const submit = (price: number, against = version) => {
    const result = placeBid(auction.id, price, against);
    if (result.ok) {
      setMessage({ tone: "ok", text: `Bid placed: ${vnd(price)}/kg. You lead for now.` });
      setAmount(null);
      setSeen(null);
    } else {
      setMessage({ tone: "error", text: REFUSED[result.reason](result.current) });
      setSeen(null);
      setAmount(null);
    }
  };

  const midKg = Math.round((auction.estMinKg + auction.estMaxKg) / 2);

  return (
    <main className="ph-main">
      <Link to="/buyer/auctions" className="ph-back">
        <ArrowLeft size={16} /> Pre-harvest auctions
      </Link>

      <div className="au-detail">
        <section className="ph-card">
          <p className="ph-eyebrow">
            <Gavel size={14} aria-hidden="true" /> Pre-harvest auction {auction.id}
          </p>
          <h1 className="au-title">
            {auction.product} · grade {auction.grade}
          </h1>
          <p className="au-muted">
            {auction.batchCode} · {auction.variety} · {auction.producer}, {auction.region}
          </p>
          <dl className="au-facts">
            <div>
              <dt>Estimated yield</dt>
              <dd>{estimate(auction)}</dd>
            </div>
            <div>
              <dt>Expected harvest</dt>
              <dd>{formatDay(auction.harvestDay)}</dd>
            </div>
            <div>
              <dt>Opening price</dt>
              <dd>{vnd(auction.startPrice)}/kg</dd>
            </div>
            <div>
              <dt>Raise by at least</dt>
              <dd>{vnd(auction.step)}/kg</dd>
            </div>
          </dl>
          <ul className="au-farming">
            {auction.farming.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <ConfidencePanel auction={auction} />
          {auction.risk && <p className="au-message au-message--error">Producer reported: {auction.risk}. The auction is under review by a coordinator.</p>}
        </section>

        <section className="ph-card au-bid-panel" aria-live="polite">
          <AuctionStatus auction={auction} />
          <AuctionTimer auction={auction} />
          <p className="au-current">
            {/* Re-keyed on every bid, so the price flashes when it changes. */}
            <span key={auction.bids.length} className={auction.bids.length ? "au-current-value" : undefined}>
              {leader ? vnd(currentBid(auction)) : vnd(auction.startPrice)}
            </span>{" "}
            <small>/kg</small>
          </p>
          <p className={youLead ? "au-lead is-you" : youBid ? "au-lead is-outbid" : "au-lead au-muted"}>
            {!leader ? "No bids yet" : youLead ? (ended ? "You won" : "You are the highest bidder") : youBid ? `Outbid by ${leader.bidder}` : `${leader.bidder} leads`}
          </p>
          <LastRaise auction={auction} />
          <PriceSparkline auction={auction} width={320} height={48} />
          {!ended && youBid && !youLead && (
            <div className="au-outbid" role="alert">
              You've been outbid
              <button type="button" className="ph-btn ph-btn--primary" onClick={() => submit(min, auction.version)}>
                Bid {vnd(min)} to lead again
              </button>
            </div>
          )}
          {!ended && youLead && <p className="au-leading">You lead. We'll show it here the moment someone outbids you.</p>}

          {ended ? (
            <div className={youLead ? "au-result is-won" : "au-result"}>
              {youLead ? (
                <>
                  <strong>Future supply commitment</strong>
                  You secured {auction.batchCode} at {vnd(currentBid(auction))}/kg, about {midKg.toLocaleString("en-GB")} kg (≈ {vnd(midKg * currentBid(auction))}) for harvest{" "}
                  {formatDay(auction.harvestDay).toLowerCase()}. The final quantity is what the producer actually harvests; it then follows the normal order flow.
                </>
              ) : leader ? (
                <>
                  <strong>Auction closed</strong>
                  Won by an anonymous buyer at {vnd(currentBid(auction))}/kg.
                </>
              ) : (
                <>
                  <strong>No winner</strong>
                  The batch goes back to the market when it is harvested, where matching picks it up.
                </>
              )}
            </div>
          ) : (
            <form
              className="au-bid-form"
              onSubmit={(event) => {
                event.preventDefault();
                submit(bid);
              }}
              onFocus={() => setSeen((current) => current ?? auction.version)}
            >
              <label className="au-muted" htmlFor="bid-amount">
                Your bid per kg (at least {vnd(min)})
              </label>
              <input id="bid-amount" type="number" min={min} step={auction.step} value={bid} onChange={(event) => setAmount(Number(event.target.value))} />
              <div className="au-quick">
                {[0, 1, 2].map((extra) => (
                  <button key={extra} type="button" className="ph-btn" onClick={() => setAmount(min + extra * auction.step)}>
                    {vnd(min + extra * auction.step)}
                  </button>
                ))}
              </div>
              <button type="submit" className="ph-btn ph-btn--primary">
                Bid {vnd(bid)}/kg
              </button>
              {message && <p className={`au-message au-message--${message.tone}`}>{message.text}</p>}
            </form>
          )}

          <h2 className="au-section-title">Bids</h2>
          <BidHistory auction={auction} />
        </section>
      </div>
    </main>
  );
}
