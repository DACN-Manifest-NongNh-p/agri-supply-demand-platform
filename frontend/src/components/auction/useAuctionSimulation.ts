import { useEffect } from "react";
import { closeEnded, getAuctions, minNextBid, placeBid } from "./auctionStore";

/** How often the simulated market looks at the open auctions. */
const TICK_MS = 4_000;
const RIVALS = ["Buyer A", "Buyer B", "Buyer C", "Buyer D"];

/**
 * Demo only: other buyers bid now and then on live auctions (more often near the end), and auctions
 * close when their time is up. Their bids go through the same compare-and-set as the user's, so a
 * user bid made on an old version is refused, exactly as a server would refuse it.
 */
export function useAuctionSimulation() {
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      closeEnded(now);
      for (const auction of getAuctions()) {
        if (auction.status !== "live") continue;
        const left = auction.endsAt - now;
        const chance = left < 90_000 ? 0.45 : left < 10 * 60_000 ? 0.2 : 0.06;
        if (Math.random() > chance) continue;
        // Rivals stop at about 20 % over the start price.
        if (minNextBid(auction) > auction.startPrice * 1.2) continue;
        const leader = auction.bids.at(-1)?.bidder;
        const bidder = RIVALS.filter((name) => name !== leader)[Math.floor(Math.random() * (RIVALS.length - 1))];
        placeBid(auction.id, minNextBid(auction) + (Math.random() < 0.3 ? auction.step : 0), auction.version, bidder, false, now);
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, []);
}
