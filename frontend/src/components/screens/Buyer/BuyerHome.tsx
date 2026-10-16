import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { DemandHero } from "./sections/DemandHero";
import { CompanyCard, DemandPipeline, IncomingDeliveries } from "./sections/SidePanels";
import { NewOnMarket, WeekAhead } from "./sections/HomeExtras";
import { buyer, deliveries } from "./data/mockBuyer";
import { fulfilmentOf, type DemandStatus } from "./data/demands";
import { useBuyer } from "./data/buyerContext";
import { greeting } from "../Producer/data/format";

export default function BuyerHome() {
  const { demands, allocations, alerts, deliveryIssues, supply } = useBuyer();

  const counts: Record<DemandStatus, number> = { new: 0, sourcing: 0, partial: 0, fulfilled: 0, completed: 0 };
  let needSupply = 0;
  for (const demand of demands) {
    const fulfilment = fulfilmentOf(demand, allocations);
    counts[fulfilment.status] += 1;
    // Same rule as the matching hero: anything not yet reserved or allocated still needs supply.
    if (fulfilment.openKg > 0) needSupply += 1;
  }

  return (
    <main className="ph-main">
      <section className="ph-hello">
        <div>
          <p className="ph-eyebrow">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1>
            {greeting()}, {buyer.contact.split(" ").at(-1)}.
          </h1>
          <p className="ph-hello-summary">
            {needSupply > 0
              ? `${needSupply} ${needSupply === 1 ? "demand still needs" : "demands still need"} supply`
              : "Every demand is fully sourced"}
            {alerts.length > 0 ? `. ${alerts.length} ${alerts.length === 1 ? "notification" : "notifications"} under the bell.` : "."}
          </p>
        </div>
        <Link to="/buyer/demands/new" className="ph-btn ph-btn--large">
          <Plus size={18} /> Post a demand
        </Link>
      </section>

      <DemandHero />

      <div className="ph-columns">
        <div className="ph-col-main">
          <IncomingDeliveries deliveries={deliveries} reported={deliveryIssues} />
          <WeekAhead demands={demands} allocations={allocations} deliveries={deliveries} />
          <NewOnMarket supply={supply} demands={demands} allocations={allocations} />
        </div>

        <aside className="ph-col-side">
          <CompanyCard />
          <DemandPipeline counts={counts} />
        </aside>
      </div>
    </main>
  );
}
