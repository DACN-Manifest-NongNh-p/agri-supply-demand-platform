import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDay } from "../data/format";
import { useProducer } from "../data/producerContext";
import { BatchDetail } from "./BatchDetail";
import { CalendarGrid, StatusLegend } from "./CalendarGrid";

const HOME_FIRST_DAY = -3;
const HOME_DAYS = 15;

/** Home calendar: two weeks around today with the selected batch's details inline. */
export function HarvestPreview() {
  const { batches, setStatus, issues, reportIssue } = useProducer();
  const active = batches.filter((batch) => batch.status !== "delivered");
  const [selectedCode, setSelectedCode] = useState(active[0]?.code);
  const selected = active.find((batch) => batch.code === selectedCode);
  const nextHarvest = active
    .filter((batch) => batch.harvestDay > 0)
    .sort((a, b) => a.harvestDay - b.harvestDay)[0];

  return (
    <section id="calendar" className="ph-calendar" aria-labelledby="calendar-home-title">
      <div className="ph-section-head">
        <div>
          <h2 id="calendar-home-title">Harvest calendar</h2>
          <p className="ph-section-sub">
            {active.length} active {active.length === 1 ? "batch" : "batches"}
            {nextHarvest && <> · next harvest {nextHarvest.code} on {formatDay(nextHarvest.harvestDay)}</>}
          </p>
        </div>
        <Link to="/producer/batches" className="ph-btn">
          All batches <ArrowRight size={16} />
        </Link>
      </div>

      <CalendarGrid
        batches={active}
        firstDay={HOME_FIRST_DAY}
        dayCount={HOME_DAYS}
        selectedCode={selectedCode}
        onSelect={setSelectedCode}
      />
      <StatusLegend />

      {selected && (
        <BatchDetail
          key={selected.code}
          batch={selected}
          issue={issues[selected.code]}
          onAdvance={setStatus}
          onReport={reportIssue}
        />
      )}
    </section>
  );
}
