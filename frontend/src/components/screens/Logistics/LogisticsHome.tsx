import { lazy, Suspense, useState } from "react";
import { ClipboardList, PackageCheck, Search, Snowflake, Truck, Warehouse, type LucideIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { deliveryStatus, etaText } from "../Producer/data/deliveries";
import { formatDay, formatKg } from "../Producer/data/format";
import { ROUTES } from "../Producer/data/routes";
import { dayState, formatVnd } from "./data/capacity";
import type { OrderStatus } from "./data/mockLogistics";
import { useLogistics } from "./data/logisticsContext";

// MapLibre is about 1 MB; load it only once the overview is open.
const RouteMap = lazy(() => import("../Producer/sections/RouteMap").then((module) => ({ default: module.RouteMap })));

const NEXT_STEP = ["Waiting for pickup", "Picked up", "On the road"];
const ORDER_STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  new: { label: "To answer", tone: "wait" },
  accepted: { label: "Accepted", tone: "ok" },
  declined: { label: "Declined", tone: "off" },
};

type Kpi = { label: string; value: string; note: string; tone?: "bad" | "good"; icon: LucideIcon; to: string };

/** Dashboard: figures, the trips under way with a live map, and every transport order. */
export default function LogisticsHome() {
  const { orders, trips, fleet } = useLogistics();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const waiting = orders.filter((order) => order.status === "new");
  const active = trips.filter((trip) => trip.step < 3).sort((a, b) => Number(Boolean(b.issue)) - Number(Boolean(a.issue)) || b.step - a.step);
  const delivered = trips.filter((trip) => trip.step === 3);
  const problems = active.filter((trip) => trip.issue).length;
  const free = fleet.filter((vehicle) => dayState(vehicle, 0) === "free");
  const soonest = Math.min(...waiting.map((order) => order.respondWithinHours));

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const selected = active.find((trip) => trip.id === selectedId) ?? active[0];

  const kpis: Kpi[] = [
    {
      label: "Orders to answer",
      value: String(waiting.length),
      note: waiting.length > 0 ? `next lapses in ${soonest} h` : "all answered",
      tone: waiting.length > 0 && soonest <= 6 ? "bad" : undefined,
      icon: ClipboardList,
      to: "/logistics/orders",
    },
    {
      label: "Trips under way",
      value: String(active.length),
      note: problems > 0 ? `${problems} with a problem` : "on schedule",
      tone: problems > 0 ? "bad" : "good",
      icon: Truck,
      to: "/logistics/trips",
    },
    {
      label: "Delivered",
      value: String(delivered.length),
      note: `${formatKg(delivered.reduce((sum, trip) => sum + (trip.receipt?.receivedKg ?? trip.quantityKg), 0))} signed for`,
      icon: PackageCheck,
      to: "/logistics/trips",
    },
    {
      label: "Free vehicles today",
      value: `${free.length}/${fleet.length}`,
      note: `${formatKg(free.reduce((sum, vehicle) => sum + vehicle.capacityKg, 0))} capacity`,
      icon: Warehouse,
      to: "/logistics/fleet",
    },
  ];

  const needle = query.trim().toLowerCase();
  const rows = [...orders]
    .sort((a, b) => Number(b.status === "new") - Number(a.status === "new") || a.respondWithinHours - b.respondWithinHours)
    .filter((order) =>
      !needle ||
      [order.id, order.pickup.short, order.dropoff.short, order.product, order.producer, order.buyer].some((text) => text.toLowerCase().includes(needle)),
    );

  return (
    <main className="ph-main lg-dash">
      <header className="lg-head lg-head--action">
        <h1>Overview</h1>
        {waiting.length > 0 && (
          <Link to="/logistics/orders" className="ph-btn ph-btn--primary">
            Answer orders ({waiting.length})
          </Link>
        )}
      </header>

      <ul className="lg-kpis" aria-label="Today">
        {kpis.map(({ label, value, note, tone, icon: Icon, to }) => (
          <li key={label}>
            <Link to={to} className="ph-card lg-kpi">
              <span className="lg-kpi-top">
                <small>{label}</small>
                <span className="lg-kpi-icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={1.75} />
                </span>
              </span>
              <strong>{value}</strong>
              <span className={tone ? `lg-chip lg-chip--${tone}` : "lg-chip"}>{note}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="lg-live">
        <section className="ph-card lg-panel" aria-labelledby="ongoing-title">
          <div className="lg-panel-head">
            <span className="lg-kpi-icon" aria-hidden="true">
              <Truck size={17} strokeWidth={1.75} />
            </span>
            <h2 id="ongoing-title">Under way</h2>
            <Link to="/logistics/trips" className="ph-link-btn co-push-right">
              All trips
            </Link>
          </div>
          {active.length === 0 ? (
            <p className="lg-empty">No trips under way.</p>
          ) : (
            <ul className="lg-trips">
              {active.map((trip) => (
                <li key={trip.id}>
                  <button
                    type="button"
                    className={trip.id === selected?.id ? "lg-trip lg-trip--on" : "lg-trip"}
                    aria-pressed={trip.id === selected?.id}
                    onClick={() => setSelectedId(trip.id)}
                  >
                    <span className="lg-trip-top">
                      <small>Trip</small>
                      <span className={trip.issue ? "lg-chip lg-chip--bad" : "lg-chip"}>{trip.issue ? "Problem" : NEXT_STEP[trip.step]}</span>
                    </span>
                    <strong>{trip.id}</strong>
                    <span className="lg-trip-route">
                      <span className="lg-dot lg-dot--from" aria-hidden="true" />
                      {trip.fromShort}
                      <span aria-label="to">→</span>
                      <span className="lg-dot lg-dot--to" aria-hidden="true" />
                      {trip.toShort}
                    </span>
                    <span className="lg-trip-meta">
                      {trip.vehiclePlate} · {trip.driver.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ph-card lg-panel" aria-labelledby="onway-title">
          <div className="lg-panel-head">
            <h2 id="onway-title">{selected ? `${selected.id} on the way` : "On the way"}</h2>
            {selected && (
              <Link to={`/logistics/trips/${selected.id}`} className="ph-link-btn co-push-right">
                Open trip
              </Link>
            )}
          </div>
          {selected ? (
            <>
              <div className="lg-map">
                <Suspense fallback={<div className="lg-map-wait">Loading map…</div>}>
                  <RouteMap key={selected.id} delivery={selected} status={deliveryStatus(selected)} />
                </Suspense>
              </div>
              <dl className="lg-stats">
                <div>
                  <dt>Product</dt>
                  <dd>{selected.product}</dd>
                </div>
                <div>
                  <dt>Distance</dt>
                  <dd>{ROUTES[selected.routeKey].distanceKm} km</dd>
                </div>
                <div>
                  <dt>Due</dt>
                  <dd>{etaText(selected)}</dd>
                </div>
                <div>
                  <dt>Weight</dt>
                  <dd>{formatKg(selected.quantityKg)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="lg-empty">Pick a trip to see it on the map.</p>
          )}
        </section>
      </div>

      <section className="ph-card lg-panel" aria-labelledby="orders-title">
        <div className="lg-panel-head">
          <span className="lg-kpi-icon" aria-hidden="true">
            <ClipboardList size={17} strokeWidth={1.75} />
          </span>
          <h2 id="orders-title">Transport orders</h2>
          <label className="lg-search co-push-right">
            <Search size={15} aria-hidden="true" />
            <input type="search" placeholder="Search…" aria-label="Search orders" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
        </div>
        <div className="ph-table-scroll">
          <table className="lg-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Route</th>
                <th>Load</th>
                <th>Pickup</th>
                <th className="co-num">Pay</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => {
                const status = ORDER_STATUS[order.status];
                const target = order.status === "accepted" && order.deliveryId ? `/logistics/trips/${order.deliveryId}` : `/logistics/orders${order.status === "new" ? "" : `?tab=${order.status}`}#${order.id}`;
                return (
                  <tr key={order.id} onClick={() => navigate(target)}>
                    <td>
                      <Link to={target} className="lg-table-id" onClick={(event) => event.stopPropagation()}>
                        {order.id}
                      </Link>
                    </td>
                    <td>
                      {order.pickup.short} <span className="ph-muted">→</span> {order.dropoff.short}
                    </td>
                    <td>
                      <span className="lg-load">
                        {formatKg(order.quantityKg)} {order.product.toLowerCase()}
                        {order.needsCold && <Snowflake size={13} className="lg-cold" aria-label="cold chain" />}
                      </span>
                    </td>
                    <td>
                      {formatDay(order.pickup.day)}, {order.pickup.window}
                    </td>
                    <td className="co-num">{formatVnd(order.payVnd)}</td>
                    <td>
                      <span className={`lg-status lg-status--${status.tone}`}>
                        {status.label}
                        {order.status === "new" && ` · ${order.respondWithinHours} h`}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="lg-empty">
                    No orders match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
