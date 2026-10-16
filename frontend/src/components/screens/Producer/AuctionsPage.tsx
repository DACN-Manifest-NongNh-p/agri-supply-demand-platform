import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { AuctionStatus, AuctionTimer, BidHistory, ConfidencePanel, LastRaise, PriceSparkline } from "@/components/auction/AuctionParts";
import { currentBid, recordHarvest, reportRisk, useAuctions, type Auction } from "@/components/auction/auctionStore";
import { estimate, vnd } from "@/components/auction/format";
import { useNow } from "@/components/orders/useNow";
import { formatDay } from "./data/format";
import { producer } from "./data/mockProducer";
import { BatchTabs } from "./sections/BatchTabs";

const RISKS = ["Storm or flood damage", "Pest or disease", "Harvest date moved", "Yield well below the estimate"];

function AuctionItem({ auction }: { auction: Auction }) {
  const now = useNow(1000);
  const [reporting, setReporting] = useState(false);
  const [risk, setRisk] = useState(RISKS[0]);
  const [actual, setActual] = useState(Math.round((auction.estMinKg + auction.estMaxKg) / 2));
  const leader = auction.bids.at(-1);
  const ended = auction.status === "closed" || now >= auction.endsAt;

  return (
    <li id={`auction-${auction.id}`} className="ph-card au-producer">
      <div className="au-producer-head">
        <div>
          <p className="ph-eyebrow">
            {auction.id} · {auction.batchCode}
          </p>
          <h2>
            {auction.product} · grade {auction.grade}
          </h2>
          <p className="au-muted">
            {estimate(auction)} · harvest {formatDay(auction.harvestDay).toLowerCase()} · opened at {vnd(auction.startPrice)}/kg
          </p>
        </div>
        <AuctionStatus auction={auction} />
      </div>

      <div className="au-producer-body">
        <div>
          <AuctionTimer auction={auction} />
          <p className="au-current">
            <span key={auction.bids.length} className={auction.bids.length ? "au-current-value" : undefined}>
              {leader ? vnd(currentBid(auction)) : vnd(auction.startPrice)}
            </span>{" "}
            <small>/kg</small>
          </p>
          <p className="au-lead au-muted">
            {leader ? `${auction.bids.length} bids · ${leader.bidder} leads` : "No bids yet"}
            {leader && ` · +${Math.round((currentBid(auction) / auction.startPrice - 1) * 100)}% over the opening price`}
          </p>
          <LastRaise auction={auction} />
          <PriceSparkline auction={auction} width={320} height={48} />

          {ended && leader && (
            <div className="au-result is-won">
              <strong>Future supply commitment with {leader.bidder}</strong>
              {vnd(currentBid(auction))}/kg for the harvest {formatDay(auction.harvestDay).toLowerCase()}.
              {auction.actualKg
                ? ` Harvested ${auction.actualKg.toLocaleString("en-GB")} kg (estimate ${estimate(auction)}): the batch moves on as a normal order, ≈ ${vnd(auction.actualKg * currentBid(auction))}.`
                : " Record the actual quantity once harvested; the batch then follows the normal order flow."}
            </div>
          )}
          {ended && !leader && (
            <div className="au-result">
              <strong>No winner</strong>
              The batch stays on the market and matching picks it up once it is ready.
            </div>
          )}
          {auction.risk && <p className="au-message au-message--error">Reported: {auction.risk}. A coordinator is reviewing the auction.</p>}

          <div className="au-producer-actions">
            {ended && leader && !auction.actualKg && (
              <form
                className="au-harvest"
                onSubmit={(event) => {
                  event.preventDefault();
                  recordHarvest(auction.id, actual);
                }}
              >
                <label>
                  Actual harvest (kg)
                  <input type="number" min={0} step={50} value={actual} onChange={(event) => setActual(Number(event.target.value) || 0)} />
                </label>
                <button type="submit" className="ph-btn ph-btn--primary">
                  Record harvest
                </button>
              </form>
            )}
            {!auction.risk && !auction.actualKg && (
              <button type="button" className="ph-btn ph-btn--warn" onClick={() => setReporting((value) => !value)} aria-expanded={reporting}>
                Report a risk before harvest
              </button>
            )}
          </div>
          {reporting && !auction.risk && (
            <form
              className="au-harvest"
              onSubmit={(event) => {
                event.preventDefault();
                reportRisk(auction.id, risk.toLowerCase());
                setReporting(false);
              }}
            >
              <label>
                What happened
                <select value={risk} onChange={(event) => setRisk(event.target.value)}>
                  {RISKS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="ph-btn">
                Send to coordinator
              </button>
            </form>
          )}
          <ConfidencePanel auction={auction} />
        </div>
        <div>
          <h3 className="au-section-title">Bids, live</h3>
          <BidHistory auction={auction} />
        </div>
      </div>
    </li>
  );
}

/** The farm's pre-harvest auctions, with bids arriving live. */
export default function ProducerAuctionsPage() {
  const auctions = useAuctions().filter((auction) => auction.producer === producer.name);
  const location = useLocation();

  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  return (
    <main className="ph-main">
      <Link to="/producer" className="ph-back">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Supply</p>
          <h1>Batches</h1>
          <p className="ph-hello-summary">Sell batches before harvest: bids arrive live, the highest one when the timer ends wins. Open an auction from a batch not harvested yet.</p>
        </div>
      </section>

      <BatchTabs />

      {auctions.length === 0 ? (
        <p className="ph-card ph-empty">
          No auctions yet. In <Link to="/producer/batches">All batches</Link>, pick a batch that is not harvested yet and open one.
        </p>
      ) : (
        <ul className="au-list">
          {auctions.map((auction) => (
            <AuctionItem key={auction.id} auction={auction} />
          ))}
        </ul>
      )}
    </main>
  );
}
