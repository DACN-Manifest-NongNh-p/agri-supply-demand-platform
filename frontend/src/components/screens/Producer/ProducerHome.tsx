import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { AttentionList } from "./sections/AttentionList";
import { HarvestPreview } from "./sections/HarvestPreview";
import { MatchHero } from "./sections/MatchHero";
import { MarketInsights } from "./sections/MarketInsights";
import { Deliveries, FarmCard } from "./sections/SidePanels";
import { deliveries, demands, insights, producer, tasks } from "./data/mockProducer";
import { matchAll } from "./data/matching";
import { greeting } from "./data/format";
import { useProducer } from "./data/producerContext";

export default function ProducerHome() {
  const { batches, outcomes, resolveTask, offers, offer, openTasks, deliveryIssues } = useProducer();

  const matches = matchAll(demands, batches);
  const openMatches = matches.filter((match) => match.best && !offers[match.demand.id]).length;

  return (
    <main className="ph-main">
      <section className="ph-hello">
        <div>
          <p className="ph-eyebrow">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1>
            {greeting()}, {producer.contact.split(" ").at(-1)}.
          </h1>
          <p className="ph-hello-summary">
            {openMatches > 0
              ? `${openMatches} ${openMatches === 1 ? "buyer is" : "buyers are"} waiting for an offer from you`
              : "Every match has an offer from you"}
            {openTasks > 0 ? `, and ${openTasks} ${openTasks === 1 ? "thing needs" : "things need"} your attention.` : "."}
          </p>
        </div>
        <Link to="/producer/batches?declare=1" className="ph-btn ph-btn--large">
          <Plus size={18} /> Declare a new batch
        </Link>
      </section>

      <MatchHero matches={matches} offers={offers} onOffer={offer} />

      <div className="ph-columns">
        <div className="ph-col-main">
          <AttentionList tasks={tasks} outcomes={outcomes} onResolve={resolveTask} />
          <HarvestPreview />
          <Deliveries deliveries={deliveries} reported={deliveryIssues} />
        </div>

        <aside className="ph-col-side">
          <FarmCard farm={producer} />
          <MarketInsights insights={insights} />
        </aside>
      </div>
    </main>
  );
}
