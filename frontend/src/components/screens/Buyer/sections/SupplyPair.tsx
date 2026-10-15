import { Link } from "react-router-dom";
import { useState } from "react";
import { ClipboardList, Sprout } from "lucide-react";
import { ScoreRing } from "../../Producer/sections/MatchScore";
import { formatDay, formatKg } from "../../Producer/data/format";
import { openOf, type SupplyCandidate } from "../data/demands";
import type { BuyerDemand, SupplyBatch } from "../data/mockBuyer";

/** Your demand ↔ score ↔ producer batch: the same pair layout as the producer's matches, seen from the other side. */
export function SupplyPair({ demand, openKg, candidate, ringSize = 88 }: { demand: BuyerDemand; openKg: number; candidate: SupplyCandidate; ringSize?: number }) {
  const { batch } = candidate;
  return (
    <div className="ph-featured-pair">
      <div className="ph-featured-side">
        <p className="ph-featured-kicker"><ClipboardList size={14} /> Your demand · {demand.id}</p>
        <p className="ph-featured-name">{demand.product} · {demand.gradeWanted}</p>
        <p className="ph-featured-big">{formatKg(openKg)}</p>
        <p className="ph-featured-meta">
          still open of {formatKg(demand.quantityKg)}
          <br />
          Needed by {formatDay(demand.neededByDay)}
        </p>
      </div>

      <div className="ph-featured-link" aria-hidden="true">
        <span className="ph-featured-line" />
        <ScoreRing score={candidate.score} size={ringSize} />
        <span className="ph-featured-line" />
      </div>

      <div className="ph-featured-side ph-featured-side--batch">
        <p className="ph-featured-kicker"><Sprout size={14} /> {batch.producer}</p>
        <p className="ph-featured-name"><Link to={`/buyer/supply/${batch.code}`}>{batch.code}</Link> · {batch.variety}, grade {batch.grade}</p>
        <p className="ph-featured-big">{formatKg(openOf(batch))}</p>
        <p className="ph-featured-meta">
          available · {batch.distanceKm} km away
          <br />
          Ready {formatDay(batch.readyDay)} · sell by {formatDay(batch.sellByDay)}
        </p>
      </div>
    </div>
  );
}

type ReserveProps = {
  batch: SupplyBatch;
  openKg: number;
  onReserve: (kg: number) => void;
  large?: boolean;
};

/** Quantity box plus button; starts at the most this batch can cover. */
export function ReserveControl({ batch, openKg, onReserve, large = false }: ReserveProps) {
  const max = Math.min(openOf(batch), openKg);
  const [kg, setKg] = useState(max);
  const valid = kg > 0 && kg <= max;

  return (
    <form
      className="bu-reserve"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onReserve(kg);
      }}
    >
      <label className="bu-reserve-qty">
        <span className="bu-sr-only">Quantity to reserve (kg)</span>
        <input
          type="number"
          min={1}
          max={max}
          value={kg}
          onChange={(event) => setKg(Number(event.target.value))}
          aria-invalid={!valid}
        />
        <span aria-hidden="true">kg</span>
      </label>
      <button type="submit" className={large ? "ph-btn ph-btn--primary ph-btn--large" : "ph-btn ph-btn--primary"} disabled={!valid}>
        Reserve from {batch.code}
      </button>
    </form>
  );
}
