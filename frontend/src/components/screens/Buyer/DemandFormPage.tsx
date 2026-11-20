// B3.1.1: create a demand (saved as a draft), or edit a draft. Publishing is a separate step on the
// demand page, where the deadline, supplier scope and selection criteria are set (B3.1.2).
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CERTIFICATIONS, GRADE_LABEL, GRADES, varietiesOf } from "./model/catalog";
import { ProductPicker } from "./sections/ProductPicker";
import { saveDemand, useBuyerData } from "./model/store";
import { addDays, formatDateRange, todayIso } from "./model/time";
import type { QualityGrade } from "./model/types";
import type { DemandDraft, Errors } from "./model/validation";
import { formatAddress } from "./data/mockBuyer";
import { AddressPicker } from "./ui/AddressPicker";
import { Field, FormError, PageHead } from "./ui/parts";
import { kg, vnd } from "./ui/format";

export default function DemandFormPage() {
  const { code } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const data = useBuyerData();
  const editing = code ? data.demands.find((item) => item.code === code) : undefined;
  const home = data.addresses[0];
  const [draft, setDraft] = useState<DemandDraft>(() =>
    editing
      ? { ...editing }
      : {
          crop: params.get("crop") ?? "",
          variety: params.get("variety") ?? undefined,
          productDescription: "",
          quantity: 0,
          unit: "kg",
          deliveryFrom: addDays(todayIso(), 5),
          deliveryTo: addDays(todayIso(), 7),
          deliveryLocation: home ? formatAddress(home) : "",
          requiredCertifications: [],
        },
  );
  const [errors, setErrors] = useState<Errors>({});

  if (code && (!editing || editing.status !== "DRAFT")) {
    return (
      <main className="ph-main">
        <Link to={code ? `/buyer/demands/${code}` : "/buyer/demands"} className="ph-back">
          <ArrowLeft size={16} /> Back
        </Link>
        <p className="ph-empty">{editing ? "Only a draft can be edited. After publishing, quantity, quality and criteria are fixed." : `Demand ${code} was not found.`}</p>
      </main>
    );
  }

  const set = <K extends keyof DemandDraft>(key: K, value: DemandDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key as string] ? { ...current, [key]: "" } : current));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = saveDemand(draft, editing?.code);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    navigate(`/buyer/demands/${result.value}`);
  };

  return (
    <main className="ph-main bf-page">
      <Link to={editing ? `/buyer/demands/${editing.code}` : "/buyer/demands"} className="ph-back">
        <ArrowLeft size={16} /> {editing ? editing.code : "Demands"}
      </Link>
      <PageHead
        eyebrow={editing ? `Edit draft ${editing.code}` : "New demand"}
        title="What do you need?"
        summary="Saved as a draft. You publish it on the next step."
      />

      <form className="bf-columns" onSubmit={submit} noValidate>
        <div className="bf-col-main">
          <section className="ph-card bf-form-section">
            <h2>Product</h2>
            <div className="bf-grid">
              <Field group label="Product" error={errors.crop} wide>
                <ProductPicker
                  value={draft.crop}
                  usual={data.profile.procurementCategories}
                  stats={(name) => ({ lots: data.lots.filter((lot) => lot.crop === name && lot.available > 0).length })}
                  onChange={(name) => {
                    set("crop", name);
                    set("variety", undefined);
                  }}
                />
              </Field>
              <Field label="Variety (optional)" error={errors.variety}>
                <select value={draft.variety ?? ""} onChange={(event) => set("variety", event.target.value || undefined)} disabled={!draft.crop}>
                  <option value="">Any variety</option>
                  {varietiesOf(draft.crop).map((variety) => (
                    <option key={variety}>{variety}</option>
                  ))}
                </select>
              </Field>
              <Field label="Product description" error={errors.productDescription} wide>
                <input value={draft.productDescription} placeholder="e.g. Red-flesh dragon fruit, 350 g and up, export packing" onChange={(event) => set("productDescription", event.target.value)} />
              </Field>
            </div>
          </section>

          <section className="ph-card bf-form-section">
            <h2>Quantity</h2>
            <div className="bf-grid">
              <Field label="Quantity needed (kg)" error={errors.quantity} hint="Each proposal can offer up to this quantity">
                <input type="number" min={1} inputMode="numeric" value={draft.quantity || ""} onChange={(event) => set("quantity", Number(event.target.value))} />
              </Field>
            </div>
          </section>

          <section className="ph-card bf-form-section">
            <h2>Quality (optional)</h2>
            <div className="bf-grid">
              <Field group label="Quality standard">
                <div className="bf-radios">
                  <label>
                    <input type="radio" name="grade" checked={!draft.qualityStandard} onChange={() => set("qualityStandard", undefined)} /> Not specified
                  </label>
                  {GRADES.map((grade) => (
                    <label key={grade}>
                      <input type="radio" name="grade" checked={draft.qualityStandard === grade} onChange={() => set("qualityStandard", grade as QualityGrade)} />
                      {GRADE_LABEL[grade]}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Size, ripeness, packing" wide>
                <input value={draft.qualityNotes ?? ""} onChange={(event) => set("qualityNotes", event.target.value || undefined)} />
              </Field>
            </div>
          </section>

          <section className="ph-card bf-form-section">
            <h2>Delivery</h2>
            <div className="bf-grid">
              <Field label="Deliver from" error={errors.deliveryFrom}>
                <input type="date" min={addDays(todayIso(), 1)} value={draft.deliveryFrom} onChange={(event) => set("deliveryFrom", event.target.value)} />
              </Field>
              <Field label="Deliver until" error={errors.deliveryTo}>
                <input type="date" min={draft.deliveryFrom} value={draft.deliveryTo} onChange={(event) => set("deliveryTo", event.target.value)} />
              </Field>
              <Field label="Deliver to" error={errors.deliveryLocation} wide>
                <AddressPicker value={draft.deliveryLocation} onChange={(address) => set("deliveryLocation", address)} />
              </Field>
            </div>
          </section>

          <section className="ph-card bf-form-section">
            <h2>Commercial (optional)</h2>
            <div className="bf-grid">
              <Field label="Budget (VND)" error={errors.budget} hint="Shown only to you">
                <input type="number" min={0} step={100000} inputMode="numeric" value={draft.budget ?? ""} onChange={(event) => set("budget", event.target.value ? Number(event.target.value) : undefined)} />
              </Field>
              <Field label="Commercial terms" wide>
                <input value={draft.commercialTerms ?? ""} placeholder="e.g. Delivered and unloaded at our DC" onChange={(event) => set("commercialTerms", event.target.value || undefined)} />
              </Field>
            </div>
          </section>

          <section className="ph-card bf-form-section">
            <h2>Additional requirements (optional)</h2>
            <div className="bf-grid">
              <Field group label="Certificates proposals must include" wide>
                <div className="bf-checks">
                  {CERTIFICATIONS.map((cert) => (
                    <label key={cert}>
                      <input
                        type="checkbox"
                        checked={draft.requiredCertifications.includes(cert)}
                        onChange={() => set("requiredCertifications", draft.requiredCertifications.includes(cert) ? draft.requiredCertifications.filter((item) => item !== cert) : [...draft.requiredCertifications, cert])}
                      />
                      {cert}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Other documents or requirements" wide>
                <textarea rows={2} value={draft.additionalRequirements ?? ""} onChange={(event) => set("additionalRequirements", event.target.value || undefined)} />
              </Field>
            </div>
          </section>
        </div>

        <aside className="bf-col-side">
          <div className="ph-card bf-sticky">
            <h2>Draft</h2>
            <dl className="bf-facts">
              <div>
                <dt>Product</dt>
                <dd>{draft.crop ? `${draft.crop}${draft.variety ? ` · ${draft.variety}` : ""}` : "—"}</dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>{draft.quantity > 0 ? kg(draft.quantity) : "—"}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{draft.deliveryFrom && draft.deliveryTo ? formatDateRange(draft.deliveryFrom, draft.deliveryTo) : "—"}</dd>
              </div>
              {draft.budget ? (
                <div>
                  <dt>Budget</dt>
                  <dd>{vnd(draft.budget)}</dd>
                </div>
              ) : null}
            </dl>
            <FormError errors={errors} />
            {Object.keys(errors).length > 0 && !errors.form && <p className="bf-error">Fix the highlighted fields.</p>}
            <button type="submit" className="ph-btn ph-btn--primary">
              Save draft
            </button>
            <p className="ph-muted bf-small">Next: set the submission deadline, who may propose and how you will compare proposals, then publish.</p>
          </div>
        </aside>
      </form>
    </main>
  );
}
