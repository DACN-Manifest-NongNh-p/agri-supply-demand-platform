import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Check, Clock, MapPin, Plus, Settings, User } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ImportDemands } from "./sections/ImportDemands";
import { ProductOptions } from "../Producer/sections/ProductOptions";
import { dateFromToday, formatDay, formatKg } from "../Producer/data/format";
import { rankSupply } from "./data/demands";
import { useBuyer } from "./data/buyerContext";
import { buyer, formatAddress, GRADE_OPTIONS, type BuyerDemand } from "./data/mockBuyer";

/** Select value for a product typed in by hand. */
const OTHER = "__other";
/** The half-filled form survives a trip to the delivery points page and back. */
const DRAFT_KEY = "buyer-new-demand";

function toInputDate(offset: number) {
  const date = dateFromToday(offset);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function toOffset(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const picked = new Date(year, month - 1, day);
  return Math.round((picked.getTime() - dateFromToday(0).getTime()) / 86_400_000);
}

/** A typed product that only differs in case from a known one becomes that one ("mango" → "Mango"). */
function productName(typed: string, known: string[]) {
  const clean = typed.trim().replace(/\s+/g, " ");
  return known.find((item) => item.toLowerCase() === clean.toLowerCase()) ?? clean.charAt(0).toUpperCase() + clean.slice(1);
}

type Draft = { productChoice: string; otherProduct: string; quantity: string; grade: string; note: string; neededBy: string; addressId: string };

// Session storage is a convenience: when it is unavailable the form just starts empty.
function loadDraft(): Partial<Draft> {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "{}") as Partial<Draft>;
  } catch {
    return {};
  }
}

function saveDraft(draft: Draft | null) {
  try {
    if (draft) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Not kept; nothing else depends on it.
  }
}

function Section({ step, title, action, children }: { step: number; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="ph-card bu-new-section" aria-labelledby={`step-${step}`}>
      <div className="bu-new-section-head">
        <h2 id={`step-${step}`}>
          <span className="bu-step" aria-hidden="true">
            {step}
          </span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Posting a demand: what, by when, and which of the company's delivery points receives it. */
export default function NewDemandPage() {
  const { addDemand, addresses, supply } = useBuyer();
  const navigate = useNavigate();
  const location = useLocation();
  // ?mode=import: many demands from an Excel or CSV file instead of the form.
  const [params, setParams] = useSearchParams();
  const importing = params.get("mode") === "import";
  // Back from the delivery points page: carry on with what was filled in, and pick a point just added.
  const back = location.state as { resume?: boolean; addressId?: string } | null;
  const [initial] = useState<Partial<Draft>>(() => (back?.resume ? loadDraft() : {}));
  const returnedId = back?.addressId;

  const [productChoice, setProductChoice] = useState(initial.productChoice ?? buyer.products[0]);
  const [otherProduct, setOtherProduct] = useState(initial.otherProduct ?? "");
  const [quantity, setQuantity] = useState(initial.quantity ?? "");
  const [grade, setGrade] = useState(initial.grade ?? GRADE_OPTIONS[0]);
  const [note, setNote] = useState(initial.note ?? "");
  const [neededBy, setNeededBy] = useState(initial.neededBy ?? toInputDate(5));
  const [addressId, setAddressId] = useState(returnedId ?? initial.addressId ?? addresses[0]?.id ?? "");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    saveDraft({ productChoice, otherProduct, quantity, grade, note, neededBy, addressId });
  }, [productChoice, otherProduct, quantity, grade, note, neededBy, addressId]);

  const known = [...new Set([...buyer.products, ...supply.map((batch) => batch.product)])];
  const product = productChoice === OTHER ? productName(otherProduct, known) : productChoice;
  const quantityKg = Number(quantity);
  const neededByDay = toOffset(neededBy);
  // A removed point falls back to the default.
  const address = addresses.find((item) => item.id === addressId) ?? addresses[0];
  const manageLink = "/buyer/company?returnTo=/buyer/demands/new";

  // Live matching: how many declared batches already fit what is filled in so far.
  const canPreview = Boolean(product) && Number.isFinite(neededByDay) && neededByDay >= 1;
  const previewKg = quantity && quantityKg > 0 ? quantityKg : 1;
  const fitting = canPreview
    ? rankSupply({ id: "new", product, quantityKg: previewKg, gradeWanted: grade, neededByDay, destination: "", createdDay: 0 }, supply, previewKg).candidates.length
    : 0;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problems: string[] = [];
    if (!product) problems.push("Enter the product you need.");
    if (!quantity || !Number.isFinite(quantityKg) || quantityKg <= 0) problems.push("Enter a quantity above 0 kg.");
    if (!Number.isFinite(neededByDay) || neededByDay < 1) problems.push("The needed-by date must be tomorrow or later.");
    if (!address) problems.push("Add a delivery point first.");
    setErrors(problems);
    if (problems.length > 0 || !address) return;

    const demand: Omit<BuyerDemand, "id" | "createdDay"> = {
      product,
      quantityKg,
      gradeWanted: grade,
      neededByDay,
      destination: formatAddress(address),
      addressId: address.id,
      deliveryWindow: address.receivingHours,
      note: note.trim() || undefined,
    };
    saveDraft(null);
    navigate(`/buyer/demands/${addDemand(demand)}`);
  };

  return (
    <main className="ph-main bu-new">
      <Link to="/buyer/demands" className="ph-back">
        <ArrowLeft size={16} /> My demands
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">New demand</p>
          <h1>What do you need?</h1>
        </div>
      </section>

      <div className="ph-segmented bu-new-mode" role="group" aria-label="How to post">
        <button type="button" aria-pressed={!importing} onClick={() => setParams({}, { replace: true })}>
          One demand
        </button>
        <button type="button" aria-pressed={importing} onClick={() => setParams({ mode: "import" }, { replace: true })}>
          Import from file
        </button>
      </div>

      {importing ? (
        <ImportDemands />
      ) : (
      <form className="bu-new-grid" onSubmit={submit} noValidate>
        <div className="bu-new-main">
          <Section step={1} title="Product">
            <div className="ph-field-row">
              <div className="ph-field">
                <span id="new-product">Product</span>
                <select aria-labelledby="new-product" value={productChoice} onChange={(event) => setProductChoice(event.target.value)}>
                  <ProductOptions usual={buyer.products} />
                  <option value={OTHER}>Other…</option>
                </select>
                {productChoice === OTHER && (
                  <input
                    aria-label="Product name"
                    placeholder="Type the product, e.g. Durian"
                    value={otherProduct}
                    autoFocus
                    onChange={(event) => setOtherProduct(event.target.value)}
                  />
                )}
              </div>
              <label className="ph-field">
                <span>Quantity (kg)</span>
                <input type="number" min="1" inputMode="numeric" placeholder="e.g. 1,500" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </label>
            </div>

            <fieldset className="ph-field">
              <legend>Accepted quality</legend>
              <div className="ph-grade-options bu-wrap">
                {GRADE_OPTIONS.map((item) => (
                  <label key={item}>
                    <input type="radio" name="grade" value={item} checked={grade === item} onChange={() => setGrade(item)} />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="ph-field">
              <span>Notes for producers (optional)</span>
              <textarea rows={2} placeholder="e.g. Red flesh preferred, export packing" value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
          </Section>

          <Section step={2} title="When">
            <div className="ph-field-row">
              <label className="ph-field">
                <span>Needed by</span>
                <input type="date" min={toInputDate(1)} value={neededBy} onChange={(event) => setNeededBy(event.target.value)} />
              </label>
              <div className="ph-field">
                <span>Arrival window</span>
                <p className="bu-field-text">
                  <Clock size={14} aria-hidden="true" />
                  {address ? `${address.receivingHours}, when ${address.label} receives` : "Set by the delivery point"}
                </p>
              </div>
            </div>
          </Section>

          <Section
            step={3}
            title="Deliver to"
            action={
              <Link to={manageLink} className="ph-link-btn">
                <Settings size={14} /> Manage delivery points
              </Link>
            }
          >
            <div className="bu-addresses" role="radiogroup" aria-label="Delivery point">
              {addresses.map((item, index) => {
                const on = item.id === address?.id;
                return (
                  <label key={item.id} className={on ? "bu-address bu-address--on" : "bu-address"}>
                    <input type="radio" name="address" checked={on} onChange={() => setAddressId(item.id)} />
                    <span className="bu-address-top">
                      <strong>
                        {item.label}
                        {index === 0 && <small className="bu-point-default">Default</small>}
                      </strong>
                      {on && <Check size={16} aria-hidden="true" />}
                    </span>
                    <span className="bu-address-line">{[item.street, item.ward, item.district, item.province].filter(Boolean).join(", ")}</span>
                    <span className="bu-address-meta">
                      <span>
                        <User size={12} aria-hidden="true" /> {item.contactName} · {item.phone}
                      </span>
                      <span>
                        <Clock size={12} aria-hidden="true" /> Receives {item.receivingHours}
                      </span>
                    </span>
                  </label>
                );
              })}
              <Link to={`${manageLink}&add=1`} className="bu-address bu-address--new">
                <Plus size={18} aria-hidden="true" />
                <strong>Add a delivery point</strong>
              </Link>
            </div>

            {address?.note && (
              <p className="bu-field-text bu-driver-note">
                <MapPin size={14} aria-hidden="true" /> Driver note: {address.note}
              </p>
            )}
          </Section>
        </div>

        <aside className="bu-new-side">
          <div className="ph-card bu-summary">
            <h2>Summary</h2>
            <dl>
              <div>
                <dt>Product</dt>
                <dd>{product || "—"}</dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>{quantity && quantityKg > 0 ? formatKg(quantityKg) : "—"}</dd>
              </div>
              <div>
                <dt>Quality</dt>
                <dd>{grade}</dd>
              </div>
              <div>
                <dt>Needed by</dt>
                <dd>{Number.isFinite(neededByDay) && neededByDay >= 1 ? formatDay(neededByDay) : "—"}</dd>
              </div>
              <div>
                <dt>Deliver to</dt>
                <dd>{address?.label ?? "—"}</dd>
              </div>
            </dl>

            <p className={fitting > 0 ? "bu-live bu-live--yes" : "bu-live"} aria-live="polite">
              <span className="bu-live-dot" aria-hidden="true" />
              {!canPreview
                ? "Fill in the product and date to see matching supply"
                : fitting > 0
                  ? `${fitting} ${fitting === 1 ? "batch fits" : "batches fit"} right now`
                  : "No batch fits yet. Farmora keeps matching as producers declare supply."}
            </p>

            {errors.length > 0 && (
              <ul className="ph-form-errors" role="alert">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}

            <button type="submit" className="ph-btn ph-btn--primary bu-post">
              Post demand
            </button>
            <Link
              to="/buyer/demands"
              className="ph-link-btn bu-cancel"
              onClick={() => saveDraft(null)}
            >
              Cancel
            </Link>
          </div>
        </aside>
      </form>
      )}
    </main>
  );
}
