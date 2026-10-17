import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CircleCheck, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PhotoPicker } from "./sections/BatchPhotos";
import { ProductOptions } from "./sections/ProductOptions";
import { demands, producer, type Batch } from "./data/mockProducer";
import { matchDemand } from "./data/matching";
import { dateFromToday, formatDay, formatKg } from "./data/format";
import { useProducer } from "./data/producerContext";

type Draft = Omit<Batch, "code" | "allocatedKg" | "status">;

const GRADES: Batch["grade"][] = ["A", "B", "C"];

/** Select value for a product that is not in the farm's usual list. */
const OTHER = "__other";

function toInputDate(offset: number) {
  const date = dateFromToday(offset);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function toOffset(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return NaN;
  const picked = new Date(year, month - 1, day);
  return Math.round((picked.getTime() - dateFromToday(0).getTime()) / 86_400_000);
}

/** A typed product that only differs in case from a known one becomes that one ("mango" → "Mango"). */
function productName(typed: string, known: string[]) {
  const clean = typed.trim().replace(/\s+/g, " ");
  return known.find((item) => item.toLowerCase() === clean.toLowerCase()) ?? clean.charAt(0).toUpperCase() + clean.slice(1);
}

/** Open demands the batch would be eligible for, best fit first. */
function matchesFor(draft: Draft) {
  const candidate: Batch = { ...draft, code: "new", allocatedKg: 0, status: draft.readyDay <= 0 ? "ready" : "expected" };
  return demands
    .map((demand) => ({ demand, best: matchDemand(demand, [candidate]).best }))
    .filter((item) => item.best)
    .sort((a, b) => b.best!.score - a.best!.score);
}

/** Declare a new batch; the side column shows which open demand it would match while you type. */
export default function NewBatchPage() {
  const { addBatch } = useProducer();
  const navigate = useNavigate();
  const [productChoice, setProductChoice] = useState<string>(producer.products[0]);
  const [productOther, setProductOther] = useState("");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [plot, setPlot] = useState("");
  const [grade, setGrade] = useState<Batch["grade"]>("A");
  const [harvest, setHarvest] = useState(() => toInputDate(3));
  const [ready, setReady] = useState(() => toInputDate(4));
  const [sellBy, setSellBy] = useState(() => toInputDate(10));
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [declared, setDeclared] = useState<{ code: string; matches: number } | null>(null);

  // Photos of a batch that was never declared are released when the page goes away.
  const kept = useRef({ photos: [] as string[], declared: false });
  useEffect(() => {
    kept.current.photos = photos;
  }, [photos]);
  useEffect(() => {
    const state = kept.current;
    return () => {
      if (!state.declared) state.photos.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const known = [...new Set([...producer.products, ...demands.map((demand) => demand.product)])];
  const product = productChoice === OTHER ? productName(productOther, known) : productChoice;
  const quantityKg = Number(quantity);
  const harvestDay = toOffset(harvest);
  const readyDay = toOffset(ready);
  const sellByDay = toOffset(sellBy);
  const draft: Draft = {
    product,
    variety: variety.trim(),
    plot: plot.trim() || "Unassigned plot",
    quantityKg,
    grade,
    harvestDay,
    readyDay,
    sellByDay,
    photos,
  };
  const previewable = Boolean(product) && quantityKg > 0 && Number.isFinite(readyDay) && Number.isFinite(sellByDay) && sellByDay > readyDay;
  const matches = previewable ? matchesFor(draft) : [];
  const sellingDays = Number.isFinite(readyDay) && Number.isFinite(sellByDay) ? sellByDay - readyDay : NaN;

  const submit = () => {
    const problems: string[] = [];
    if (!product) problems.push("Enter the product.");
    if (!draft.variety) problems.push("Enter the variety.");
    if (!Number.isFinite(quantityKg) || quantityKg <= 0) problems.push("Enter a quantity above 0 kg.");
    if (![harvestDay, readyDay, sellByDay].every(Number.isFinite)) problems.push("Pick all three dates.");
    else {
      if (readyDay < harvestDay) problems.push("The ready date cannot be before the harvest date.");
      if (sellByDay <= readyDay) problems.push("The sell-by date must be after the ready date.");
    }
    if (photos.length === 0) problems.push("Add at least one photo of the batch.");
    setErrors(problems);
    if (problems.length > 0) return;
    kept.current.declared = true;
    setDeclared({ code: addBatch(draft), matches: matchesFor(draft).length });
    window.scrollTo({ top: 0 });
  };

  if (declared) {
    return (
      <main className="ph-main nb-page">
        <section className="ph-card nb-done">
          <CircleCheck size={40} />
          <h1>{declared.code} is declared</h1>
          <p>
            {declared.matches === 0
              ? "No open demand fits it yet. New demand is checked against it automatically."
              : `${declared.matches} open ${declared.matches === 1 ? "demand matches" : "demands match"} it. New demand is checked against it automatically.`}
          </p>
          <div className="ph-declared-actions">
            <button type="button" className="ph-btn ph-btn--primary" onClick={() => navigate(`/producer/batches?batch=${declared.code}`)}>
              View {declared.code}
            </button>
            {declared.matches > 0 && (
              <Link to="/producer/demand" className="ph-btn">
                See matches
              </Link>
            )}
            <button type="button" className="ph-btn" onClick={() => navigate(0)}>
              Declare another
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="ph-main nb-page">
      <Link to="/producer/batches" className="ph-back">
        <ArrowLeft size={16} /> Back to batches
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">New supply</p>
          <h1>Declare a batch</h1>
        </div>
      </section>

      <div className="nb-columns">
        <form
          className="nb-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <section className="ph-card nb-section" aria-labelledby="nb-what">
            <h2 id="nb-what">What you're selling</h2>
            <div className="ph-field-row">
              <div className="ph-field">
                <span id="batch-product">Product</span>
                <select aria-labelledby="batch-product" value={productChoice} onChange={(event) => setProductChoice(event.target.value)}>
                  <ProductOptions usual={producer.products} />
                  <option value={OTHER}>Other…</option>
                </select>
                {productChoice === OTHER && (
                  <input
                    aria-label="Product name"
                    placeholder="Type the product, e.g. Durian"
                    value={productOther}
                    onChange={(event) => setProductOther(event.target.value)}
                    autoFocus
                  />
                )}
              </div>
              <label className="ph-field">
                <span>Variety</span>
                <input value={variety} onChange={(event) => setVariety(event.target.value)} placeholder="e.g. White flesh" />
              </label>
            </div>

            <div className="ph-field-row">
              <label className="ph-field">
                <span>Quantity (kg)</span>
                <input type="number" min="1" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="e.g. 2,000" />
              </label>
              <label className="ph-field">
                <span>Plot</span>
                <input value={plot} onChange={(event) => setPlot(event.target.value)} placeholder="e.g. Plot 6" />
              </label>
            </div>

            <fieldset className="ph-field">
              <legend>Grade</legend>
              <div className="ph-grade-options">
                {GRADES.map((item) => (
                  <label key={item}>
                    <input type="radio" name="grade" value={item} checked={grade === item} onChange={() => setGrade(item)} />
                    <span>Grade {item}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="ph-card nb-section" aria-labelledby="nb-when">
            <h2 id="nb-when">When</h2>
            <div className="ph-field-row ph-field-row--3">
              <label className="ph-field">
                <span>Expected harvest</span>
                <input type="date" value={harvest} onChange={(event) => setHarvest(event.target.value)} />
              </label>
              <label className="ph-field">
                <span>Ready to sell</span>
                <input type="date" value={ready} onChange={(event) => setReady(event.target.value)} />
              </label>
              <label className="ph-field">
                <span>Sell by</span>
                <input type="date" value={sellBy} onChange={(event) => setSellBy(event.target.value)} />
              </label>
            </div>
          </section>

          <section className="ph-card nb-section" aria-labelledby="nb-photos">
            <div>
              <h2 id="nb-photos">Photos</h2>
              <p className="ph-field-hint" id="photos-hint">
                1 to 4 photos: the crates as packed and a close-up of the fruit. Buyers see them before they reserve.
              </p>
            </div>
            <div role="group" aria-labelledby="nb-photos" aria-describedby="photos-hint">
              <PhotoPicker
                photos={photos}
                onChange={(next) => {
                  setPhotos(next);
                  setPhotoError("");
                }}
                onError={setPhotoError}
              />
            </div>
            {photoError && <p className="ph-field-error">{photoError}</p>}
          </section>

          {errors.length > 0 && (
            <ul className="ph-form-errors" role="alert">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}

          <div className="nb-actions">
            <Link to="/producer/batches" className="ph-btn">
              Cancel
            </Link>
            <button type="submit" className="ph-btn ph-btn--primary">
              Declare batch
            </button>
          </div>
        </form>

        <aside className="nb-aside">
          <section className="ph-card nb-preview" aria-labelledby="nb-preview" aria-live="polite">
            <p className="ph-eyebrow">
              <Sparkles size={13} /> Live match
            </p>
            {!previewable ? (
              <>
                <h2 id="nb-preview">Enter a quantity</h2>
                <p className="nb-muted">We'll show which open buyer demand this batch fits.</p>
              </>
            ) : (
              <>
                <h2 id="nb-preview">
                  {matches.length === 0 ? "No demand fits yet" : `${matches.length} ${matches.length === 1 ? "demand fits" : "demands fit"}`}
                </h2>
                <p className="nb-muted">
                  {formatKg(quantityKg)} {product.toLowerCase()}, grade {grade}
                </p>
                {matches.length > 0 && (
                  <ul className="nb-matches">
                    {matches.slice(0, 3).map(({ demand, best }) => (
                      <li key={demand.id}>
                        <span>
                          <strong>{demand.buyer}</strong>
                          <small>
                            {formatKg(demand.quantityKg)} · by {formatDay(demand.neededByDay)}
                          </small>
                        </span>
                        <em>{Math.round(best!.score)}%</em>
                      </li>
                    ))}
                  </ul>
                )}
                {matches.length > 3 && <p className="nb-muted">+{matches.length - 3} more</p>}
              </>
            )}
          </section>

          {Number.isFinite(sellingDays) && sellingDays > 0 && (
            <section className="ph-card nb-window">
              <span>Selling window</span>
              <strong>
                {sellingDays} {sellingDays === 1 ? "day" : "days"}
              </strong>
              <small>
                {formatDay(readyDay)} → {formatDay(sellByDay)}
              </small>
            </section>
          )}

          <Link to="/producer/demand" className="nb-link">
            Browse all open demand <ArrowRight size={14} />
          </Link>
        </aside>
      </div>
    </main>
  );
}
