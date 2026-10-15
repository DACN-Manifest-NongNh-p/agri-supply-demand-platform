import { Link } from "react-router-dom";
import type { Batch, Delivery, Offer } from "../data/mockProducer";
import type { MatchResult } from "../data/matching";
import { formatDay, formatKg } from "../data/format";
import { MatchScore } from "./MatchScore";

const OFFER_STATE: Record<Offer["status"], string> = {
  sent: "Waiting for buyer",
  accepted: "Accepted by buyer",
  allocated: "Allocated, confirm on home",
  confirmed: "Confirmed",
  declined: "Declined",
};

type Props = {
  batch: Batch;
  matches: MatchResult[];
  offers: Offer[];
  deliveries: Delivery[];
};

/** Where a batch has gone so far: system matches, offers made, shipments. */
export function BatchHistory({ batch, matches, offers, deliveries }: Props) {
  const ownMatches = matches.flatMap((match) => {
    const candidate = match.candidates.find((item) => item.batch.code === batch.code);
    return candidate ? [{ demand: match.demand, score: candidate.score }] : [];
  });
  const ownOffers = offers.filter((item) => item.batch === batch.code);
  const ownDeliveries = deliveries.filter((item) => item.batch === batch.code);

  return (
    <div className="ph-history">
      <section aria-labelledby={`hist-matches-${batch.code}`}>
        <h4 id={`hist-matches-${batch.code}`}>Matching demand</h4>
        {ownMatches.length === 0 ? (
          <p className="ph-muted">No open demand fits this batch right now.</p>
        ) : (
          <ul>
            {ownMatches.map(({ demand, score }) => (
              <li key={demand.id}>
                <Link to={`/producer/demand?open=${demand.id}`}>{demand.buyer}</Link>
                <small>{formatKg(demand.quantityKg)} by {formatDay(demand.neededByDay)}</small>
                <MatchScore score={score} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby={`hist-offers-${batch.code}`}>
        <h4 id={`hist-offers-${batch.code}`}>Offers</h4>
        {ownOffers.length === 0 ? (
          <p className="ph-muted">No offers made from this batch yet.</p>
        ) : (
          <ul>
            {ownOffers.map((item) => (
              <li key={item.demandId}>
                <span>{item.buyer}</span>
                <small>{formatKg(item.quantityKg)} · sent {formatDay(item.sentDay)}</small>
                <span className="ph-history-state">{OFFER_STATE[item.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby={`hist-deliveries-${batch.code}`}>
        <h4 id={`hist-deliveries-${batch.code}`}>Deliveries</h4>
        {ownDeliveries.length === 0 ? (
          <p className="ph-muted">Nothing shipped from this batch yet.</p>
        ) : (
          <ul>
            {ownDeliveries.map((item) => (
              <li key={item.id}>
                <Link to={`/producer/deliveries/${item.id}`}>{item.id} to {item.buyer}</Link>
                <small>{formatKg(item.quantityKg)} · {item.eta}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
