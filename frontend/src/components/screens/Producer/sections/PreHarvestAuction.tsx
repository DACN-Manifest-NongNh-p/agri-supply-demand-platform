import { Gavel } from "lucide-react";
import { Link } from "react-router-dom";
import { AuctionStatus, LeadLine } from "@/components/auction/AuctionParts";
import { useAuctions } from "@/components/auction/auctionStore";
import type { Batch } from "../data/mockProducer";

/** On a batch not harvested yet: open a pre-harvest auction, or see the one already running. */
export function PreHarvestAuction({ batch }: { batch: Batch }) {
  const auctions = useAuctions();
  const existing = auctions.find((item) => item.batchCode === batch.code);

  if (batch.status !== "expected" && !existing) return null;

  if (existing) {
    return (
      <section className="ph-card au-batch" aria-label="Pre-harvest auction">
        <p className="ph-eyebrow">
          <Gavel size={14} aria-hidden="true" /> Pre-harvest auction {existing.id}
        </p>
        <div className="au-batch-row">
          <LeadLine auction={existing} />
          <AuctionStatus auction={existing} />
          <Link to={`/producer/auctions#auction-${existing.id}`} className="ph-link-btn">
            Follow the auction
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="ph-card au-batch" aria-label="Pre-harvest auction">
      <p className="ph-eyebrow">
        <Gavel size={14} aria-hidden="true" /> Not harvested yet
      </p>
      <p className="au-batch-lead">Sell it before harvest: buyers bid to secure it, the highest bid when the timer ends wins.</p>
      <Link to={`/producer/auctions/new?batch=${batch.code}`} className="ph-btn">
        <Gavel size={15} /> Open a pre-harvest auction
      </Link>
    </section>
  );
}
