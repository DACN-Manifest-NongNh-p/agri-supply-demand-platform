import { NavLink } from "react-router-dom";
import { useAuctions } from "@/components/auction/auctionStore";
import { producer } from "../data/mockProducer";
import "@/components/orders/orders.css";

/** Batches has two sides: what the farm has declared, and the batches it sells before harvest by auction. */
export function BatchTabs() {
  const live = useAuctions().filter((auction) => auction.producer === producer.name && auction.status === "live").length;
  return (
    <nav className="ord-tabs" aria-label="Batches">
      <NavLink to="/producer/batches" end>
        All batches
      </NavLink>
      <NavLink to="/producer/auctions">
        Pre-harvest auctions {live > 0 && <span className="ph-count-badge">{live}</span>}
      </NavLink>
    </nav>
  );
}
