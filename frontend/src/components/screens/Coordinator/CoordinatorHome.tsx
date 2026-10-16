import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { formatKg, greeting } from "../Producer/data/format";
import { deliveryStatus } from "../Producer/data/deliveries";
import { openOf } from "../Buyer/data/demands";
import { HubMap } from "./sections/HubMap";
import { QueueList } from "./sections/QueueList";
import { OnTheRoad, SupplyBalance, UnmetDemand, UnsoldSupply } from "./sections/Overview";
import { BALANCE_WINDOWS, balanceByProduct, needsDecision, unsoldSupply } from "./data/market";
import { coordinator, deliveries } from "./data/mockCoordinator";
import { PROVINCES, provinceOf } from "./data/places";
import { useCoordinator } from "./data/coordinatorContext";
import { SpoilageWatch } from "@/components/freshness/SpoilageWatch";

export default function CoordinatorHome() {
  const { board, market, queue, allocations, notified, notifyProducers, spoilageItems, excursions } = useCoordinator();
  const [days, setDays] = useState<number>(BALANCE_WINDOWS[0]);
  const [params, setParams] = useSearchParams();
  const focus = PROVINCES.find((province) => province === params.get("region")) ?? undefined;

  // The map, figures and lists follow the chosen province; the queue always covers every region.
  const inFocus = (place: string) => !focus || provinceOf(place) === focus;
  const batches = market.filter((batch) => inFocus(batch.region));
  const codes = new Set(batches.map((batch) => batch.code));
  const regionOf = (batchCode: string, origin: string) => market.find((batch) => batch.code === batchCode)?.region ?? origin;
  const trips = deliveries.filter((delivery) => inFocus(regionOf(delivery.batch, delivery.origin)));
  const unsold = unsoldSupply(board, market).filter((item) => codes.has(item.batch.code));

  const farms = new Set(batches.map((batch) => batch.producer)).size;
  const openKg = batches.reduce((total, batch) => total + Math.max(0, openOf(batch)), 0);
  const decide = needsDecision(board).filter((row) => codes.has(row.best!.batch.code)).length;
  const autoHeld = allocations.filter((allocation) => allocation.matchedBy === "system" && allocation.stage === "held" && codes.has(allocation.batchCode)).length;
  const onRoad = trips.filter((delivery) => delivery.step < 3);
  const stuck = onRoad.filter((delivery) => deliveryStatus(delivery) === "issue").length;
  const urgent = queue.filter((item) => item.tone === "urgent").length;

  const chips = [
    { label: "Open supply", value: formatKg(openKg), to: "/coordinator/matching" },
    { label: "Matched by system", value: String(autoHeld), to: "/coordinator/matching?tab=holds" },
    { label: "Needs your decision", value: String(decide), to: "/coordinator/matching", low: decide > 0 },
    { label: "On the road", value: stuck > 0 ? `${onRoad.length} · ${stuck} stuck` : String(onRoad.length), to: "/coordinator/deliveries", low: stuck > 0 },
  ];

  const changeRegion = (region: string) => {
    const next = new URLSearchParams(params);
    if (region) next.set("region", region);
    else next.delete("region");
    setParams(next, { replace: true });
  };

  return (
    <main className="co-main">
      <section className="co-hub" aria-labelledby="hub-title">
        <HubMap market={market} board={board} deliveries={deliveries} focus={focus} onFocus={changeRegion}>
          <div className="co-hub-head">
            <label className="co-region">
              <select aria-label="Region" value={focus ?? ""} onChange={(event) => changeRegion(event.target.value)}>
                <option value="">All regions</option>
                {PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </label>
            <h1 id="hub-title">{focus ? `${focus} hub` : "All regions"}</h1>
            <p>
              {batches.length} {batches.length === 1 ? "batch" : "batches"} from {farms} {farms === 1 ? "farm" : "farms"}
            </p>
          </div>
        </HubMap>

        <ul className="co-hub-chips" aria-label={focus ? `${focus} today` : "Market today"}>
          {chips.map((chip) => (
            <li key={chip.label}>
              <Link to={chip.to}>
                <small>{chip.label}</small>
                <span className={chip.low ? "co-low" : undefined}>{chip.value}</span>
              </Link>
            </li>
          ))}
        </ul>

        <ul className="co-hub-legend" aria-hidden="true">
          <li><span className="co-key co-key--farm" /> Farms with open supply</li>
          <li><span className="co-key co-key--buyer" /> Buyers with open demand</li>
          {focus && onRoad.length > 0 && <li><span className="co-key co-key--truck" /> Trucks</li>}
        </ul>

        <aside className="co-hub-panel" id="queue" aria-labelledby="queue-title">
          <div className="co-hub-panel-head">
            <p>
              {greeting()}, {coordinator.name.split(" ").at(-1)} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h2 id="queue-title">
              {queue.length === 0 ? "All clear" : `${queue.length} things need you`}
              {urgent > 0 && <span> · {urgent} urgent</span>}
            </h2>
          </div>
          <QueueList items={queue} />
          <Link to="/coordinator/matching" className="co-cta">
            Open matching <ArrowRight size={16} />
          </Link>
        </aside>
      </section>

      <div className="co-grid">
        <div className="co-grid-wide">
          <SpoilageWatch
            items={spoilageItems.filter((item) => codes.has(item.code))}
            excursions={excursions}
            allTo="/coordinator/rescue"
            actionLabel="Rescue options"
          />
        </div>
        <SupplyBalance balance={balanceByProduct(board, market, days)} days={days} onDaysChange={setDays} />
        <OnTheRoad deliveries={trips} />
        <UnsoldSupply batches={unsold} />
        <UnmetDemand rows={board} notified={notified} onAsk={notifyProducers} />
      </div>
    </main>
  );
}
