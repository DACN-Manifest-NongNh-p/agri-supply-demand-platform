import { ArrowRight, Check, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { deliveryStatus, etaText } from "../../Producer/data/deliveries";
import { formatDayInText, formatKg } from "../../Producer/data/format";
import { RULES } from "@/lib/site";
import { BALANCE_WINDOWS, type BoardRow, type ProductBalance, type UnsoldBatch, type UnsoldReason } from "../data/market";
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
    <section className="ph-card co-side-list co-road" aria-labelledby="road-title">
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

function sellsBy(day: number) {
  if (day === 0) return "sells by today";
  if (day === 1) return "sells by tomorrow";
  return `sells by ${formatDayInText(day)}`;
}

function ReasonTag({ reason }: { reason: UnsoldReason }) {
  if (reason.kind === "no_demand") return <span className="co-unsold-tag">No demand accepts it</span>;
  if (reason.kind === "decision") return <span className="co-unsold-tag co-unsold-tag--act">Fits {reason.demandId}, needs your decision</span>;
  return <span className="co-unsold-tag co-unsold-tag--act">Fits {reason.demandId}, not held yet</span>;
}

function UnsoldRow({ item }: { item: UnsoldBatch }) {
  const { batch, openKg } = item;
  return (
    <li key={batch.code}>
      <Link to={item.to}>
        <span className="co-side-top">
          <span>
            {batch.code} · {batch.product}, grade {batch.grade}
          </span>
          <span>{formatKg(openKg)}</span>
        </span>
        <span className="ph-muted">
          {batch.producer} · <span className={batch.sellByDay <= 1 ? "co-low" : undefined}>{sellsBy(batch.sellByDay)}</span>
        </span>
        <ReasonTag reason={item.reason} />
      </Link>
    </li>
  );
}

/** Batches with no buyer and more time left; the rest are in the Gaps tab. */
const LATER_COUNT = 4;

/** Open kilograms nobody has bought: what must sell within a few days first, then what nobody wants. */
export function UnsoldSupply({ batches }: { batches: UnsoldBatch[] }) {
  const soon = batches.filter((item) => item.soon);
  const later = batches.filter((item) => !item.soon);
  const soonKg = soon.reduce((sum, item) => sum + item.openKg, 0);

  return (
    <section className="ph-card co-side-list" id="idle" aria-labelledby="idle-title">
      <div className="ph-section-head">
        <div>
          <h2 id="idle-title">Unsold supply</h2>
          <p className="ph-section-sub">
            {soon.length > 0 ? `${formatKg(soonKg)} must sell within ${RULES.sellSoonDays} days` : "Nothing unsold is close to its sell-by date."}
          </p>
        </div>
      </div>
      {batches.length === 0 ? (
        <p className="ph-muted">Every open batch is held or has a buyer in sight.</p>
      ) : (
        <>
          {soon.length > 0 && (
            <>
              <p className="co-unsold-group co-unsold-group--soon">Selling within {RULES.sellSoonDays} days</p>
              <ul>
                {soon.map((item) => (
                  <UnsoldRow key={item.batch.code} item={item} />
                ))}
              </ul>
            </>
          )}
          {later.length > 0 && (
            <>
              <p className="co-unsold-group">No buyer yet</p>
              <ul>
                {later.slice(0, LATER_COUNT).map((item) => (
                  <UnsoldRow key={item.batch.code} item={item} />
                ))}
              </ul>
              {later.length > LATER_COUNT && (
                <Link to="/coordinator/matching?tab=gaps" className="ph-link-btn co-unsold-more">
                  See all {later.length} in Gaps <ArrowRight size={14} />
                </Link>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

function neededBy(day: number) {
  if (day === 0) return "needed today";
  if (day === 1) return "needed tomorrow";
  return `needed ${formatDayInText(day)} · ${day} days left`;
}


type UnmetProps = { rows: BoardRow[]; notified: Record<string, boolean>; onAsk: (demandId: string) => void };

/** The other side of unsold supply: open demand that no declared batch can cover, soonest first. */
export function UnmetDemand({ rows, notified, onAsk }: UnmetProps) {
  const unmet = rows.filter((row) => !row.best).sort((a, b) => a.demand.neededByDay - b.demand.neededByDay);
  const openKg = unmet.reduce((sum, row) => sum + row.fulfilment.openKg, 0);

  return (
    <section className="ph-card co-side-list co-unmet" aria-labelledby="unmet-title">
      <div className="ph-section-head">
        <div>
          <h2 id="unmet-title">Unmet demand</h2>
          <p className="ph-section-sub">
            {unmet.length > 0 ? `${formatKg(openKg)} buyers need that no declared batch can cover` : "Every open demand has supply in sight."}
          </p>
        </div>
        {unmet.length > 0 && (
          <Link to="/coordinator/matching?tab=gaps" className="ph-link-btn">
            Gaps <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {unmet.length > 0 && (
        <ul>
          {unmet.map(({ demand, fulfilment, reason }) => {
            const urgent = demand.neededByDay <= RULES.dueSoonDays;
            return (
              <li key={demand.id} className="co-unmet-row">
                <Link to={`/coordinator/matching?tab=gaps#demand-${demand.id}`}>
                  <span className="co-side-top">
                    <span>
                      {demand.id} · {demand.buyer}
                    </span>
                    <span>
                      {formatKg(fulfilment.openKg)}
                      {fulfilment.openKg < demand.quantityKg && <small className="ph-muted"> of {formatKg(demand.quantityKg)}</small>}
                    </span>
                  </span>
                  <span className="ph-muted">
                    {demand.product}, {demand.gradeWanted.toLowerCase()} · <span className={urgent ? "co-low" : undefined}>{neededBy(demand.neededByDay)}</span>
                  </span>
                  {reason && <span className="co-unmet-reason">{reason}</span>}
                </Link>
                {notified[demand.id] ? (
                  <span className="co-done co-unmet-action">
                    <Check size={13} aria-hidden="true" /> Producers asked
                  </span>
                ) : (
                  <button type="button" className="ph-btn co-unmet-action" onClick={() => onAsk(demand.id)}>
                    Ask producers
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
