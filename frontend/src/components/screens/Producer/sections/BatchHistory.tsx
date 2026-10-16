import { Link } from "react-router-dom";
import type { Batch, Delivery } from "../data/mockProducer";
import { ORDER_STAGE_LABEL, type ProducerOrder } from "../data/orders";
import type { MatchResult } from "../data/matching";
import { formatDay, formatKg } from "../data/format";
import { MatchScore } from "./MatchScore";

type Props = {
  batch: Batch;
  matches: MatchResult[];
  orders: ProducerOrder[];
  deliveries: Delivery[];
};

/** Where a batch has gone so far: system matches, orders on it, shipments. */
export function BatchHistory({ batch, matches, orders, deliveries }: Props) {
  const ownMatches = matches.flatMap((match) => {
    const candidate = match.candidates.find((item) => item.batch.code === batch.code);
    return candidate ? [{ demand: match.demand, score: candidate.score }] : [];
  });
  const ownOrders = orders.filter((item) => item.batch === batch.code);
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

      <section aria-labelledby={`hist-orders-${batch.code}`}>
        <h4 id={`hist-orders-${batch.code}`}>Orders</h4>
        {ownOrders.length === 0 ? (
          <p className="ph-muted">No orders on this batch yet.</p>
        ) : (
          <ul>
            {ownOrders.map((item) => (
              <li key={item.id}>
                <Link to="/producer/orders?tab=deliveries">{item.buyer}</Link>
                <small>{formatKg(item.quantityKg)} · {item.demandId}</small>
                <span className="ph-history-state">{ORDER_STAGE_LABEL[item.stage]}</span>
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
