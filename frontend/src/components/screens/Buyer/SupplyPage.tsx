import { useState } from "react";
import { SupplyTabs } from "./sections/SupplyTabs";
import { ArrowLeft, MapPin, Search, Sprout, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { MatchScore } from "../Producer/sections/MatchScore";
import { PhotoCover } from "../Producer/sections/BatchPhotos";
import { ReserveDialog } from "./sections/ReserveDialog";
import { ProducerBadge } from "./sections/ProducerTrust";
import { fulfilmentOf, openOf, scoreSupply } from "./data/demands";
import { useBuyer } from "./data/buyerContext";
import type { SupplyBatch } from "./data/mockBuyer";
import { formatDay, formatKg } from "../Producer/data/format";

const READY_WINDOWS = [
  { id: "any", label: "Any time", days: Infinity },
  { id: "now", label: "Ready now", days: 0 },
  { id: "3", label: "Within 3 days", days: 3 },
  { id: "7", label: "Within 7 days", days: 7 },
] as const;

const GRADES: SupplyBatch["grade"][] = ["A", "B", "C"];

export default function SupplyPage() {
  const { supply, demands, allocations } = useBuyer();
  const [searchParams, setSearchParams] = useSearchParams();
  // The search text lives in the URL (?q=) so a search can be shared or come back with Back.
  const query = searchParams.get("q") ?? "";
  const setQuery = (value: string) =>
    setSearchParams(
      (current) => {
        if (value) current.set("q", value);
        else current.delete("q");
        return current;
      },
      { replace: true },
    );
  const products = Array.from(new Set(supply.map((batch) => batch.product)));
  const [product, setProduct] = useState(() => (products.includes(searchParams.get("product") ?? "") ? searchParams.get("product")! : "All"));
  const [grades, setGrades] = useState<SupplyBatch["grade"][]>(GRADES);
  const [ready, setReady] = useState<(typeof READY_WINDOWS)[number]["id"]>("any");
  const [minKg, setMinKg] = useState(0);
  const [fitsOnly, setFitsOnly] = useState(false);
  const [reserving, setReserving] = useState<SupplyBatch | null>(null);

  const openDemands = demands
    .map((demand) => ({ demand, fulfilment: fulfilmentOf(demand, allocations) }))
    .filter(({ fulfilment }) => fulfilment.openKg > 0);

  /** The open demand this batch fits best, if any. */
  const bestFit = (batch: SupplyBatch) =>
    openDemands
      .filter(({ demand }) => demand.product === batch.product)
      .map(({ demand, fulfilment }) => ({ demand, candidate: scoreSupply(demand, batch, fulfilment.openKg) }))
      .filter(({ candidate }) => candidate.eligible)
      .sort((a, b) => b.candidate.score - a.candidate.score)[0];

  const window = READY_WINDOWS.find((option) => option.id === ready)!;
  // Every word must appear somewhere in the batch: product, variety, producer, region or code.
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matchesQuery = (batch: SupplyBatch) => {
    const text = [batch.product, batch.variety, batch.producer, batch.region, batch.code, `grade ${batch.grade}`].join(" ").toLowerCase();
    return words.every((word) => text.includes(word));
  };
  const rows = supply
    .filter((batch) => openOf(batch) > 0 && batch.status !== "in_transit" && batch.status !== "delivered")
    .filter(matchesQuery)
    .filter((batch) => product === "All" || batch.product === product)
    .filter((batch) => grades.includes(batch.grade))
    .filter((batch) => batch.readyDay <= window.days)
    .filter((batch) => openOf(batch) >= minKg)
    .map((batch) => ({ batch, fit: bestFit(batch) }))
    .filter(({ fit }) => !fitsOnly || fit)
    .sort((a, b) => (b.fit?.candidate.score ?? -1) - (a.fit?.candidate.score ?? -1) || a.batch.readyDay - b.batch.readyDay);

  const toggleGrade = (grade: SupplyBatch["grade"]) =>
    setGrades((current) => (current.includes(grade) ? current.filter((item) => item !== grade) : [...current, grade]));

  return (
    <main className="ph-main">
      <Link to="/buyer" className="ph-back">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Market</p>
          <h1>Find supply</h1>
          <p className="ph-hello-summary">
            Batches producers have declared as ready or expected. Batches that fit one of your open demands come first, with their match score.
          </p>
        </div>
      </section>

      <SupplyTabs />

      <section className="ph-card bu-filters" aria-label="Filters">
        <form className="bu-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder="Search product, variety, producer, region or batch code"
            aria-label="Search supply"
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button type="button" className="bu-search-clear" aria-label="Clear search" onClick={() => setQuery("")}>
              <X size={16} />
            </button>
          )}
        </form>

        <div className="ph-segmented" role="group" aria-label="Product">
          {["All", ...products].map((item) => (
            <button key={item} type="button" aria-pressed={product === item} onClick={() => setProduct(item)}>
              {item === "All" ? "All products" : item}
            </button>
          ))}
        </div>

        <div className="bu-filter-row">
          <div className="bu-filter" role="group" aria-label="Grade">
            <span className="bu-filter-label">Grade</span>
            {GRADES.map((grade) => (
              <button
                key={grade}
                type="button"
                className={grades.includes(grade) ? "ph-chip ph-chip--active" : "ph-chip"}
                aria-pressed={grades.includes(grade)}
                onClick={() => toggleGrade(grade)}
              >
                {grade}
              </button>
            ))}
          </div>

          <label className="bu-filter">
            <span className="bu-filter-label">Ready</span>
            <select value={ready} onChange={(event) => setReady(event.target.value as typeof ready)}>
              {READY_WINDOWS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="bu-filter">
            <span className="bu-filter-label">At least</span>
            <input type="number" min={0} step={100} value={minKg || ""} placeholder="0" onChange={(event) => setMinKg(Number(event.target.value) || 0)} />
            <span className="bu-filter-unit">kg</span>
          </label>

          <label className="bu-filter bu-filter--check">
            <input type="checkbox" checked={fitsOnly} onChange={(event) => setFitsOnly(event.target.checked)} />
            Only batches that fit my demands
          </label>
        </div>
      </section>

      <p className="bu-result-count" aria-live="polite">
        {rows.length} {rows.length === 1 ? "batch" : "batches"}
        {query && <> for “{query}”</>}
      </p>

      {rows.length === 0 ? (
        <p className="ph-empty">
          {query ? (
            <>
              Nothing matches “{query}” with these filters.{" "}
              <button type="button" className="ph-link-btn" onClick={() => setQuery("")}>
                Clear search
              </button>
            </>
          ) : (
            "No batch matches these filters."
          )}
        </p>
      ) : (
        <ul className="bu-supply-grid" aria-label="Available batches">
          {rows.map(({ batch, fit }) => (
            <li key={batch.code} className={fit ? "bu-supply-card bu-supply-card--fit" : "bu-supply-card"}>
              <PhotoCover photos={batch.photos} alt={`${batch.code}, ${batch.product} ${batch.variety}`} className="bu-supply-photo" interactive={false} />
              <div className="bu-supply-top">
                <span className={`ph-status-pill bu-ready bu-ready--${batch.readyDay <= 0 ? "now" : "later"}`}>
                  {batch.readyDay <= 0 ? "Ready" : `Ready ${formatDay(batch.readyDay)}`}
                </span>
                <span className="bu-grade">{batch.code} · Grade {batch.grade}</span>
              </div>

              {/* The title link covers the whole card; Reserve sits above it. */}
              <p className="bu-supply-product">
                <Link to={`/buyer/supply/${batch.code}`} className="bu-card-link">
                  {batch.product} <span>· {batch.variety}</span>
                </Link>
              </p>
              <p className="bu-supply-qty">{formatKg(openOf(batch))}</p>
              <p className="bu-supply-meta">available of {formatKg(batch.quantityKg)} · sell by {formatDay(batch.sellByDay)}</p>

              <p className="bu-supply-producer">
                <Sprout size={14} /> {batch.producer}
              </p>
              <ProducerBadge name={batch.producer} />
              <p className="bu-supply-meta">
                <MapPin size={13} /> {batch.region} · {batch.distanceKm} km
              </p>

              <div className="bu-supply-foot">
                {fit ? (
                  <span className="bu-fit">
                    Fits {fit.demand.id} <MatchScore score={fit.candidate.score} />
                  </span>
                ) : (
                  <span className="ph-muted">No open demand fits</span>
                )}
                <button type="button" className={fit ? "ph-btn ph-btn--primary" : "ph-btn"} onClick={() => setReserving(batch)}>
                  Reserve
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {reserving && <ReserveDialog batch={reserving} onClose={() => setReserving(null)} />}
    </main>
  );
}
