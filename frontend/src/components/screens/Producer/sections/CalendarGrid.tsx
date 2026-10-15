import { BATCH_STAGES, type Batch } from "../data/mockProducer";
import { dateFromToday, formatDay, formatKg, stageLabel } from "../data/format";

type Props = {
  batches: Batch[];
  firstDay: number;
  dayCount: number;
  selectedCode?: string;
  onSelect: (code: string) => void;
};

/** Timeline grid shared by the home preview and the full calendar page. */
export function CalendarGrid({ batches, firstDay, dayCount, selectedCode, onSelect }: Props) {
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
          return (
            <span
              key={day}
              className={day === 0 ? "ph-cal-day ph-cal-day--today" : "ph-cal-day"}
              style={{ gridRow: 1, gridColumn: columnOf(day) }}
            >
              <small>{date.toLocaleDateString("en-GB", { weekday: "narrow" })}</small>
              {date.getDate()}
            </span>
          );
        })}

        {batches.map((batch, row) => {
          const isSelected = batch.code === selectedCode;
          const visible = batch.sellByDay >= firstDay && batch.harvestDay <= lastDay;
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
                <strong>{batch.product}</strong>
                <small>{batch.code} · {formatKg(batch.quantityKg)}</small>
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
                className={`ph-cal-bar ph-status--${batch.status}`}
                style={{ gridRow: row + 2, gridColumn: `${columnOf(batch.harvestDay)} / ${columnOf(batch.sellByDay) + 1}` }}
                title={`${batch.code}: harvest ${formatDay(batch.harvestDay)}, sell by ${formatDay(batch.sellByDay)}`}
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

export function StatusLegend() {
  return (
    <ul className="ph-legend" aria-label="Batch status colours">
      {BATCH_STAGES.map((stage) => (
        <li key={stage.status}>
          <span className={`ph-swatch ph-status--${stage.status}`} /> {stage.label}
        </li>
      ))}
    </ul>
  );
}
