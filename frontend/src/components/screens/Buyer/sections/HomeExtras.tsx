import { ArrowRight, CalendarClock, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { dateFromToday, formatDay, formatKg } from "../../Producer/data/format";
import { fulfilmentOf, openOf, scoreSupply } from "../data/demands";
import { buyer, type Allocation, type BuyerDelivery, type BuyerDemand, type SupplyBatch } from "../data/mockBuyer";

const DAYS = 7;
const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short" });

type WeekItem = { id: string; kind: "due" | "arrives"; title: string; detail: string; to: string };

/** "Today, 17:00" → day 0; deliveries further out have no day in the demo data. */
function arrivalDay(eta: string) {
  if (/^today/i.test(eta)) return 0;
  if (/^tomorrow/i.test(eta)) return 1;
  return undefined;
}

type WeekProps = { demands: BuyerDemand[]; allocations: Allocation[]; deliveries: BuyerDelivery[] };

/** The next seven days: which demands fall due and which shipments arrive. */
export function WeekAhead({ demands, allocations, deliveries }: WeekProps) {
  const days: WeekItem[][] = Array.from({ length: DAYS }, () => []);

  for (const demand of demands) {
    const { status, openKg } = fulfilmentOf(demand, allocations);
    if (status === "completed" || demand.neededByDay < 0 || demand.neededByDay >= DAYS) continue;
    days[demand.neededByDay].push({
      id: `due-${demand.id}`,
      kind: "due",
      title: `${demand.id} due`,
      detail: openKg > 0 ? `${formatKg(openKg)} ${demand.product.toLowerCase()} still open` : `${formatKg(demand.quantityKg)} ${demand.product.toLowerCase()}`,
      to: `/buyer/demands/${demand.id}`,
    });
  }
  for (const delivery of deliveries) {
    const day = delivery.step < 3 ? arrivalDay(delivery.eta) : undefined;
    if (day === undefined) continue;
    days[day].push({
      id: `arrives-${delivery.id}`,
      kind: "arrives",
      title: `${delivery.id} arrives ${delivery.eta.split(", ")[1]?.replace(/\s*\(revised\)/, "") ?? ""}`.trim(),
      detail: `${formatKg(delivery.quantityKg)} ${delivery.product.toLowerCase()}`,
      to: `/buyer/deliveries/${delivery.id}`,
    });
  }

  return (
    <section className="ph-card bu-week" aria-labelledby="week-title">
      <div className="ph-section-head">
        <h2 id="week-title">This week</h2>
        <span className="bu-week-legend" aria-hidden="true">
          <span>
            <CalendarClock size={13} /> demand due
          </span>
          <span>
            <Truck size={13} /> arriving
          </span>
        </span>
      </div>
      <ol className="bu-week-days">
        {days.map((items, day) => {
          const date = dateFromToday(day);
          return (
            <li key={day} className={day === 0 ? "bu-week-day is-today" : "bu-week-day"}>
              <p className="bu-week-date">
                <small>{day === 0 ? "Today" : weekday.format(date)}</small>
                <strong>{date.getDate()}</strong>
              </p>
              {items.length === 0 ? (
                <p className="bu-week-none">—</p>
              ) : (
                <ul>
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link to={item.to} className={`bu-week-item bu-week-item--${item.kind}`}>
                        {item.kind === "due" ? <CalendarClock size={13} aria-hidden="true" /> : <Truck size={13} aria-hidden="true" />}
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.detail}</small>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const UNAVAILABLE: SupplyBatch["status"][] = ["in_transit", "delivered"];
const NEW_COUNT = 4;

type SupplyProps = { supply: SupplyBatch[]; demands: BuyerDemand[]; allocations: Allocation[] };

/**
 * Batches of what the buyer usually orders, soonest ready first, each with the open demand it
 * fits, or a nudge to post one: supply worth knowing about before it is gone.
 */
export function NewOnMarket({ supply, demands, allocations }: SupplyProps) {
  const open = demands
    .map((demand) => ({ demand, openKg: fulfilmentOf(demand, allocations).openKg }))
    .filter((item) => item.openKg > 0 && item.demand.neededByDay >= 0);

  const batches = supply
    .filter((batch) => buyer.products.includes(batch.product) && !UNAVAILABLE.includes(batch.status) && openOf(batch) > 0 && batch.sellByDay >= 0)
    .sort((a, b) => a.readyDay - b.readyDay)
    .slice(0, NEW_COUNT)
    .map((batch) => {
      const fits = open
        .filter((item) => item.demand.product === batch.product)
        .map((item) => ({ demandId: item.demand.id, candidate: scoreSupply(item.demand, batch, item.openKg) }))
        .filter((item) => item.candidate.eligible)
        .sort((a, b) => b.candidate.score - a.candidate.score)[0];
      return { batch, fits };
    });

  return (
    <section className="ph-card bu-market" aria-labelledby="market-title">
      <div className="ph-section-head">
        <div>
          <h2 id="market-title">On the market</h2>
          <p className="ph-section-sub">What you usually buy, soonest ready first.</p>
        </div>
        <Link to="/buyer/supply" className="ph-link-btn">
          Find supply <ArrowRight size={14} />
        </Link>
      </div>
      <ul className="bu-market-grid">
        {batches.map(({ batch, fits }) => (
          <li key={batch.code}>
            <Link to={`/buyer/supply/${batch.code}`} className="bu-market-card">
              <span className="bu-market-top">
                <strong>
                  {batch.product} <span>{batch.variety}</span>
                </strong>
                <span className="bu-market-grade">Grade {batch.grade}</span>
              </span>
              <span className="bu-market-kg">{formatKg(openOf(batch))}</span>
              <span className="bu-market-meta">
                {batch.readyDay <= 0 ? "Ready now" : `Ready ${formatDay(batch.readyDay).toLowerCase()}`} · {batch.producer}
              </span>
              <span className={fits ? "bu-market-fit bu-market-fit--yes" : "bu-market-fit"}>
                {fits ? `Fits ${fits.demandId} · ${fits.candidate.score}% match` : "No open demand for it"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
