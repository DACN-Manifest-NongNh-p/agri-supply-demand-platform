// Cold-chain temperature in the shipment panel beside the delivery map: always in view, no tab
// and no click needed. Readings (live in the demo, simulated) come from data/liveTemperature.ts.
import { Snowflake } from "lucide-react";
import { TEMPERATURE_RANGE } from "../data/deliveries";
import { isOut, type Reading } from "../data/liveTemperature";

/** The safe band as text, read when shown so it follows the operating rules. */
const safeBand = () => `${TEMPERATURE_RANGE.min}–${TEMPERATURE_RANGE.max} °C`;

function Sparkline({ readings }: { readings: Reading[] }) {
  const width = 120;
  const height = 36;
  const { min, max } = TEMPERATURE_RANGE;
  const low = Math.min(min - 1, ...readings.map((reading) => reading.celsius));
  const high = Math.max(max + 1, ...readings.map((reading) => reading.celsius));
  const y = (celsius: number) => height - ((celsius - low) / (high - low)) * height;
  const x = (index: number) => (readings.length === 1 ? width : (index / (readings.length - 1)) * width);
  const points = readings.map((reading, index) => `${x(index).toFixed(1)},${y(reading.celsius).toFixed(1)}`).join(" ");
  const last = readings.at(-1)!;

  return (
    <svg className="ph-cold-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y={y(max)} width={width} height={y(min) - y(max)} className="ph-cold-band" />
      <polyline points={points} className="ph-cold-line" />
      <circle cx={x(readings.length - 1)} cy={y(last.celsius)} r="3" className={isOut(last.celsius) ? "ph-cold-dot ph-cold-dot--out" : "ph-cold-dot"} />
    </svg>
  );
}

/**
 * The "Cold chain" block of the shipment panel: the current reading and its trend while the
 * truck is moving, a verdict on the whole trip once delivered.
 */
export function ColdChainPanel({ readings, live }: { readings: Reading[]; live: boolean }) {
  const latest = readings.at(-1);
  if (!latest) {
    return (
      <div className="ph-cold">
        <p className="ph-cold-label">
          <Snowflake size={13} aria-hidden="true" /> Cold chain
        </p>
        <p className="ph-cold-note">No sensor reading yet. Readings start once the truck is loaded.</p>
      </div>
    );
  }

  const values = readings.map((reading) => reading.celsius);
  const outside = readings.filter((reading) => isOut(reading.celsius)).length;
  const range = `${Math.min(...values).toFixed(1)}–${Math.max(...values).toFixed(1)} °C`;

  if (!live) {
    return (
      <div className={outside > 0 ? "ph-cold ph-cold--out" : "ph-cold"}>
        <p className="ph-cold-label">
          <Snowflake size={13} aria-hidden="true" /> Cold chain
        </p>
        <p className="ph-cold-summary">{outside > 0 ? `${outside} ${outside === 1 ? "reading" : "readings"} outside ${safeBand()}` : `Held ${safeBand()} the whole trip`}</p>
        <p className="ph-cold-note">Readings ranged {range}.</p>
      </div>
    );
  }

  const out = isOut(latest.celsius);
  return (
    <div className={out ? "ph-cold ph-cold--out" : "ph-cold"} aria-live="polite">
      <p className="ph-cold-label">
        <Snowflake size={13} aria-hidden="true" /> Cold chain
        <span className="ph-cold-live">
          <i aria-hidden="true" /> Live
        </span>
      </p>
      <div className="ph-cold-now">
        <div>
          <strong>{latest.celsius.toFixed(1)} °C</strong>
          <small>{out ? `Outside ${safeBand()}` : `Within ${safeBand()}`}</small>
        </div>
        <Sparkline readings={readings} />
      </div>
      <p className="ph-cold-note">
        {latest.time} · {range}
        {outside > 0 && <span> · {outside} out of range</span>}
      </p>
    </div>
  );
}
