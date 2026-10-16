import { Clock } from "lucide-react";
import { Countdown } from "@/components/orders/Countdown";
import { useNow } from "@/components/orders/useNow";
import { currentBid, type Auction } from "./auctionStore";
import { yieldConfidence } from "./yieldConfidence";
import { vnd } from "./format";
import "./auction.css";


/** Open · mm:ss left (Closing in the last minute), Closed, or Under review. */
export function AuctionStatus({ auction }: { auction: Auction }) {
  const now = useNow(1000);
  if (auction.status === "review") return <span className="au-status au-status--review">Under review</span>;
  if (auction.status === "closed" || now >= auction.endsAt) return <span className="au-status au-status--closed">Closed</span>;
  const closing = auction.endsAt - now <= 60_000;
  return (
    <span className={closing ? "au-status au-status--closing" : "au-status au-status--live"}>
      <Clock size={13} aria-hidden="true" /> {closing ? "Closing" : "Open"} · <Countdown expiresAt={auction.endsAt} /> left
    </span>
  );
}

/** The yield confidence score with its reasons and the caveat that it is not a promise. */
export function ConfidencePanel({ auction }: { auction: Auction }) {
  const confidence = yieldConfidence(auction);
  return (
    <section className={`au-confidence au-confidence--${confidence.level.toLowerCase()}`} aria-label="Yield confidence">
      <div className="au-confidence-score">
        <strong>{confidence.score}%</strong>
        <small>{confidence.level}</small>
      </div>
      <div>
        <p className="au-confidence-title">Yield confidence</p>
        <ul>
          {confidence.factors.map((factor) => (
            <li key={factor}>{factor}</li>
          ))}
        </ul>
        <p className="au-confidence-note">A decision aid from the estimate, the season and the farm's history, not a promise of the actual harvest.</p>
      </div>
    </section>
  );
}

/** Bids newest first; the leader is marked. */
export function BidHistory({ auction }: { auction: Auction }) {
  const bids = [...auction.bids].reverse();
  if (bids.length === 0) return <p className="au-muted">No bids yet. Opening price {vnd(auction.startPrice)}/kg.</p>;
  return (
    <ol className="au-bids">
      {bids.map((bid, index) => (
        <li key={bid.id} className={index === 0 ? "is-leading" : undefined}>
          <span>{bid.self ? "You" : bid.bidder}</span>
          <strong>{vnd(bid.pricePerKg)}/kg</strong>
          <small>{new Date(bid.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</small>
        </li>
      ))}
    </ol>
  );
}

/** Prices over time as a small line; the last point is the current bid. */
export function PriceSparkline({ auction, width = 220, height = 44 }: { auction: Auction; width?: number; height?: number }) {
  const prices = [auction.startPrice, ...auction.bids.map((bid) => bid.pricePerKg)];
  if (prices.length < 2) return <svg className="au-spark" width={width} height={height} aria-hidden="true" />;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const x = (index: number) => (index / (prices.length - 1)) * (width - 8) + 4;
  const y = (price: number) => height - 6 - ((price - min) / Math.max(1, max - min)) * (height - 12);
  const points = prices.map((price, index) => `${x(index)},${y(price)}`).join(" ");
  const last = prices.length - 1;
  return (
    <svg className="au-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Price went from ${vnd(min)} to ${vnd(max)} per kg`}>
      <polyline points={`4,${height} ${points} ${x(last)},${height}`} className="au-spark-fill" />
      <polyline points={points} className="au-spark-line" />
      <circle cx={x(last)} cy={y(prices[last])} r={3.5} className="au-spark-dot" />
    </svg>
  );
}

/** The countdown, big, over a bar of the time left; red in the last minute. */
export function AuctionTimer({ auction }: { auction: Auction }) {
  const now = useNow(1000);
  const total = Math.max(1, auction.endsAt - auction.openedAt);
  const left = Math.max(0, auction.endsAt - now);
  const ending = left > 0 && left <= 60_000;
  if (auction.status !== "live" || left === 0) return null;
  return (
    <div className={ending ? "au-timer is-ending" : "au-timer"}>
      <div className="au-timer-top">
        <span>{ending ? "Ending soon" : "Ends in"}</span>
        <Countdown expiresAt={auction.endsAt} />
      </div>
      <span className="au-timer-bar" aria-hidden="true">
        <span style={{ width: `${(left / total) * 100}%` }} />
      </span>
    </div>
  );
}

/** "Buyer B raised by 500 ₫ · 12 s ago". */
export function LastRaise({ auction }: { auction: Auction }) {
  const now = useNow(1000);
  const bids = auction.bids;
  const last = bids.at(-1);
  if (!last) return null;
  const before = bids.length > 1 ? bids[bids.length - 2].pricePerKg : auction.startPrice;
  const seconds = Math.max(0, Math.round((now - last.at) / 1000));
  const ago = seconds < 60 ? `${seconds} s ago` : seconds < 3600 ? `${Math.round(seconds / 60)} min ago` : `${Math.round(seconds / 3600)} h ago`;
  return (
    <p className={seconds < 8 ? "au-raise is-fresh" : "au-raise"} key={last.id}>
      {last.self ? "You" : last.bidder} raised by {vnd(last.pricePerKg - before)} · {ago}
    </p>
  );
}

/** Current bid and who leads, for list rows. */
export function LeadLine({ auction }: { auction: Auction }) {
  const leader = auction.bids.at(-1);
  if (!leader) return <span className="au-muted">Opening {vnd(auction.startPrice)}/kg</span>;
  return (
    <span>
      <strong>{vnd(currentBid(auction))}/kg</strong> <span className="au-muted">· {leader.self ? "you lead" : `${leader.bidder} leads`}</span>
    </span>
  );
}
