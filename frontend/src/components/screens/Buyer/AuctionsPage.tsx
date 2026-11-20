// B3.2 Supplier-led auctions from the buyer's side: find open and scheduled auctions (FR-B3.2-10),
// follow your bids, and confirm results the supplier allocated to you.
import { Trophy } from "lucide-react";
import { AuctionDemo } from "../LandingPage/sections/Demos";
import { useNow } from "@/components/orders/useNow";
import { Link, useSearchParams } from "react-router-dom";
import { AUCTION_LABEL, GRADE_LABEL, zoneLabel } from "./model/catalog";
import { pendingActions, useBuyerData } from "./model/store";
import { formatClock, formatLeft, formatTime } from "./model/time";
import type { Auction } from "./model/types";
import { PageHead, Pill, Tabs } from "./ui/parts";
import { Deal, useMarketPrice } from "./sections/Deal";
import { kg, perKg } from "./ui/format";
import { AUCTION_TONE } from "./ui/tones";

type Tab = "open" | "mine";
type Sort = "ending" | "price";

/** The auctions closing first, as a light strip of compact tiles with a live clock. */
function EndingSoon({ auctions }: { auctions: Auction[] }) {
  const now = useNow(1000);
  const market = useMarketPrice();
  if (auctions.length === 0) return null;
  return (
    <section className="at-soon" aria-labelledby="ending-title">
      <h2 id="ending-title">
        <span className="at-live" aria-hidden="true" /> Ending soon
      </h2>
      <ol className="at-soon-list">
        {auctions.map((auction) => {
          const left = auction.endTime - now;
          const share = Math.max(0, Math.min(1, left / (auction.endTime - auction.startTime)));
          const hot = left < 3_600_000;
          return (
            <li key={auction.code}>
              <Link to={`/buyer/auctions/${auction.code}`} className={hot ? "at-soon-item is-hot" : "at-soon-item"}>
                <span className="at-soon-main">
                  <strong>
                    {auction.crop} <small>{kg(auction.quantity)}</small>
                  </strong>
                  <span>
                    {perKg(auction.startingPrice)} <Deal start={auction.startingPrice} market={market(auction)} />
                  </span>
                </span>
                <span className="at-soon-clock">{formatClock(left)}</span>
                <span className="at-soon-bar" aria-hidden="true">
                  <i style={{ width: `${share * 100}%` }} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** One auction as a table row: product, size, price against the market, a draining clock, your bid, the action. */
function AuctionRow({ auction }: { auction: Auction }) {
  const data = useBuyerData();
  const now = useNow(1000);
  const market = useMarketPrice()(auction);
  const bid = data.bids.find((item) => item.auctionCode === auction.code && item.status !== "WITHDRAWN");
  const allocation = data.auctionAllocations.find((item) => item.auctionCode === auction.code && item.status === "PENDING_CONFIRMATION");
  const active = auction.status === "ACTIVE";
  const left = auction.endTime - now;
  const soon = active && left < 3_600_000;
  const share = Math.max(0, Math.min(1, left / (auction.endTime - auction.startTime)));
  const to = `/buyer/auctions/${auction.code}`;
  const cta = allocation ? "Confirm" : active ? (bid?.status === "SUBMITTED" ? "Change bid" : "Bid") : "View";

  return (
    <tr className={allocation ? "is-won" : undefined}>
      <td>
        <Link to={to} className="at-product">
          <strong>{auction.crop}</strong>
          <span>{auction.variety} · {GRADE_LABEL[auction.grade]}</span>
          <small>{auction.supplier}</small>
        </Link>
      </td>
      <td className="at-num">
        <strong>{kg(auction.quantity)}</strong>
        <small className="at-sub">min {kg(auction.minBidQuantity)}</small>
      </td>
      <td className="at-num">
        <strong>{auction.startingPrice.toLocaleString("en-GB")}</strong> <small>₫/kg</small>
        <span className="at-sub">
          <Deal start={auction.startingPrice} market={market} />
        </span>
      </td>
      <td>
        {active ? (
          <span className="at-clock">
            <span className={soon ? "at-time is-soon" : "at-time"}>
              {soon ? formatClock(left) : `${formatLeft(left)} left`}
            </span>
            <span className={soon ? "at-drain is-soon" : "at-drain"} aria-hidden="true">
              <i style={{ width: `${share * 100}%` }} />
            </span>
          </span>
        ) : auction.status === "SCHEDULED" ? (
          <span className="at-time is-later">Opens {formatTime(auction.startTime)}</span>
        ) : (
          <Pill tone={AUCTION_TONE[auction.status]}>{AUCTION_LABEL[auction.status]}</Pill>
        )}
      </td>
      <td>
        {allocation ? (
          <span className="at-bid is-won">
            <Trophy size={13} aria-hidden="true" /> Won · {perKg(bid!.price)}
          </span>
        ) : bid ? (
          <span className="at-bid">{perKg(bid.price)}</span>
        ) : (
          <span className="at-none">—</span>
        )}
      </td>
      <td className="at-action">
        <Link to={to} className={cta === "View" ? "ph-btn" : "ph-btn ph-btn--primary"}>
          {cta}
        </Link>
      </td>
    </tr>
  );
}

export default function AuctionsPage() {
  const data = useBuyerData();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") === "mine" ? "mine" : "open") as Tab;
  const crop = params.get("crop") ?? "";
  const zone = params.get("zone") ?? "";
  const sort = (params.get("sort") === "price" ? "price" : "ending") as Sort;
  const pending = pendingActions(data);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const bidOn = new Set(data.bids.filter((bid) => bid.status !== "WITHDRAWN" || data.auctions.find((item) => item.code === bid.auctionCode)?.status === "ACTIVE").map((bid) => bid.auctionCode));
  const open = data.auctions
    .filter((auction) => (auction.status === "ACTIVE" || auction.status === "SCHEDULED") && (!crop || auction.crop === crop) && (!zone || auction.zone === zone))
    .sort((a, b) => (sort === "price" ? a.startingPrice - b.startingPrice : (a.status === "ACTIVE" ? a.endTime : a.startTime + 1e13) - (b.status === "ACTIVE" ? b.endTime : b.startTime + 1e13)));
  const mine = data.auctions.filter((auction) => bidOn.has(auction.code)).sort((a, b) => (b.endedAt ?? b.endTime) - (a.endedAt ?? a.endTime));
  const zones = [...new Set(data.auctions.map((auction) => auction.zone))];

  return (
    <main className="ph-main bf-page bf-auction-market">
      <PageHead
        eyebrow="Auctions"
        title="Supplier auctions"
        summary="Bid on lots that suppliers put up for auction."
        demo={<AuctionDemo />}
        help="Each auction has a starting price and a minimum quantity. Bid a price and a quantity before it ends; you can change or withdraw your bid until then. Other buyers never see your bid. When it ends, the supplier chooses bids and how much each gets, and you confirm within 24 hours."
      />

      {tab === "open" && !crop && !zone && (
        <EndingSoon auctions={data.auctions.filter((auction) => auction.status === "ACTIVE").sort((a, b) => a.endTime - b.endTime).slice(0, 3)} />
      )}

      <section className="ph-card bo-panel">
        <Tabs
          panel
          label="Show"
          value={tab}
          onChange={(id) => update("tab", id === "open" ? "" : id)}
          tabs={[
            { id: "open", label: "Open & upcoming", count: open.length },
            { id: "mine", label: "My bids", count: pending.auctionResults.length || mine.length, alert: pending.auctionResults.length > 0 },
          ]}
        />

        {tab === "open" && (
          <div className="bf-toolbar">
            <div className="bf-chips" role="group" aria-label="Product">
              <button type="button" className={!crop ? "ph-chip ph-chip--active" : "ph-chip"} onClick={() => update("crop", "")}>
                All products
              </button>
              {[...new Set(data.auctions.map((auction) => auction.crop))].map((name) => (
                <button key={name} type="button" className={crop === name ? "ph-chip ph-chip--active" : "ph-chip"} onClick={() => update("crop", name)}>
                  {name}
                </button>
              ))}
            </div>
            <div className="bf-toolbar-right">
              <select value={zone} onChange={(event) => update("zone", event.target.value)} aria-label="Ships from">
                <option value="">Any region</option>
                {zones.map((code) => (
                  <option key={code} value={code}>
                    {zoneLabel(code)}
                  </option>
                ))}
              </select>
              <select value={sort} onChange={(event) => update("sort", event.target.value === "ending" ? "" : event.target.value)} aria-label="Sort">
                <option value="ending">Ending soonest</option>
                <option value="price">Lowest starting price</option>
              </select>
            </div>
          </div>
        )}
        {(tab === "open" ? open : mine).length === 0 ? (
          <p className="ph-empty">{tab === "open" ? "No auction is open or scheduled for this filter." : "You have not bid on any auction yet."}</p>
        ) : (
          <div className="ph-table-scroll">
            <table className="at-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="at-num">Quantity</th>
                  <th className="at-num">Starting price</th>
                  <th>Time</th>
                  <th>Your bid</th>
                  <th aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {(tab === "open" ? open : mine).map((auction) => (
                  <AuctionRow key={auction.code} auction={auction} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
