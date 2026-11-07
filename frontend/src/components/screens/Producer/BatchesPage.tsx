import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileSpreadsheet, List, Plus, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarGrid, StatusLegend } from "./sections/CalendarGrid";
import { BatchDetail } from "./sections/BatchDetail";
import { BatchHistory } from "./sections/BatchHistory";
import { BatchTable } from "./sections/BatchTable";
import { PreHarvestAuction } from "./sections/PreHarvestAuction";
import { BatchTabs } from "./sections/BatchTabs";
import { ImportBatchesDialog } from "./sections/ImportBatchesDialog";
import { deliveries, demands, producer } from "./data/mockProducer";
import { matchAll } from "./data/matching";
import { dateFromToday, formatKg, formatMonth, formatRange, isoOf, offsetOf } from "./data/format";
import { matchesQuery, riskOf, SORT_LABEL, sortBatches, type BatchSort, type SortDir } from "./data/batchSort";
import { useProducer } from "./data/producerContext";
import { useNow } from "@/components/orders/useNow";

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

/** Day offset of the 1st of the month `months` away from the month that contains `offset`. */
function monthStart(offset: number, months: number) {
  const date = dateFromToday(offset);
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  return Math.round((target.getTime() - dateFromToday(0).getTime()) / 86_400_000);
}

/** Batch management: long-range planning calendar, full list, declaring new batches, per-batch history. */
export default function BatchesPage() {
  const { batches, setStatus, issues, reportIssue, addBatches, orders, excursions } = useProducer();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<View>(searchParams.get("view") === "list" ? "list" : "calendar");
  const [range, setRange] = useState(RANGES[1]);
  const [firstDay, setFirstDay] = useState(RANGES[1].start);
  const [product, setProduct] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const importing = searchParams.get("import") === "1";
  const now = useNow(60_000);
  // Search and sort are in the URL and shared by the list and the calendar.
  const query = searchParams.get("q") ?? "";
  const sort = (Object.keys(SORT_LABEL) as BatchSort[]).find((key) => key === searchParams.get("sort")) ?? "harvest";
  const dir: SortDir = searchParams.get("dir") === "desc" ? "desc" : "asc";

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

  const risks = Object.fromEntries(batches.map((batch) => [batch.code, riskOf(batch, excursions, now)]));
  const filtered = batches
    .filter((batch) => product === "All" || batch.product === product)
    .filter((batch) =>
      statusFilter === "all" ? true : statusFilter === "delivered" ? batch.status === "delivered" : batch.status !== "delivered",
    )
    .filter((batch) => matchesQuery(batch, query));
  const visible = sortBatches(filtered, sort, dir, risks);
  const atRisk = visible.filter((batch) => risks[batch.code] && risks[batch.code]!.level !== "low").length;
  const sortBy = (next: BatchSort) =>
    updateParams({ sort: next, dir: next === sort ? (dir === "asc" ? "desc" : "asc") : next === "risk" || next === "open" || next === "declared" ? "desc" : "asc" });

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
        <div className="ph-head-actions">
          <button type="button" className="ph-btn ph-btn--large" onClick={() => updateParams({ import: "1" })}>
            <FileSpreadsheet size={18} /> Import from file
          </button>
          <Link to="/producer/batches/new" className="ph-btn ph-btn--primary ph-btn--large">
            <Plus size={18} /> Declare a new batch
          </Link>
        </div>
      </section>

      <BatchTabs />

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

        <div className="ph-cal-toolbar ph-batch-find">
          <label className="ph-search">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              value={query}
              placeholder="Search code, product, variety, plot…"
              aria-label="Search batches"
              onChange={(event) => updateParams({ q: event.target.value || null })}
            />
          </label>
          <label className="ph-sort">
            <span>Sort by</span>
            <select value={sort} onChange={(event) => updateParams({ sort: event.target.value })}>
              {(Object.keys(SORT_LABEL) as BatchSort[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABEL[key]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ph-btn ph-btn--icon"
              aria-label={dir === "asc" ? "Ascending, click for descending" : "Descending, click for ascending"}
              title={dir === "asc" ? "Ascending" : "Descending"}
              onClick={() => updateParams({ dir: dir === "asc" ? "desc" : "asc" })}
            >
              {dir === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </button>
          </label>
          <span className="ph-muted ph-batch-count">
            {visible.length} {visible.length === 1 ? "batch" : "batches"}
            {atRisk > 0 && ` · ${atRisk} at risk`}
          </span>
        </div>

        {view === "calendar" ? (
          <>
            <div className="ph-cal-nav ph-cal-nav--sub">
              <button type="button" className="ph-btn ph-btn--icon" onClick={() => setFirstDay((day) => monthStart(day, -1))} aria-label="Previous month" title="Previous month">
                <ChevronsLeft size={18} />
              </button>
              <button type="button" className="ph-btn ph-btn--icon" onClick={() => setFirstDay((day) => day - 7)} aria-label="Previous week" title="Previous week">
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="ph-btn" onClick={() => setFirstDay(range.start)}>Today</button>
              <button type="button" className="ph-btn ph-btn--icon" onClick={() => setFirstDay((day) => day + 7)} aria-label="Next week" title="Next week">
                <ChevronRight size={18} />
              </button>
              <button type="button" className="ph-btn ph-btn--icon" onClick={() => setFirstDay((day) => monthStart(day, 1))} aria-label="Next month" title="Next month">
                <ChevronsRight size={18} />
              </button>
              <label className="ph-cal-goto">
                <span className="ph-visually-hidden">Go to date</span>
                <input type="date" value={isoOf(firstDay)} onChange={(event) => event.target.value && setFirstDay(offsetOf(event.target.value))} title="Start the calendar on this date" />
              </label>
              <span className="ph-cal-range">
                <strong>{formatMonth(firstDay)}</strong> · {formatRange(firstDay, lastDay)}
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
              <CalendarGrid batches={visible} firstDay={firstDay} dayCount={range.days} selectedCode={selectedCode} onSelect={select} risks={risks} />
            )}
            <StatusLegend withRisk />
          </>
        ) : (
          <BatchTable batches={visible} selectedCode={selectedCode} onSelect={select} matchCounts={matchCounts} excursions={excursions} sort={sort} dir={dir} onSort={sortBy} />
        )}

        {selected && (
          <>
            <BatchDetail key={selected.code} batch={selected} issue={issues[selected.code]} onAdvance={setStatus} onReport={reportIssue} />
            <PreHarvestAuction key={`auction-${selected.code}`} batch={selected} />
            <BatchHistory batch={selected} matches={matches} orders={orders} deliveries={deliveries} />
          </>
        )}
      </section>

      {importing && (
        <ImportBatchesDialog
          onClose={() => {
            setStatusFilter("active");
            setProduct("All");
            updateParams({ import: null });
          }}
          onDeclare={addBatches}
        />
      )}

    </main>
  );
}
