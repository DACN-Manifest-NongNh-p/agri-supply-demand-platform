import type { Batch } from "../data/mockProducer";
import { formatDay, formatKg, stageLabel } from "../data/format";
import { RiskBadge, ShelfLifeBar } from "@/components/freshness/ShelfLifeBar";

type Props = {
  batches: Batch[];
  selectedCode?: string;
  onSelect: (code: string) => void;
  /** Open demands each batch is eligible for, by batch code. */
  matchCounts: Record<string, number>;
  /** Temperature excursions reported per batch code. */
  excursions?: Record<string, string>;
};

export function BatchTable({ batches, selectedCode, onSelect, matchCounts, excursions = {} }: Props) {
  if (batches.length === 0) return <p className="ph-empty">No batches match this filter.</p>;

  return (
    <div className="ph-table-scroll">
      <table className="ph-batch-table">
        <thead>
          <tr>
            <th scope="col">Batch</th>
            <th scope="col">Product</th>
            <th scope="col" className="ph-num">Declared</th>
            <th scope="col" className="ph-num">Open</th>
            <th scope="col">Harvest</th>
            <th scope="col">Shelf life</th>
            <th scope="col">Spoilage risk</th>
            <th scope="col">Status</th>
            <th scope="col" className="ph-num">Matches</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => {
            const open = batch.quantityKg - batch.allocatedKg;
            const matches = matchCounts[batch.code] ?? 0;
            const selected = batch.code === selectedCode;
            return (
              <tr key={batch.code} className={selected ? "ph-batch-tr ph-batch-tr--selected" : "ph-batch-tr"} onClick={() => onSelect(batch.code)}>
                <td>
                  <button type="button" className="ph-batch-code" onClick={() => onSelect(batch.code)} aria-pressed={selected}>
                    {batch.code}
                  </button>
                  <small>{batch.plot}</small>
                </td>
                <td>
                  {batch.product}
                  <small>{batch.variety} · grade {batch.grade}</small>
                </td>
                <td className="ph-num">{formatKg(batch.quantityKg)}</td>
                <td className="ph-num">{open > 0 ? formatKg(open) : <span className="ph-muted">—</span>}</td>
                <td>{formatDay(batch.harvestDay)}</td>
                <td>
                  {batch.status === "delivered" ? (
                    <span className="ph-muted">{formatDay(batch.sellByDay)}</span>
                  ) : (
                    <>
                      <ShelfLifeBar batch={batch} compact />
                      <small>Sell by {formatDay(batch.sellByDay).toLowerCase()}</small>
                    </>
                  )}
                </td>
                <td>
                  {open > 0 && batch.status !== "delivered" && batch.status !== "in_transit" ? (
                    <RiskBadge batch={{ ...batch, openKg: open }} excursion={excursions[batch.code]} />
                  ) : (
                    <span className="ph-muted">Sold</span>
                  )}
                </td>
                <td>
                  <span className={`ph-batch-status ph-status--${batch.status}`}>{stageLabel(batch.status)}</span>
                </td>
                <td className="ph-num">
                  {matches > 0 ? <span className="ph-batch-matches">{matches}</span> : <span className="ph-muted">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
