import { NavLink } from "react-router-dom";
import { useAuctions } from "@/components/auction/auctionStore";
import "@/components/orders/orders.css";

/** Find supply has two sides: batches on the market now, and batches not harvested yet, sold by auction. */
export function SupplyTabs() {
  const live = useAuctions().filter((auction) => auction.status === "live").length;
  return (
    <nav className="ord-tabs" aria-label="Find supply">
      <NavLink to="/buyer/supply" end>
        Ready now
      </NavLink>
      <NavLink to="/buyer/auctions">
        Pre-harvest auctions {live > 0 && <span className="ph-count-badge">{live}</span>}
      </NavLink>
    </nav>
  );
}
