import { useState } from "react";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, List, Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarGrid, StatusLegend } from "./sections/CalendarGrid";
import { BatchDetail } from "./sections/BatchDetail";
import { BatchHistory } from "./sections/BatchHistory";
import { BatchTable } from "./sections/BatchTable";
import { DeclareBatchDialog } from "./sections/DeclareBatchDialog";
import { deliveries, demands, producer } from "./data/mockProducer";
import { matchAll } from "./data/matching";
import { dateFromToday, formatKg } from "./data/format";
import { useProducer } from "./data/producerContext";

type View = "calendar" | "list";
type StatusFilter = "active" | "all" | "delivered";

const RANGES = [
  { days: 14, label: "2 weeks", start: -3 },
  { days: 28, label: "4 weeks", start: -7 },
];

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "delivered", label: "Delivered" },
  { id: "all", label: "All" },
];

const rangeFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** Batch management: long-range planning calendar, full list, declaring new batches, per-batch history. */
export default function BatchesPage() {
  const { batches, setStatus, issues, reportIssue, addBatch, offerLog } = useProducer();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<View>(searchParams.get("view") === "list" ? "list" : "calendar");
  const [range, setRange] = useState(RANGES[1]);
  const [firstDay, setFirstDay] = useState(RANGES[1].start);
  const [product, setProduct] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const declaring = searchParams.get("declare") === "1";

  const updateParams = (changes: Record<string, string | null>) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );

  const matches = matchAll(demands, batches);
  const matchCounts: Record<string, number> = {};
  for (const match of matches) {
    for (const candidate of match.candidates) {
      matchCounts[candidate.batch.code] = (matchCounts[candidate.batch.code] ?? 0) + 1;
    }
  }

  const active = batches.filter((batch) => batch.status !== "delivered");
  const declaredKg = active.reduce((sum, batch) => sum + batch.quantityKg, 0);
  const openKg = active.reduce((sum, batch) => sum + Math.max(0, batch.quantityKg - batch.allocatedKg), 0);

  const visible = batches
    .filter((batch) => product === "All" || batch.product === product)
    .filter((batch) =>
      statusFilter === "all" ? true : statusFilter === "delivered" ? batch.status === "delivered" : batch.status !== "delivered",
    )
    .sort((a, b) => a.harvestDay - b.harvestDay);

  const selectedCode = searchParams.get("batch") ?? visible[0]?.code;
  const selected = batches.find((batch) => batch.code === selectedCode);
  const lastDay = firstDay + range.days - 1;
  const select = (code: string) => updateParams({ batch: code });

  return (
    <main className="ph-main">
      <Link to="/producer" className="ph-back">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Supply</p>
          <h1>Batches</h1>
          <p className="ph-hello-summary">
            {active.length} active {active.length === 1 ? "batch" : "batches"} · {formatKg(declaredKg)} declared · {formatKg(openKg)} still open for buyers
          </p>
        </div>
        <button type="button" className="ph-btn ph-btn--primary ph-btn--large" onClick={() => updateParams({ declare: "1" })}>
          <Plus size={18} /> Declare a new batch
        </button>
      </section>

      <section className="ph-card" aria-label="Batches">
        <div className="ph-cal-toolbar">
          <div className="ph-segmented" role="group" aria-label="View">
            <button type="button" aria-pressed={view === "calendar"} onClick={() => setView("calendar")}>
              <CalendarDays size={14} /> Calendar
            </button>
            <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>
              <List size={14} /> List
            </button>
          </div>

          <div className="ph-cal-filters">
            <div className="ph-chips" role="group" aria-label="Filter by product">
              {["All", ...producer.products].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={product === item ? "ph-chip ph-chip--active" : "ph-chip"}
                  aria-pressed={product === item}
                  onClick={() => setProduct(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="ph-segmented" role="group" aria-label="Status">
              {STATUS_FILTERS.map((option) => (
                <button key={option.id} type="button" aria-pressed={statusFilter === option.id} onClick={() => setStatusFilter(option.id)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {view === "calendar" ? (
          <>
            <div className="ph-cal-nav ph-cal-nav--sub">
              <button type="button" className="ph-btn ph-btn--icon" onClick={() => setFirstDay((day) => day - 7)} aria-label="Previous week">
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="ph-btn" onClick={() => setFirstDay(range.start)}>Today</button>
              <button type="button" className="ph-btn ph-btn--icon" onClick={() => setFirstDay((day) => day + 7)} aria-label="Next week">
                <ChevronRight size={18} />
              </button>
              <span className="ph-cal-range">
                {rangeFormat.format(dateFromToday(firstDay))} – {rangeFormat.format(dateFromToday(lastDay))}
              </span>
              <div className="ph-segmented ph-push-right" role="group" aria-label="Visible range">
                {RANGES.map((option) => (
                  <button
                    key={option.days}
                    type="button"
                    aria-pressed={range.days === option.days}
                    onClick={() => {
                      setRange(option);
                      setFirstDay(option.start);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {visible.length === 0 ? (
              <p className="ph-empty">No batches match this filter.</p>
            ) : (
              <CalendarGrid batches={visible} firstDay={firstDay} dayCount={range.days} selectedCode={selectedCode} onSelect={select} />
            )}
            <StatusLegend />
          </>
        ) : (
          <BatchTable batches={visible} selectedCode={selectedCode} onSelect={select} matchCounts={matchCounts} />
        )}

        {selected && (
          <>
            <BatchDetail key={selected.code} batch={selected} issue={issues[selected.code]} onAdvance={setStatus} onReport={reportIssue} />
            <BatchHistory batch={selected} matches={matches} offers={offerLog} deliveries={deliveries} />
          </>
        )}
      </section>

      {declaring && (
        <DeclareBatchDialog
          onClose={() => updateParams({ declare: null })}
          onDeclare={addBatch}
          onView={(code) => {
            setStatusFilter("active");
            setProduct("All");
            updateParams({ declare: null, batch: code });
          }}
        />
      )}
    </main>
  );
}
