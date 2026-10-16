import { useState } from "react";
import { Gavel } from "lucide-react";
import { Link } from "react-router-dom";
import { AuctionStatus, LeadLine } from "@/components/auction/AuctionParts";
import { openAuction, useAuctions } from "@/components/auction/auctionStore";
import { vnd } from "@/components/auction/format";
import { yieldConfidence } from "@/components/auction/yieldConfidence";
import type { Batch } from "../data/mockProducer";
import { producer } from "../data/mockProducer";

const DURATIONS = [
  { minutes: 10, label: "10 minutes (demo)" },
  { minutes: 60, label: "1 hour" },
  { minutes: 24 * 60, label: "24 hours" },
];

/** On a batch not harvested yet: open a pre-harvest auction, or see the one already running. */
export function PreHarvestAuction({ batch }: { batch: Batch }) {
  const auctions = useAuctions();
  const existing = auctions.find((item) => item.batchCode === batch.code);
  const [open, setOpen] = useState(false);
  const [minKg, setMinKg] = useState(Math.round((batch.quantityKg * 0.9) / 100) * 100);
  const [maxKg, setMaxKg] = useState(batch.quantityKg);
  const [startPrice, setStartPrice] = useState(22000);
  const [minutes, setMinutes] = useState(DURATIONS[0].minutes);

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

  const draft = { estMinKg: minKg, estMaxKg: Math.max(minKg, maxKg), harvestDay: batch.harvestDay, farming: [] as string[] };
  const confidence = yieldConfidence(draft);

  return (
    <section className="ph-card au-batch" aria-label="Pre-harvest auction">
      <p className="ph-eyebrow">
        <Gavel size={14} aria-hidden="true" /> Not harvested yet
      </p>
      <p className="au-batch-lead">Sell it before harvest: buyers bid to secure it, the highest bid when the timer ends wins.</p>
      {open ? (
        <form
          className="au-open-form"
          onSubmit={(event) => {
            event.preventDefault();
            openAuction({
              batchCode: batch.code,
              producer: producer.name,
              region: producer.region,
              product: batch.product,
              variety: batch.variety,
              grade: batch.grade,
              estMinKg: draft.estMinKg,
              estMaxKg: draft.estMaxKg,
              harvestDay: batch.harvestDay,
              startPrice,
              step: 500,
              farming: [],
              minutes,
            });
            setOpen(false);
          }}
        >
          <label>
            Estimated yield, from
            <input type="number" min={100} step={100} value={minKg} onChange={(event) => setMinKg(Number(event.target.value) || 0)} />
          </label>
          <label>
            to (kg)
            <input type="number" min={100} step={100} value={maxKg} onChange={(event) => setMaxKg(Number(event.target.value) || 0)} />
          </label>
          <label>
            Opening price per kg
            <input type="number" min={1000} step={500} value={startPrice} onChange={(event) => setStartPrice(Number(event.target.value) || 0)} />
          </label>
          <label>
            Runs for
            <select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}>
              {DURATIONS.map((item) => (
                <option key={item.minutes} value={item.minutes}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <p className="au-open-confidence">
            Yield confidence <strong>{confidence.score}% · {confidence.level}</strong>
            <span className="au-muted"> · {confidence.factors[0]}</span>
          </p>
          <div className="au-open-actions">
            <button type="submit" className="ph-btn ph-btn--primary" disabled={minKg <= 0 || startPrice <= 0}>
              Open auction at {vnd(startPrice)}/kg
            </button>
            <button type="button" className="ph-text-btn" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="ph-btn" onClick={() => setOpen(true)}>
          <Gavel size={15} /> Open a pre-harvest auction
        </button>
      )}
    </section>
  );
}
