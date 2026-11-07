import { BATCH_STAGES, type Batch } from "../data/mockProducer";
import { dateFromToday, formatDate, formatDay, formatKg, stageLabel } from "../data/format";
import type { Risk } from "@/components/freshness/shelfLife";

const RISK_LABEL = { low: "Low risk", watch: "Watch", high: "High risk" } as const;
const monthShort = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

type Props = {
  batches: Batch[];
  firstDay: number;
  dayCount: number;
  selectedCode?: string;
  onSelect: (code: string) => void;
  /** Spoilage risk per batch code; shown on each row and bar when given. */
  risks?: Record<string, Risk | undefined>;
};

/** Timeline grid shared by the home preview and the full calendar page. */
export function CalendarGrid({ batches, firstDay, dayCount, selectedCode, onSelect, risks }: Props) {
  const lastDay = firstDay + dayCount - 1;
  const days = Array.from({ length: dayCount }, (_, index) => firstDay + index);
  const columnOf = (day: number) => Math.min(Math.max(day, firstDay), lastDay) - firstDay + 2;
  const showToday = firstDay <= 0 && lastDay >= 0;

  return (
    <div className="ph-calendar-scroll">
      <div
        className="ph-calendar-grid"
        style={{
          gridTemplateColumns: `minmax(150px, 1.4fr) repeat(${dayCount}, minmax(${dayCount > 16 ? 30 : 38}px, 1fr))`,
          minWidth: dayCount > 16 ? 1000 : 640,
        }}
      >
        <span className="ph-cal-corner" style={{ gridRow: 1, gridColumn: 1 }}>Batch</span>
        {days.map((day) => {
          const date = dateFromToday(day);
          // The month and year sit on every 1st of the month, and on the first column unless that
          // month ends within two days (its label would run into the next month's).
          const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          const monthStart = date.getDate() === 1 || (day === firstDay && daysInMonth - date.getDate() >= 2);
          return (
            <span
              key={day}
              className={[day === 0 ? "ph-cal-day ph-cal-day--today" : "ph-cal-day", monthStart ? "ph-cal-day--month" : ""].join(" ")}
              style={{ gridRow: 1, gridColumn: columnOf(day) }}
              title={formatDate(day)}
            >
              {monthStart && <em className="ph-cal-month">{monthShort.format(date)}</em>}
              <small>{date.toLocaleDateString("en-GB", { weekday: "narrow" })}</small>
              {date.getDate()}
            </span>
          );
        })}

        {batches.map((batch, row) => {
          const isSelected = batch.code === selectedCode;
          const visible = batch.sellByDay >= firstDay && batch.harvestDay <= lastDay;
          const risk = risks?.[batch.code];
          const open = Math.max(0, batch.quantityKg - batch.allocatedKg);
          return [
            <button
              key={batch.code}
              type="button"
              className={isSelected ? "ph-cal-row ph-cal-row--selected" : "ph-cal-row"}
              style={{ gridRow: row + 2, gridColumn: `1 / span ${dayCount + 1}` }}
              onClick={() => onSelect(batch.code)}
              aria-pressed={isSelected}
            >
              <span className="ph-cal-label">
                <strong>
                  {batch.product}
                  {risks && (
                    <span className={`ph-cal-risk ph-cal-risk--${risk?.level ?? "none"}`} title={risk ? `${RISK_LABEL[risk.level]} · ${risk.score}: ${risk.factors.join(", ") || "on track"}` : "Sold"}>
                      {risk ? risk.score : "Sold"}
                    </span>
                  )}
                </strong>
                <small>
                  {batch.code} · {open > 0 && open < batch.quantityKg ? `${formatKg(open)} of ${formatKg(batch.quantityKg)} open` : formatKg(batch.quantityKg)}
                </small>
              </span>
              {!visible && (
                <span className="ph-cal-outside">
                  {batch.harvestDay > lastDay ? `Harvest ${formatDay(batch.harvestDay)} →` : `← Sold by ${formatDay(batch.sellByDay)}`}
                </span>
              )}
            </button>,
            visible && (
              <span
                key={`${batch.code}-bar`}
                className={`ph-cal-bar ph-status--${batch.status}${risk ? ` ph-cal-bar--risk-${risk.level}` : ""}`}
                style={{ gridRow: row + 2, gridColumn: `${columnOf(batch.harvestDay)} / ${columnOf(batch.sellByDay) + 1}` }}
                title={`${batch.code}: harvest ${formatDate(batch.harvestDay)}, ready ${formatDate(batch.readyDay)}, sell by ${formatDate(batch.sellByDay)}${risk ? ` · ${RISK_LABEL[risk.level]} (${risk.score})${risk.factors.length ? `: ${risk.factors.join(", ")}` : ""}` : ""}`}
              >
                <span className="ph-cal-bar-text">{stageLabel(batch.status)}</span>
              </span>
            ),
          ];
        })}

        {showToday && batches.length > 0 && (
          <span
            className="ph-cal-today-line"
            style={{ gridColumn: columnOf(0), gridRow: `2 / span ${batches.length}` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

export function StatusLegend({ withRisk = false }: { withRisk?: boolean }) {
  return (
    <ul className="ph-legend" aria-label="Batch status colours">
      {BATCH_STAGES.map((stage) => (
        <li key={stage.status}>
          <span className={`ph-swatch ph-status--${stage.status}`} /> {stage.label}
        </li>
      ))}
      {withRisk &&
        (["low", "watch", "high"] as const).map((level) => (
          <li key={level}>
            <span className={`ph-cal-risk ph-cal-risk--${level}`}>{level === "low" ? "<40" : level === "watch" ? "40+" : "70+"}</span> {RISK_LABEL[level]}
          </li>
        ))}
    </ul>
  );
}
