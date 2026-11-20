import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BuyerTopBar } from "./sections/BuyerTopBar";
import { PartyDrawer } from "@/components/parties/PartyDrawer";
import { useMessageSimulation } from "@/lib/messageStore";
import { SELF, startBuyerClock } from "./model/store";
import { VerificationBanner } from "./ui/parts";
// The buyer area reuses the producer styles (same layout, cards and palette) and adds its own.
import "../Producer/styles/ProducerHome.css";
import "./styles/Buyer.css";
import "./styles/BuyerFlow.css";
import "./styles/BuyOrders.css";

/** Shell for all buyer pages: top bar, the verification banner, and the clock that drives deadlines. */
export default function BuyerLayout() {
  const location = useLocation();
  useMessageSimulation();

  useEffect(() => {
    startBuyerClock();
  }, []);

  // Router navigation does not scroll on its own: jump to #section links, otherwise to the top.
  useEffect(() => {
    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  return (
    <div className="producer-home buyer-area" id="top">
      <BuyerTopBar />
      <VerificationBanner />
      <Outlet />
      <PartyDrawer viewer={{ area: "buyer", self: SELF }} />
    </div>
  );
}
