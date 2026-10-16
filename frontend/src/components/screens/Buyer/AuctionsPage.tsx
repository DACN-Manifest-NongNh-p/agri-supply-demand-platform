import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { AuctionStatus, PriceSparkline } from "@/components/auction/AuctionParts";
import { currentBid, useAuctions } from "@/components/auction/auctionStore";
import { estimate, vnd } from "@/components/auction/format";
import { useNow } from "@/components/orders/useNow";
import { yieldConfidence } from "@/components/auction/yieldConfidence";
import { formatDay } from "../Producer/data/format";
import { SupplyTabs } from "./sections/SupplyTabs";

/** Pre-harvest auctions: batches not harvested yet that buyers can secure ahead of time by bidding. */
export default function AuctionsPage() {
  const auctions = useAuctions();
  const now = useNow(1000);
  const live = auctions.filter((auction) => auction.status === "live");
  const won = auctions.filter((auction) => auction.status === "closed" && auction.bids.at(-1)?.self);
  const other = auctions.filter((auction) => !live.includes(auction) && !won.includes(auction));

  const row = (auction: (typeof auctions)[number]) => {
    const confidence = yieldConfidence(auction);
    const leader = auction.bids.at(-1);
    const ending = auction.status === "live" && auction.endsAt - now <= 60_000 && auction.endsAt > now;
    return (
      <li key={auction.id}>
        <Link to={`/buyer/auctions/${auction.id}`} className={ending ? "au-card is-ending" : "au-card"}>
          <span className="au-card-top">
            <AuctionStatus auction={auction} />
            <span className="au-card-meta">{confidence.score}% yield confidence</span>
          </span>
          <h3>
            {auction.product} · grade {auction.grade}
          </h3>
          <p className="au-card-meta">
            {estimate(auction)} · harvest {formatDay(auction.harvestDay).toLowerCase()} · {auction.producer}
          </p>
          <p className="au-card-price">
            {vnd(leader ? currentBid(auction) : auction.startPrice)} <small>/kg {leader ? "" : "opening"}</small>
          </p>
          <PriceSparkline auction={auction} width={280} height={40} />
          <span className="au-card-foot">
            <span>
              {auction.bids.length} {auction.bids.length === 1 ? "bid" : "bids"}
            </span>
            <span className={leader?.self ? "is-you" : undefined}>{leader ? (leader.self ? "You lead" : `${leader.bidder} leads`) : "Be the first to bid"}</span>
          </span>
        </Link>
      </li>
    );
  };

  return (
    <main className="ph-main">
      <Link to="/buyer" className="ph-back">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Market</p>
          <h1>Find supply</h1>
          <p className="ph-hello-summary">Secure supply before it is harvested. The highest bid when the timer ends wins the right to buy the batch.</p>
        </div>
      </section>

      <SupplyTabs />

      <section className="ph-section" aria-labelledby="live-title">
        <h2 id="live-title" className="au-section-title">
          Live now <span className="ph-count-badge">{live.length}</span>
        </h2>
        {live.length === 0 ? <p className="ph-card ph-empty">No auction is open right now.</p> : <ul className="au-grid">{live.map(row)}</ul>}
      </section>

      {won.length > 0 && (
        <section className="ph-section" aria-labelledby="won-title">
          <h2 id="won-title" className="au-section-title">
            You won
          </h2>
          <ul className="au-grid">{won.map(row)}</ul>
        </section>
      )}

      {other.length > 0 && (
        <section className="ph-section" aria-labelledby="ended-title">
          <h2 id="ended-title" className="au-section-title">
            Ended or under review
          </h2>
          <ul className="au-grid">{other.map(row)}</ul>
        </section>
      )}
    </main>
  );
}
