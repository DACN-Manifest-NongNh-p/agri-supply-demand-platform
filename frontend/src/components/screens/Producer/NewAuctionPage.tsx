import { useState } from "react";
import { ArrowLeft, Gavel, Plus, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { openAuction, useAuctions } from "@/components/auction/auctionStore";
import { vnd } from "@/components/auction/format";
import { yieldConfidence } from "@/components/auction/yieldConfidence";
import { useProfile } from "@/components/profile/profileStore";
import { producer, type Batch } from "./data/mockProducer";
import { formatDay, formatKg } from "./data/format";
import { useProducer } from "./data/producerContext";

const DURATIONS = [
  { minutes: 10, label: "10 min (demo)" },
  { minutes: 60, label: "1 hour" },
  { minutes: 24 * 60, label: "24 hours" },
];

/** Practices buyers weigh; certified ones raise the yield confidence. */
const PRACTICES = ["VietGAP certified", "GlobalGAP certified", "Organic", "Drip irrigation", "Bagged fruit"];

const STEP = 500;

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

/** Open a pre-harvest auction: pick a batch not harvested yet, set the estimate and the opening price. */
export default function NewAuctionPage() {
  const { batches } = useProducer();
  const auctions = useAuctions();
  const profile = useProfile("producer");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const taken = new Set(auctions.map((auction) => auction.batchCode));
  const eligible = batches.filter((batch) => batch.status === "expected" && !taken.has(batch.code)).sort((a, b) => a.harvestDay - b.harvestDay);
  const batch: Batch | undefined = eligible.find((item) => item.code === params.get("batch")) ?? eligible[0];

  const [minKg, setMinKg] = useState<number | null>(null);
  const [maxKg, setMaxKg] = useState<number | null>(null);
  const [startPrice, setStartPrice] = useState(22000);
  const [minutes, setMinutes] = useState(DURATIONS[0].minutes);
  const [practices, setPractices] = useState<string[]>([]);
  const [lastSeason, setLastSeason] = useState("");

  // The estimate follows the picked batch until the producer types their own.
  const low = minKg ?? (batch ? roundTo(batch.quantityKg * 0.9, 100) : 0);
  const high = Math.max(low, maxKg ?? batch?.quantityKg ?? 0);
  const farming = [...practices, ...(Number(lastSeason) > 0 ? [`Last season: ${Number(lastSeason).toLocaleString("en-GB")} kg from this plot`] : [])];
  const confidence = batch ? yieldConfidence({ estMinKg: low, estMaxKg: high, harvestDay: batch.harvestDay, farming }) : null;
  const valid = Boolean(batch) && low > 0 && startPrice > 0;

  const pick = (code: string) => {
    setParams({ batch: code }, { replace: true });
    setMinKg(null);
    setMaxKg(null);
  };

  const submit = () => {
    if (!batch || !valid) return;
    const id = openAuction({
      batchCode: batch.code,
      producer: producer.name,
      region: profile.org.region || producer.region,
      product: batch.product,
      variety: batch.variety,
      grade: batch.grade,
      estMinKg: low,
      estMaxKg: high,
      harvestDay: batch.harvestDay,
      startPrice,
      step: STEP,
      farming,
      minutes,
    });
    navigate(`/producer/auctions#auction-${id}`);
  };

  return (
    <main className="ph-main nb-page">
      <Link to="/producer/auctions" className="ph-back">
        <ArrowLeft size={16} /> Back to auctions
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Pre-harvest auction</p>
          <h1>New auction</h1>
        </div>
      </section>

      {eligible.length === 0 ? (
        <section className="ph-card na-empty">
          <Gavel size={28} />
          <h2>No batch to auction</h2>
          <p>Auctions are for batches not harvested yet. Declare one with a harvest date ahead.</p>
          <Link to="/producer/batches/new" className="ph-btn ph-btn--primary">
            <Plus size={16} /> Declare a batch
          </Link>
        </section>
      ) : (
        <div className="nb-columns">
          <form
            className="nb-form"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <section className="ph-card nb-section" aria-labelledby="na-batch">
              <div className="na-section-head">
                <h2 id="na-batch">Batch</h2>
                <Link to="/producer/batches/new" className="nb-link">
                  <Plus size={14} /> Declare a new one
                </Link>
              </div>
              <div className="na-batches" role="radiogroup" aria-labelledby="na-batch">
                {eligible.map((item) => (
                  <label key={item.code} className={item.code === batch?.code ? "na-batch is-picked" : "na-batch"}>
                    <input type="radio" name="batch" checked={item.code === batch?.code} onChange={() => pick(item.code)} />
                    <span className="na-batch-main">
                      <strong>
                        {item.product} · {item.variety}
                      </strong>
                      <small>
                        {item.code} · {formatKg(item.quantityKg)} · grade {item.grade}
                      </small>
                    </span>
                    <span className="na-batch-when">Harvest {formatDay(item.harvestDay)}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="ph-card nb-section" aria-labelledby="na-terms">
              <h2 id="na-terms">Terms</h2>
              <div className="ph-field-row">
                <label className="ph-field">
                  <span>Estimated yield from (kg)</span>
                  <input type="number" min={100} step={100} value={low} onChange={(event) => setMinKg(Number(event.target.value) || 0)} />
                </label>
                <label className="ph-field">
                  <span>to (kg)</span>
                  <input type="number" min={100} step={100} value={maxKg ?? batch?.quantityKg ?? 0} onChange={(event) => setMaxKg(Number(event.target.value) || 0)} />
                </label>
              </div>
              <div className="ph-field-row">
                <label className="ph-field">
                  <span>Opening price per kg (₫)</span>
                  <input type="number" min={1000} step={STEP} value={startPrice} onChange={(event) => setStartPrice(Number(event.target.value) || 0)} />
                </label>
                <div className="ph-field">
                  <span id="na-duration">Runs for</span>
                  <div className="ph-grade-options" role="radiogroup" aria-labelledby="na-duration">
                    {DURATIONS.map((item) => (
                      <label key={item.minutes}>
                        <input type="radio" name="duration" checked={minutes === item.minutes} onChange={() => setMinutes(item.minutes)} />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="ph-card nb-section" aria-labelledby="na-trust">
              <div>
                <h2 id="na-trust">How it's grown</h2>
                <p className="ph-field-hint">Optional. Buyers see this, and it raises the yield confidence.</p>
              </div>
              <div className="na-practices">
                {PRACTICES.map((practice) => (
                  <label key={practice}>
                    <input
                      type="checkbox"
                      checked={practices.includes(practice)}
                      onChange={(event) => setPractices((current) => (event.target.checked ? [...current, practice] : current.filter((item) => item !== practice)))}
                    />
                    <span>{practice}</span>
                  </label>
                ))}
              </div>
              <label className="ph-field na-last-season">
                <span>Last season from this plot (kg)</span>
                <input type="number" min={0} step={100} value={lastSeason} placeholder="e.g. 4,600" onChange={(event) => setLastSeason(event.target.value)} />
              </label>
            </section>

            <div className="nb-actions">
              <Link to="/producer/auctions" className="ph-btn">
                Cancel
              </Link>
              <button type="submit" className="ph-btn ph-btn--primary" disabled={!valid}>
                <Gavel size={15} /> Open auction
              </button>
            </div>
          </form>

          {batch && confidence && (
            <aside className="nb-aside">
              <section className="ph-card nb-preview" aria-live="polite">
                <p className="ph-eyebrow">
                  <ShieldCheck size={13} /> Yield confidence
                </p>
                <p className="na-score">
                  <strong>{confidence.score}%</strong>
                  <span className={`na-level na-level--${confidence.level.toLowerCase()}`}>{confidence.level}</span>
                </p>
                <ul className="na-factors">
                  {confidence.factors.map((factor) => (
                    <li key={factor}>{factor}</li>
                  ))}
                </ul>
              </section>

              <section className="ph-card nb-window">
                <span>Opens at</span>
                <strong>{vnd(startPrice)}/kg</strong>
                <small>
                  About {vnd(startPrice * low)}–{vnd(startPrice * high)} · bids rise by {vnd(STEP)}
                </small>
              </section>
            </aside>
          )}
        </div>
      )}
    </main>
  );
}
