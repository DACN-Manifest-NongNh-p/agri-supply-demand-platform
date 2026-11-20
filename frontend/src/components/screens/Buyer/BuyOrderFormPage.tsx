// B3.3.1: place a buy order, or change one that is not locked for a session. A four-step form that
// explains how every choice affects matching, with a live plain-language summary on the side.
// Every field still comes from the Farmora catalogs so the engine can compare it (§7.5.1).
import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CalendarClock, Check, Info, TriangleAlert } from "lucide-react";
import { useNow } from "@/components/orders/useNow";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CERTIFICATIONS, GRADE_LABEL, GRADES, SESSION_TYPE_LABEL, varietiesOf, zoneForProvince, zoneLabel, ZONES } from "./model/catalog";
import { compatibleLots, orderLocked, placeBuyOrder, upcomingSlot, updateBuyOrder, useBuyerData } from "./model/store";
import { addDays, formatDate, formatDateRange, formatTime, todayIso } from "./model/time";
import type { QualityGrade, TimeInForce } from "./model/types";
import { validateBuyOrder, type BuyOrderDraft, type Errors } from "./model/validation";
import { latestPrices } from "./model/prices";
import { formatAddress } from "./data/mockBuyer";
import { AddressPicker } from "./ui/AddressPicker";
import { ProductPicker } from "./sections/ProductPicker";
import { FormError, GateNote, PageHead } from "./ui/parts";
import { kg, perKg, useVerified, vnd } from "./ui/format";

const STEPS: { title: string; hint: string; fields: (keyof BuyOrderDraft)[] }[] = [
  { title: "Product", hint: "What you want to buy", fields: ["crop", "variety"] },
  { title: "Quantity & price", hint: "How much, and the most you pay", fields: ["requested", "maxPrice"] },
  { title: "Delivery", hint: "Where and when you receive it", fields: ["deliveryLocation", "zone", "deliveryStart", "deliveryEnd"] },
  { title: "Review", hint: "How long it stays, then place it", fields: ["validUntil"] },
];

const GRADE_HELP: Record<QualityGrade, string> = {
  A: "Top quality. Fewer lots, usually a higher price.",
  B: "Standard for retail shelves. Most lots are B or better.",
  C: "Fine for processing, juice or catering. The widest choice.",
};

const QUANTITY_CHIPS = [500, 1000, 2000, 5000];

function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="bw-hint">
      <Info size={14} aria-hidden="true" /> <span>{children}</span>
    </p>
  );
}

function Missing({ children }: { children: ReactNode }) {
  return <em className="bw-missing">{children}</em>;
}

export default function BuyOrderFormPage() {
  const { code } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const data = useBuyerData();
  const verified = useVerified();
  const now = useNow(5000);
  const editing = code ? data.buyOrders.find((item) => item.code === code) : undefined;
  const home = data.addresses[0];

  const [draft, setDraft] = useState<BuyOrderDraft>(() =>
    editing
      ? {
          crop: editing.crop,
          variety: editing.variety,
          grade: editing.grade,
          requested: editing.requested,
          unit: "kg",
          maxPrice: editing.maxPrice,
          qualityRequirements: editing.qualityRequirements,
          certifications: editing.certifications,
          deliveryLocation: editing.deliveryLocation,
          zone: editing.zone,
          deliveryStart: editing.deliveryStart,
          deliveryEnd: editing.deliveryEnd,
          deliveryConditions: editing.deliveryConditions,
          additionalConditions: editing.additionalConditions,
          timeInForce: editing.timeInForce,
          validUntil: editing.validUntil,
        }
      : {
          crop: params.get("crop") ?? "",
          variety: params.get("variety") ?? undefined,
          grade: (params.get("grade") as QualityGrade) ?? "B",
          requested: 0,
          unit: "kg",
          maxPrice: Number(params.get("price")) || 0,
          certifications: [],
          deliveryLocation: home ? formatAddress(home) : "",
          zone: home ? zoneForProvince(home.province) : "SE-HCM",
          deliveryStart: addDays(todayIso(), 1),
          deliveryEnd: addDays(todayIso(), 3),
          timeInForce: "DAY",
        },
  );
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(editing ? STEPS.length - 1 : 0);
  const [errors, setErrors] = useState<Errors>({});
  const [showZone, setShowZone] = useState(false);

  if (code && !editing) {
    return (
      <main className="ph-main">
        <Link to="/buyer/orders" className="ph-back">
          <ArrowLeft size={16} /> Buy orders
        </Link>
        <p className="ph-empty">Buy order {code} was not found.</p>
      </main>
    );
  }

  const set = <K extends keyof BuyOrderDraft>(key: K, value: BuyOrderDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key as string] ? { ...current, [key]: "" } : current));
  };
  const filled = editing ? editing.requested - editing.remaining : 0;
  const slot = upcomingSlot(now, data);
  const locked = editing ? orderLocked(editing, now) : false;
  const prices = latestPrices(data.prices);
  const marketPrice = prices.find((price) => price.crop === draft.crop && price.grade === draft.grade && price.zone === draft.zone)?.price ?? prices.find((price) => price.crop === draft.crop)?.price;
  const lotsFor = (change: Partial<BuyOrderDraft>) => (draft.crop || change.crop ? compatibleLots({ ...draft, ...change }) : []);
  const lots = lotsFor({});
  const supply = lots.reduce((sum, lot) => sum + lot.available, 0);
  const address = data.addresses.find((item) => formatAddress(item) === draft.deliveryLocation);
  const belowMarket = marketPrice !== undefined && draft.maxPrice > 0 && draft.maxPrice < marketPrice * 0.97;

  /** Errors of the fields of one step only, so the buyer is not told about steps still ahead. */
  const stepErrors = (index: number) => {
    const all = validateBuyOrder(draft, filled);
    return Object.fromEntries(Object.entries(all).filter(([field]) => STEPS[index].fields.includes(field as keyof BuyOrderDraft)));
  };

  const goTo = (target: number) => {
    if (target > step) {
      for (let index = step; index < target; index += 1) {
        const found = stepErrors(index);
        if (Object.keys(found).length) {
          setStep(index);
          setErrors(found);
          return;
        }
      }
    }
    setErrors({});
    setStep(target);
    setReached((current) => Math.max(current, target));
  };

  const submit = () => {
    const result = editing ? updateBuyOrder(editing.code, draft) : placeBuyOrder(draft);
    if (!result.ok) {
      const first = STEPS.findIndex((item) => item.fields.some((field) => result.errors[field]));
      if (first >= 0 && first !== step) setStep(first);
      setErrors(result.errors);
      return;
    }
    navigate(`/buyer/orders/${editing ? editing.code : result.value}`);
  };

  return (
    <main className="ph-main bf-page">
      <Link to={editing ? `/buyer/orders/${editing.code}` : "/buyer/orders"} className="ph-back">
        <ArrowLeft size={16} /> {editing ? editing.code : "Buy orders"}
      </Link>
      <PageHead
        eyebrow={editing ? `Change ${editing.code}` : "Buy order"}
        title={editing ? "Change your buy order" : "What do you want to buy?"}
        summary="Four short steps."
      />

      <ol className="bw-steps" aria-label="Steps">
        {STEPS.map((item, index) => (
          <li key={item.title} className={index === step ? "is-now" : index < step || index <= reached ? "is-done" : undefined}>
            <button type="button" onClick={() => goTo(index)} disabled={index > reached + 1 && !editing}>
              <span className="bw-step-n">{index < step ? <Check size={14} /> : index + 1}</span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.hint}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="bf-columns">
        <form
          className="ph-card bw-card"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (step < STEPS.length - 1) goTo(step + 1);
            else submit();
          }}
        >
          {step === 0 && (
            <>
              <section className="bw-block">
                <h2>Product</h2>
                <ProductPicker
                  value={draft.crop}
                  usual={data.profile.procurementCategories}
                  stats={(name) => ({ lots: lotsFor({ crop: name, variety: undefined }).length, price: prices.find((item) => item.crop === name)?.price })}
                  onChange={(name) => {
                    setDraft((current) => ({ ...current, crop: name, variety: undefined }));
                    setErrors((current) => ({ ...current, crop: "" }));
                  }}
                />
                {errors.crop && <p className="bf-error">{errors.crop}</p>}
              </section>

              {draft.crop && (
                <>
                  <section className="bw-block">
                    <h3>Variety</h3>
                    <div className="bw-chips">
                      {[undefined, ...varietiesOf(draft.crop)].map((variety) => {
                        const count = lotsFor({ variety }).length;
                        return (
                          <button key={variety ?? "any"} type="button" className={draft.variety === variety ? "bw-chip is-on" : "bw-chip"} onClick={() => set("variety", variety)}>
                            {variety ?? "Any variety"} <small>{count}</small>
                          </button>
                        );
                      })}
                    </div>
                    <Hint>“Any variety” lets more suppliers match. Pick one only if you really need it.</Hint>
                  </section>

                  <section className="bw-block">
                    <h3>Minimum grade</h3>
                    <div className="bw-options">
                      {GRADES.map((grade) => {
                        const count = lotsFor({ grade }).length;
                        return (
                          <button key={grade} type="button" className={draft.grade === grade ? "bw-option is-on" : "bw-option"} onClick={() => set("grade", grade)}>
                            <span className="bw-radio" aria-hidden="true" />
                            <span>
                              <strong>
                                {GRADE_LABEL[grade]} or better <small>{count} lots</small>
                              </strong>
                              <small>{GRADE_HELP[grade]}</small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="bw-block">
                    <h3>
                      Certificates <span className="bw-optional">optional</span>
                    </h3>
                    <div className="bw-chips">
                      {CERTIFICATIONS.map((cert) => {
                        const onIt = draft.certifications.includes(cert);
                        const next = onIt ? draft.certifications.filter((item) => item !== cert) : [...draft.certifications, cert];
                        return (
                          <button key={cert} type="button" className={onIt ? "bw-chip is-on" : "bw-chip"} onClick={() => set("certifications", next)}>
                            {onIt && <Check size={13} />} {cert} <small>{lotsFor({ certifications: onIt ? draft.certifications : next }).length}</small>
                          </button>
                        );
                      })}
                    </div>
                    <Hint>Each certificate you require leaves out lots without it. The number shows how many lots would still fit.</Hint>
                  </section>
                </>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <section className="bw-block">
                <h2>How much?</h2>
                <label className="bw-big-input">
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="e.g. 2,000"
                    value={draft.requested || ""}
                    onChange={(event) => set("requested", Number(event.target.value))}
                    aria-label="Quantity in kilograms"
                  />
                  <span>kg</span>
                </label>
                <div className="bw-chips">
                  {QUANTITY_CHIPS.map((value) => (
                    <button key={value} type="button" className={draft.requested === value ? "bw-chip is-on" : "bw-chip"} onClick={() => set("requested", value)}>
                      {kg(value)}
                    </button>
                  ))}
                </div>
                {errors.requested && <p className="bf-error">{errors.requested}</p>}
                <Hint>
                  You may receive it from several suppliers, in parts. {supply > 0 ? `${kg(supply)} of matching supply is published right now.` : ""}
                  {filled ? ` ${kg(filled)} is already matched and cannot be removed.` : ""}
                </Hint>
              </section>

              <section className="bw-block">
                <h2>The most you will pay</h2>
                <label className="bw-big-input">
                  <input
                    type="number"
                    min={1}
                    step={100}
                    inputMode="numeric"
                    placeholder={marketPrice ? `e.g. ${marketPrice.toLocaleString("en-GB")}` : "e.g. 30,000"}
                    value={draft.maxPrice || ""}
                    onChange={(event) => set("maxPrice", Number(event.target.value))}
                    aria-label="Maximum price in dong per kilogram"
                  />
                  <span>₫/kg</span>
                </label>
                {marketPrice && (
                  <div className="bw-chips">
                    <button type="button" className={draft.maxPrice === marketPrice ? "bw-chip is-on" : "bw-chip"} onClick={() => set("maxPrice", marketPrice)}>
                      Market price {marketPrice.toLocaleString("en-GB")}
                    </button>
                    <button type="button" className="bw-chip" onClick={() => set("maxPrice", Math.round((marketPrice * 1.05) / 100) * 100)}>
                      +5% to match sooner
                    </button>
                  </div>
                )}
                {errors.maxPrice && <p className="bf-error">{errors.maxPrice}</p>}
                {belowMarket ? (
                  <p className="bw-warn">
                    <TriangleAlert size={15} aria-hidden="true" /> Below the last market price ({perKg(marketPrice!)}). The order may wait several sessions before it matches.
                  </p>
                ) : (
                  <Hint>You never pay more than this. Everyone in the session pays the same clearing price, which can be lower. Other buyers and suppliers never see your limit.</Hint>
                )}
                {editing && draft.maxPrice !== editing.maxPrice && <p className="bw-warn">Changing the price puts the order behind others at the same price.</p>}
              </section>
            </>
          )}

          {step === 2 && (
            <>
              <section className="bw-block">
                <h2>Deliver to</h2>
                <AddressPicker
                  value={draft.deliveryLocation}
                  onChange={(value, province) => {
                    set("deliveryLocation", value);
                    set("zone", zoneForProvince(province));
                  }}
                />
                {errors.deliveryLocation && <p className="bf-error">{errors.deliveryLocation}</p>}
                <p className="bw-zone">
                  Delivery zone: <strong>{zoneLabel(draft.zone)}</strong>{" "}
                  <button type="button" className="ph-link-btn" onClick={() => setShowZone(!showZone)}>
                    {showZone ? "Done" : "Change"}
                  </button>
                </p>
                {showZone && (
                  <select value={draft.zone} onChange={(event) => set("zone", event.target.value)} className="bw-select" aria-label="Delivery zone">
                    {ZONES.map((zone) => (
                      <option key={zone.code} value={zone.code}>
                        {zone.label}
                      </option>
                    ))}
                  </select>
                )}
                <Hint>Only lots that can ship to this zone are matched. It is set from your delivery point.</Hint>
              </section>

              <section className="bw-block">
                <h2>When can you receive it?</h2>
                <div className="bw-chips">
                  {[
                    ["Next 3 days", 1, 3],
                    ["This week", 1, 7],
                    ["Next 2 weeks", 1, 14],
                  ].map(([label, from, to]) => {
                    const start = addDays(todayIso(), from as number);
                    const end = addDays(todayIso(), to as number);
                    return (
                      <button
                        key={label}
                        type="button"
                        className={draft.deliveryStart === start && draft.deliveryEnd === end ? "bw-chip is-on" : "bw-chip"}
                        onClick={() => setDraft((current) => ({ ...current, deliveryStart: start, deliveryEnd: end }))}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="bw-dates">
                  <label>
                    <small>From</small>
                    <input type="date" min={todayIso()} value={draft.deliveryStart} onChange={(event) => set("deliveryStart", event.target.value)} />
                  </label>
                  <span aria-hidden="true">→</span>
                  <label>
                    <small>Until</small>
                    <input type="date" min={draft.deliveryStart || todayIso()} value={draft.deliveryEnd} onChange={(event) => set("deliveryEnd", event.target.value)} />
                  </label>
                </div>
                {(errors.deliveryStart || errors.deliveryEnd) && <p className="bf-error">{errors.deliveryStart ?? errors.deliveryEnd}</p>}
                <Hint>A wider window lets more lots match: a supplier's lot must be available on at least one of these days.</Hint>
              </section>
            </>
          )}

          {step === 3 && (
            <>
              <section className="bw-block">
                <h2>How long should the order stay?</h2>
                <div className="bw-options bw-options--2">
                  {(["DAY", "GTC"] as TimeInForce[]).map((tif) => (
                    <button key={tif} type="button" className={draft.timeInForce === tif ? "bw-option is-on" : "bw-option"} onClick={() => set("timeInForce", tif)}>
                      <span className="bw-radio" aria-hidden="true" />
                      <span>
                        <strong>{tif === "DAY" ? "Today only" : "Until a date"}</strong>
                        <small>
                          {tif === "DAY"
                            ? "Joins today's remaining sessions, then expires tonight."
                            : "Carries over from session to session until filled, cancelled or the date."}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
                {draft.timeInForce === "GTC" && (
                  <label className="bw-dates">
                    <span>
                      <small>Valid until</small>
                      <input type="date" min={addDays(todayIso(), 1)} value={draft.validUntil ?? ""} onChange={(event) => set("validUntil", event.target.value)} />
                    </span>
                  </label>
                )}
                {errors.validUntil && <p className="bf-error">{errors.validUntil}</p>}
              </section>

              <details className="bw-block bw-notes">
                <summary>Add notes for suppliers (optional)</summary>
                <label>
                  <small>Size, ripeness, packing</small>
                  <input value={draft.qualityRequirements ?? ""} placeholder="e.g. 350 g and up, export cartons" onChange={(event) => set("qualityRequirements", event.target.value || undefined)} />
                </label>
                <label>
                  <small>Delivery conditions</small>
                  <input value={draft.deliveryConditions ?? ""} placeholder="e.g. Refrigerated truck, unload at dock 3" onChange={(event) => set("deliveryConditions", event.target.value || undefined)} />
                </label>
                <label>
                  <small>Anything else</small>
                  <input value={draft.additionalConditions ?? ""} onChange={(event) => set("additionalConditions", event.target.value || undefined)} />
                </label>
              </details>

              <section className="bw-block bw-confirm">
                <h2>Check your order</h2>
                <dl>
                  {[
                    [0, "Product", `${draft.crop}${draft.variety ? ` · ${draft.variety}` : " · any variety"}, ${GRADE_LABEL[draft.grade]} or better${draft.certifications.length ? `, ${draft.certifications.join(" + ")}` : ""}`],
                    [1, "Quantity", kg(draft.requested)],
                    [1, "Most you pay", `${perKg(draft.maxPrice)} · up to ${vnd(draft.requested * draft.maxPrice)} in total`],
                    [2, "Delivery", `${address?.label ?? draft.deliveryLocation} · ${formatDate(draft.deliveryStart)} – ${formatDate(draft.deliveryEnd)}`],
                  ].map(([target, label, value]) => (
                    <div key={label as string}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                      <button type="button" className="ph-link-btn" onClick={() => setStep(target as number)}>
                        Edit
                      </button>
                    </div>
                  ))}
                </dl>
              </section>
            </>
          )}

          {locked && <p className="bw-warn">This order is locked while the session runs. Changes open again after it has matched.</p>}
          {step === STEPS.length - 1 && <GateNote />}
          <FormError errors={errors} />

          <div className="bw-nav">
            {step > 0 ? (
              <button type="button" className="ph-btn" onClick={() => goTo(step - 1)}>
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <span />
            )}
            <span className="bw-count">
              Step {step + 1} of {STEPS.length}
            </span>
            {step < STEPS.length - 1 ? (
              <button type="submit" className="ph-btn ph-btn--primary">
                Next: {STEPS[step + 1].title} <ArrowRight size={15} />
              </button>
            ) : (
              <button type="submit" className="ph-btn ph-btn--primary" disabled={!verified || locked}>
                {editing ? "Save changes" : "Place buy order"}
              </button>
            )}
          </div>
        </form>

        <aside className="bf-col-side">
          <div className="ph-card bf-sticky bw-summary">
            <p className="ph-eyebrow">Your order</p>
            <dl className="bw-receipt">
              <div>
                <dt>Product</dt>
                <dd>{draft.crop ? `${draft.crop}${draft.variety ? ` · ${draft.variety}` : ""}` : <Missing>Not chosen</Missing>}</dd>
              </div>
              <div>
                <dt>Quality</dt>
                <dd>{GRADE_LABEL[draft.grade]} or better</dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>{draft.requested > 0 ? `up to ${kg(draft.requested)}` : <Missing>Not set</Missing>}</dd>
              </div>
              <div>
                <dt>Max price</dt>
                <dd>{draft.maxPrice > 0 ? perKg(draft.maxPrice) : <Missing>Not set</Missing>}</dd>
              </div>
              <div>
                <dt>Deliver to</dt>
                <dd>{address?.label ?? <Missing>Not chosen</Missing>}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{formatDateRange(draft.deliveryStart, draft.deliveryEnd)}</dd>
              </div>
            </dl>

            <div className="bw-total">
              <span>Most you pay</span>
              <strong>{draft.requested > 0 && draft.maxPrice > 0 ? vnd(draft.requested * draft.maxPrice) : "—"}</strong>
            </div>
            <div className="bw-outlook">
              <span>
                <small>On the market</small>
                <strong>{draft.crop ? `${lots.length} lot${lots.length === 1 ? "" : "s"} · ${kg(supply)}` : "—"}</strong>
              </span>
              <span>
                <small>Last price</small>
                <strong>{marketPrice ? perKg(marketPrice) : "—"}</strong>
              </span>
            </div>
            <p className="bw-session">
              <CalendarClock size={15} aria-hidden="true" />
              <span>
              Joins the <strong>{SESSION_TYPE_LABEL[slot.type].toLowerCase()} session at {formatTime(slot.scheduled)}</strong>
              {slot.date !== todayIso() ? " tomorrow" : ""}. Orders close at {formatTime(slot.cutoff)}.
              </span>
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
