// B3.1.2: what suppliers see, who may propose, until when, and how proposals will be compared.
import { useState } from "react";
import { CRITERIA_LABEL, SUPPLY_REGIONS } from "../model/catalog";
import { publishDemand } from "../model/store";
import { addDays, fromLocalInput, toLocalInput, vnInstant } from "../model/time";
import type { CriteriaType, Demand, SupplierScope } from "../model/types";
import type { Errors } from "../model/validation";
import { Field, FormError, GateNote } from "../ui/parts";
import { useVerified } from "../ui/format";

const DEFAULT_WEIGHTS: Record<CriteriaType, number> = { PRICE: 40, QUALITY: 30, CAPACITY: 20, DELIVERY_TIME: 10 };

export function PublishPanel({ demand }: { demand: Demand }) {
  const verified = useVerified();
  const [title, setTitle] = useState(`${demand.crop}${demand.variety ? ` (${demand.variety})` : ""}, ${demand.quantity.toLocaleString("en-GB")} kg`);
  const [description, setDescription] = useState(demand.productDescription);
  const [scope, setScope] = useState<SupplierScope>({ kind: "ALL" });
  // Default deadline: 18:00 two days before delivery starts, or tomorrow if that has passed.
  const [deadline, setDeadline] = useState(() => toLocalInput(Math.max(vnInstant(addDays(demand.deliveryFrom, -2), 18), Date.now() + 86_400_000)));
  const [useCriteria, setUseCriteria] = useState(true);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [errors, setErrors] = useState<Errors>({});
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);

  const publish = () => {
    const criteria = useCriteria ? (Object.keys(weights) as CriteriaType[]).filter((type) => weights[type] > 0).map((type) => ({ type, weight: weights[type] })) : [];
    // A weight left at 0 is dropped; the rest must still add up to 100.
    const result = publishDemand(demand.code, { title, description, scope, submissionDeadline: fromLocalInput(deadline), criteria });
    setErrors(result.ok ? {} : result.errors);
  };

  return (
    <section className="ph-card bf-form-section" aria-labelledby="publish-title">
      <h2 id="publish-title">Publish to suppliers</h2>
      <p className="ph-section-sub">After publishing, quantity, quality requirements and criteria can no longer be changed.</p>
      <div className="bf-grid">
        <Field label="Title suppliers see" error={errors.title} wide>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="Description" error={errors.description} wide>
          <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <Field label="Submission deadline" error={errors.submissionDeadline} hint="Proposals close automatically at this time (Vietnam time)">
          <input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        </Field>
        <Field group label="Who may propose" error={errors.scope}>
          <div className="bf-radios">
            <label>
              <input type="radio" name="scope" checked={scope.kind === "ALL"} onChange={() => setScope({ kind: "ALL" })} /> All verified suppliers
            </label>
            <label>
              <input type="radio" name="scope" checked={scope.kind === "REGIONS"} onChange={() => setScope({ kind: "REGIONS", regions: [] })} /> Suppliers in some regions
            </label>
          </div>
          {scope.kind === "REGIONS" && (
            <div className="bf-checks">
              {SUPPLY_REGIONS.map((region) => (
                <label key={region}>
                  <input
                    type="checkbox"
                    checked={scope.regions.includes(region)}
                    onChange={() => setScope({ kind: "REGIONS", regions: scope.regions.includes(region) ? scope.regions.filter((item) => item !== region) : [...scope.regions, region] })}
                  />
                  {region}
                </label>
              ))}
            </div>
          )}
        </Field>
      </div>

      <div className="bf-criteria">
        <label className="bf-inline-check">
          <input type="checkbox" checked={useCriteria} onChange={(event) => setUseCriteria(event.target.checked)} /> Score proposals by weighted criteria (you still choose)
        </label>
        {useCriteria && (
          <>
            <div className="bf-weights">
              {(Object.keys(weights) as CriteriaType[]).map((type) => (
                <label key={type} className="ph-field">
                  <span>{CRITERIA_LABEL[type]}</span>
                  <span className="bf-suffix">
                    <input type="number" min={0} max={100} value={weights[type]} onChange={(event) => setWeights({ ...weights, [type]: Number(event.target.value) })} />%
                  </span>
                </label>
              ))}
            </div>
            <p className={total === 100 ? "bf-hint" : "bf-error"}>Total {total}%{total === 100 ? "" : " — must be 100%"}</p>
            {errors.criteria && <p className="bf-error">{errors.criteria}</p>}
          </>
        )}
      </div>

      <GateNote />
      <FormError errors={errors} />
      <div className="bf-actions">
        <button type="button" className="ph-btn ph-btn--primary" disabled={!verified} onClick={publish}>
          Publish demand
        </button>
      </div>
    </section>
  );
}
