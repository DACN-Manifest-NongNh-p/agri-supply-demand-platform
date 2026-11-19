import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { greeting } from "../Producer/data/format";
import { HubMap } from "./sections/HubMap";
import { NeedsPanel } from "./sections/NeedsPanel";
import { OnTheRoad, SupplyBalance, UnmetDemand, UnsoldSupply } from "./sections/Overview";
import { BALANCE_WINDOWS, balanceByProduct, unsoldSupply } from "./data/market";
import { coordinator, deliveries } from "./data/mockCoordinator";
import { PROVINCES, provinceOf } from "./data/places";
import { useCoordinator } from "./data/coordinatorContext";
import { SpoilageWatch } from "@/components/freshness/SpoilageWatch";

export default function CoordinatorHome() {
  const { board, market, queue, notified, notifyProducers, spoilageItems, excursions } = useCoordinator();
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
  const onRoad = trips.filter((delivery) => delivery.step < 3);

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

        <ul className="co-hub-legend" aria-hidden="true">
          <li><span className="co-key co-key--farm" /> Farms with open supply</li>
          <li><span className="co-key co-key--buyer" /> Buyers with open demand</li>
          {focus && onRoad.length > 0 && <li><span className="co-key co-key--truck" /> Trucks</li>}
        </ul>

        {/* What needs the coordinator: behind a button, so the map stays clear. */}
        <NeedsPanel
          items={queue}
          greeting={`${greeting()}, ${coordinator.name.split(" ").at(-1)} · ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`}
        />
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
