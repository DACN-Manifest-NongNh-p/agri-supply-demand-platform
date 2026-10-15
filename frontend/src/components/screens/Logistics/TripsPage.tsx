import { useState } from "react";
import { DeliveryRow } from "../Producer/sections/DeliveryCard";
import { useLogistics } from "./data/logisticsContext";

type Filter = "active" | "issue" | "delivered" | "all";

/** Every trip Farmora assigned to this provider. */
export default function TripsPage() {
  const { trips } = useLogistics();
  const groups: Record<Filter, typeof trips> = {
    active: trips.filter((trip) => trip.step < 3),
    issue: trips.filter((trip) => trip.step < 3 && trip.issue),
    delivered: trips.filter((trip) => trip.step === 3),
    all: trips,
  };
  // Problems are what needs the provider first: open on them when there are any.
  const [filter, setFilter] = useState<Filter>(() => (groups.issue.length > 0 ? "issue" : "active"));
  const filters: { id: Filter; label: string }[] = [
    { id: "active", label: "Under way" },
    { id: "issue", label: "Problems" },
    { id: "delivered", label: "Delivered" },
    { id: "all", label: "All" },
  ];
  // Problems first, then the trips furthest along.
  const visible = [...groups[filter]].sort((a, b) => Number(Boolean(b.issue)) - Number(Boolean(a.issue)) || a.step - b.step);

  return (
    <main className="ph-main lg-page">
      <header className="lg-head">
        <h1>Trips</h1>
      </header>

      <section className="ph-card" aria-label="Trip list">
        <div className="ph-cal-toolbar">
          <div className="ph-segmented" role="group" aria-label="Show">
            {filters.map((option) => (
              <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
                {option.label} <span className="ph-count-badge">{groups[option.id].length}</span>
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="ph-empty">No trips here.</p>
        ) : (
          <ul className="ph-delivery-rows">
            {visible.map((trip) => (
              <li key={trip.id}>
                <DeliveryRow delivery={trip} to={`/logistics/trips/${trip.id}`} title={`${trip.batch}: ${trip.fromShort} → ${trip.toShort}`} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
