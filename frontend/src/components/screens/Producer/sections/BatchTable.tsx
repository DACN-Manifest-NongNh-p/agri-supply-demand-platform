import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Batch } from "../data/mockProducer";
import { formatDate, formatDay, formatKg, stageLabel } from "../data/format";
import { RiskBadge, ShelfLifeBar } from "@/components/freshness/ShelfLifeBar";
import type { BatchSort, SortDir } from "../data/batchSort";

type Props = {
  batches: Batch[];
  selectedCode?: string;
  onSelect: (code: string) => void;
  /** Open demands each batch is eligible for, by batch code. */
  matchCounts: Record<string, number>;
  /** Temperature excursions reported per batch code. */
  excursions?: Record<string, string>;
  sort?: BatchSort;
  dir?: SortDir;
  onSort?: (sort: BatchSort) => void;
};

/** A header that sorts by its column; clicking again flips the direction. */
function Head({ by, children, num = false, sort, dir, onSort }: { by?: BatchSort; children: string; num?: boolean } & Pick<Props, "sort" | "dir" | "onSort">) {
  const active = by && sort === by;
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th scope="col" className={num ? "ph-num" : undefined} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}>
      {by && onSort ? (
        <button type="button" className={active ? "ph-sort-btn is-active" : "ph-sort-btn"} onClick={() => onSort(by)}>
          {children} <Icon size={12} aria-hidden="true" />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function BatchTable({ batches, selectedCode, onSelect, matchCounts, excursions = {}, sort, dir, onSort }: Props) {
  if (batches.length === 0) return <p className="ph-empty">No batches match this filter.</p>;
  const sorting = { sort, dir, onSort };

  return (
    <div className="ph-table-scroll">
      <table className="ph-batch-table">
        <thead>
          <tr>
            <Head by="code" {...sorting}>Batch</Head>
            <Head>Product</Head>
            <Head by="declared" num {...sorting}>Declared</Head>
            <Head by="open" num {...sorting}>Open</Head>
            <Head by="harvest" {...sorting}>Harvest</Head>
            <Head by="sellBy" {...sorting}>Shelf life</Head>
            <Head by="risk" {...sorting}>Spoilage risk</Head>
            <Head by="status" {...sorting}>Status</Head>
            <Head num>Matches</Head>
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
                <td>
                  {formatDate(batch.harvestDay, { weekday: false })}
                  <small>{formatDay(batch.harvestDay)}</small>
                </td>
                <td>
                  {batch.status === "delivered" ? (
                    <span className="ph-muted">{formatDate(batch.sellByDay, { weekday: false })}</span>
                  ) : (
                    <>
                      <ShelfLifeBar batch={batch} compact />
                      <small>Sell by {formatDate(batch.sellByDay, { weekday: false })}</small>
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
