import { useState } from "react";
import { ArrowLeft, ChevronRight, Plus, X } from "lucide-react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { DemandStatusPill, FulfilmentBar } from "./sections/Fulfilment";
import { DEMAND_STAGES, rankSupply, sortDemands, type DemandStatus, type Fulfilment } from "./data/demands";
import { useBuyer } from "./data/buyerContext";
import { formatDayInText, formatKg } from "../Producer/data/format";

type Filter = "all" | "open" | DemandStatus;

// New, Sourcing and Partly covered all mean "still short", so they share one tab.
// The home pipeline can still link to a single stage (?status=new); that shows as a chip.
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Needs supply" },
  { id: "fulfilled", label: "Fully covered" },
  { id: "completed", label: "Completed" },
];

function filterFromUrl(value: string | null): Filter {
  if (value === "all" || value === "open") return value;
  return DEMAND_STAGES.find((stage) => stage.status === value)?.status ?? "all";
}

export default function DemandsPage() {
  const { demands, allocations, supply } = useBuyer();
  // Links can pre-filter (?status=partial).
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>(() => filterFromUrl(searchParams.get("status")));
  const stageOnly = FILTERS.some((option) => option.id === filter) ? undefined : DEMAND_STAGES.find((stage) => stage.status === filter);

  const rows = sortDemands(demands, allocations);
  // "Needs supply" means kilograms nobody has reserved yet, the same rule the matching hero uses.
  const matches = (id: Filter, fulfilment: Fulfilment) =>
    id === "all" || id === fulfilment.status || (id === "open" && fulfilment.openKg > 0);
  const countOf = (id: Filter) => rows.filter((row) => matches(id, row.fulfilment)).length;
  const visible = rows.filter((row) => matches(filter, row.fulfilment));

  // Posting a demand used to be a dialog here (?new=1); old links go to the new page.
  if (searchParams.get("new") === "1") return <Navigate to="/buyer/demands/new" replace />;

  return (
    <main className="ph-main">
      <Link to="/buyer" className="ph-back">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Demand</p>
          <h1>My demands</h1>
          <p className="ph-hello-summary">
            What you have asked for and how much of it is sourced. Open a demand to see where its supply comes from and reserve more.
          </p>
        </div>
        <Link to="/buyer/demands/new" className="ph-btn ph-btn--primary ph-btn--large">
          <Plus size={18} /> Post a demand
        </Link>
      </section>

      <section className="ph-card" aria-label="Demand list">
        <div className="ph-cal-toolbar">
          <div className="ph-segmented" role="group" aria-label="Show">
            {FILTERS.map((option) => (
              <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
                {option.label} <span className="ph-count-badge">{countOf(option.id)}</span>
              </button>
            ))}
          </div>
          {stageOnly && (
            <button type="button" className="ph-chip ph-chip--active" onClick={() => setFilter("all")}>
              Only {stageOnly.label.toLowerCase()} <span className="ph-count-badge">{countOf(filter)}</span>
              <X size={14} aria-label="Clear filter" />
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <p className="ph-empty">No demands here.</p>
        ) : (
          <ul className="bu-demand-rows">
            {visible.map(({ demand, fulfilment }) => {
              const options = fulfilment.openKg > 0 ? rankSupply(demand, supply, fulfilment.openKg).candidates.length : 0;
              return (
                <li key={demand.id}>
                  <Link to={`/buyer/demands/${demand.id}`} className="bu-demand-row">
                    <span className="bu-demand-row-main">
                      <span className="bu-demand-row-top">
                        <DemandStatusPill status={fulfilment.status} />
                        <span className="ph-delivery-id">{demand.id}</span>
                      </span>
                      <span className="bu-demand-row-title">
                        {formatKg(demand.quantityKg)} {demand.product.toLowerCase()}
                      </span>
                      <span className="ph-delivery-meta">
                        {demand.gradeWanted} · needed by {formatDayInText(demand.neededByDay)} · posted {formatDayInText(demand.createdDay)}
                      </span>
                    </span>
                    <span className="bu-demand-row-fill">
                      <FulfilmentBar quantityKg={demand.quantityKg} fulfilment={fulfilment} compact />
                    </span>
                    <span className="bu-demand-row-next">
                      {fulfilment.openKg === 0 ? (
                        <small>{fulfilment.status === "completed" ? "All delivered" : fulfilment.heldKg > 0 ? "Waiting for producers" : "Sourced"}</small>
                      ) : options > 0 ? (
                        <strong>{options} supply {options === 1 ? "option" : "options"}</strong>
                      ) : (
                        <small>No matching supply yet</small>
                      )}
                    </span>
                    <ChevronRight size={18} className="ph-delivery-chevron" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

    </main>
  );
}
