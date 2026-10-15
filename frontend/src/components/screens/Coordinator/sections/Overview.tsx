import { ArrowRight, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { deliveryStatus, etaText } from "../../Producer/data/deliveries";
import { formatDayInText, formatKg } from "../../Producer/data/format";
import { BALANCE_WINDOWS, type IdleBatch, type ProductBalance } from "../data/market";
import type { MarketDelivery } from "../data/mockCoordinator";

type BalanceProps = { balance: ProductBalance[]; days: number; onDaysChange: (days: number) => void };

/** Open demand against sellable supply for the coming days, one row per product. */
export function SupplyBalance({ balance, days, onDaysChange }: BalanceProps) {
  const max = Math.max(1, ...balance.flatMap((row) => [row.demandKg, row.supplyKg]));
  return (
    <section className="ph-card co-balance" aria-labelledby="balance-title">
      <div className="ph-section-head">
        <div>
          <h2 id="balance-title">Supply and demand</h2>
          <p className="ph-section-sub">Open demand due in the next {days} days against supply that can ship in time.</p>
        </div>
        <div className="co-pills" role="group" aria-label="Window">
          {BALANCE_WINDOWS.map((option) => (
            <button key={option} type="button" aria-pressed={days === option} onClick={() => onDaysChange(option)}>
              {option} days
            </button>
          ))}
        </div>
      </div>
      <ul className="co-balance-legend" aria-hidden="true">
        <li><span className="co-swatch co-swatch--demand" /> Demand</li>
        <li><span className="co-swatch co-swatch--supply" /> Supply</li>
      </ul>

      <ul className="co-balance-rows">
        {balance.map((row) => {
          const gap = row.supplyKg - row.demandKg;
          return (
            <li key={row.product}>
              <span className="co-balance-product">{row.product}</span>
              <span className="co-balance-bars">
                <span className="co-bar co-bar--demand" style={{ width: `${(row.demandKg / max) * 100}%` }} title={`Demand ${formatKg(row.demandKg)}`} />
                <span className="co-bar co-bar--supply" style={{ width: `${(row.supplyKg / max) * 100}%` }} title={`Supply ${formatKg(row.supplyKg)}`} />
              </span>
              <span className="co-balance-figures">
                {formatKg(row.demandKg)} / {formatKg(row.supplyKg)}
              </span>
              <span className={gap < 0 ? "co-balance-gap co-low" : "co-balance-gap"}>
                {gap < 0 ? `${formatKg(-gap)} short` : gap === 0 ? "even" : `${formatKg(gap)} spare`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Active deliveries, problems first; the coordinator is the one who calls the carrier. */
export function OnTheRoad({ deliveries }: { deliveries: MarketDelivery[] }) {
  const active = deliveries
    .filter((delivery) => delivery.step < 3)
    .sort((a, b) => Number(deliveryStatus(b) === "issue") - Number(deliveryStatus(a) === "issue"));

  return (
    <section className="ph-card co-side-list" aria-labelledby="road-title">
      <div className="ph-section-head">
        <h2 id="road-title">On the road</h2>
        <Link to="/coordinator/deliveries" className="ph-link-btn">
          All <ArrowRight size={14} />
        </Link>
      </div>
      {active.length === 0 && <p className="ph-empty">No trucks on the road from here.</p>}
      <ul>
        {active.map((delivery) => (
          <li key={delivery.id}>
            <Link to={`/coordinator/deliveries/${delivery.id}`}>
              <span className="co-side-top">
                <span>{delivery.id} · {delivery.product}</span>
                {deliveryStatus(delivery) === "issue" && <TriangleAlert size={14} className="co-warn-icon" aria-label="Has a problem" />}
              </span>
              <span className="ph-muted">
                {delivery.fromShort} → {delivery.toShort} · {etaText(delivery)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function IdleSupply({ batches }: { batches: IdleBatch[] }) {
  return (
    <section className="ph-card co-side-list" id="idle" aria-labelledby="idle-title">
      <div className="ph-section-head">
        <div>
          <h2 id="idle-title">Supply without a buyer</h2>
          <p className="ph-section-sub">No open demand accepts these.</p>
        </div>
      </div>
      {batches.length === 0 ? (
        <p className="ph-muted">Every open batch fits some demand.</p>
      ) : (
        <ul>
          {batches.map(({ batch, openKg }) => (
            <li key={batch.code}>
              <Link to="/coordinator/matching?tab=gaps">
                <span className="co-side-top">
                  <span>{batch.code} · {batch.product}, grade {batch.grade}</span>
                  <span>{formatKg(openKg)}</span>
                </span>
                <span className="ph-muted">
                  {batch.producer} · sells by {formatDayInText(batch.sellByDay)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
