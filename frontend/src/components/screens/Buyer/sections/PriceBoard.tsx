// Market prices published after each matching session (FR-B3.3-22): the latest clearing price per
// product group, how it moved since the previous session, the recent trend, and a one-click buy order.
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { GRADE_LABEL } from "../model/catalog";
import { formatDateTime } from "../model/time";
import type { ClearingPrice } from "../model/types";
import { kg } from "../ui/format";

type Group = { key: string; latest: ClearingPrice; history: ClearingPrice[]; change?: number };

function groupPrices(prices: ClearingPrice[]): Group[] {
  const groups = new Map<string, ClearingPrice[]>();
  for (const price of [...prices].sort((a, b) => a.at - b.at)) {
    const key = [price.crop, price.variety ?? "*", price.grade, price.zone].join("|");
    groups.set(key, [...(groups.get(key) ?? []), price]);
  }
  return [...groups.entries()]
    .map(([key, history]) => {
      const latest = history[history.length - 1];
      const previous = history[history.length - 2];
      return { key, latest, history: history.slice(-8), change: previous ? latest.price - previous.price : undefined };
    })
    .sort((a, b) => b.latest.at - a.latest.at);
}

/** Small line of the last sessions' prices. */
function Sparkline({ history, tone }: { history: ClearingPrice[]; tone: "up" | "down" | "flat" }) {
  if (history.length < 2) return <span className="pb-spark-none">—</span>;
  const width = 96;
  const height = 30;
  const values = history.map((item) => item.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => [(index / (values.length - 1)) * width, height - 4 - ((value - min) / span) * (height - 8)]);
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];
  return (
    <svg className={`pb-spark pb-spark--${tone}`} viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <polygon points={`0,${height} ${line} ${width},${height}`} className="pb-spark-area" />
      <polyline points={line} className="pb-spark-line" />
      <circle cx={lastX} cy={lastY} r="3" className="pb-spark-dot" />
    </svg>
  );
}

export function PriceTable({ prices, limit }: { prices: ClearingPrice[]; limit?: number }) {
  const groups = groupPrices(prices).slice(0, limit);
  if (groups.length === 0) return <p className="ph-empty">No session has published a price yet.</p>;
  return (
    <ul className="pb-list">
      {groups.map(({ key, latest, history, change }) => {
        const tone = change === undefined || change === 0 ? "flat" : change > 0 ? "up" : "down";
        const Icon = tone === "up" ? ArrowUpRight : tone === "down" ? ArrowDownRight : Minus;
        const buy = new URLSearchParams({ crop: latest.crop, grade: latest.grade, price: String(latest.price), ...(latest.variety ? { variety: latest.variety } : {}) });
        return (
          <li key={key} className="pb-row">
            <span className="pb-product">
              <strong>{latest.crop}</strong>
              <small>
                {[latest.variety, GRADE_LABEL[latest.grade]].filter(Boolean).join(" · ")}
              </small>
            </span>
            <span className="pb-price">
              <strong>{latest.price.toLocaleString("en-GB")}</strong>
              <small>₫/kg</small>
            </span>
            <span className={`pb-change pb-change--${tone}`}>
              <Icon size={14} aria-hidden="true" />
              {change === undefined ? "New" : change === 0 ? "No change" : `${change > 0 ? "+" : "−"}${Math.abs(change).toLocaleString("en-GB")}`}
            </span>
            <Sparkline history={history} tone={tone} />
            <span className="pb-meta">
              {kg(latest.volume)}
              <small>{formatDateTime(latest.at)}</small>
            </span>
            <Link to={`/buyer/orders/new?${buy.toString()}`} className="ph-btn pb-buy" title={`Place a buy order at up to ${latest.price.toLocaleString("en-GB")} ₫/kg`}>
              Buy <ArrowRight size={14} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
