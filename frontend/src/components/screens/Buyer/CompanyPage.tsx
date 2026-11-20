// B0-Buyer: business profile, representative, documents and verification status (BRD 0.1).
import { useState, type ReactNode } from "react";
import { VerifyDemo } from "../LandingPage/sections/Demos";
import { ArrowLeft, FileText, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { useSite } from "@/lib/site";
import {
  BUSINESS_TYPE_LABEL,
  DOCUMENT_TYPE_LABEL,
  needsRegistrationNumber,
  PROVINCES,
  REPRESENTATIVE_TYPE_LABEL,
  SUPPLY_REGIONS,
  VERIFICATION_LABEL,
} from "./model/catalog";
import { addDocument, demoSetVerification, legalFieldsChanged, removeDocument, saveProfile, submitProfile, useBuyerData } from "./model/store";
import { formatDateTime } from "./model/time";
import type { BusinessType, BuyerProfile, DocumentType, RepresentativeType, VerificationStatus } from "./model/types";
import type { Errors } from "./model/validation";
import { Field, FormError, History, PageHead, Pill, Steps } from "./ui/parts";
import { VERIFICATION_TONE } from "./ui/tones";

const STEPS = ["Profile", "Submitted", "Business checked", "Verified"];

function stepOf(status: VerificationStatus) {
  if (status === "NOT_SUBMITTED" || status === "NEEDS_ADDITIONAL_INFORMATION" || status === "REJECTED") return 0;
  if (status === "PENDING_VERIFICATION") return 1;
  if (status === "UNDER_REVIEW") return 2;
  return 4;
}

/** Documents the buyer must upload for this business type and representative (FR-B0B-08). */
function requiredDocuments(profile: BuyerProfile): { type: DocumentType; why: string; required: boolean }[] {
  return [
    { type: "BUSINESS_REGISTRATION", why: "Registration certificate, or the equivalent for your business type.", required: true },
    { type: "AUTHORIZATION_DOCUMENT", why: "You act for the business on its legal representative's authority.", required: profile.representativeType === "AUTHORIZED_REPRESENTATIVE" },
    { type: "TAX_DOCUMENT", why: "Only if your tax code is not on the registration certificate.", required: false },
    { type: "REPRESENTATIVE_DOCUMENT", why: "When Farmora asks for it.", required: false },
  ];
}

function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="ph-card bf-form-section">
      <h2>{title}</h2>
      {sub && <p className="ph-section-sub">{sub}</p>}
      <div className="bf-grid">{children}</div>
    </section>
  );
}

export default function CompanyPage() {
  const data = useBuyerData();
  const catalog = useSite().products.filter((product) => product.active);
  const saved = data.profile;
  const [draft, setDraft] = useState<BuyerProfile>(saved);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocumentType>("BUSINESS_REGISTRATION");

  // Documents live on the saved profile; the draft keeps them in sync.
  const profile = { ...draft, documents: saved.documents, status: saved.status, history: saved.history, reviewNote: saved.reviewNote, verifiedAt: saved.verifiedAt };
  const reviewing = saved.status === "PENDING_VERIFICATION" || saved.status === "UNDER_REVIEW";
  const canSubmit = ["NOT_SUBMITTED", "NEEDS_ADDITIONAL_INFORMATION", "REJECTED"].includes(saved.status);
  const reverify = saved.status === "VERIFIED" && legalFieldsChanged(profile, saved);
  const dirty = JSON.stringify(profile) !== JSON.stringify(saved);

  const set = <K extends keyof BuyerProfile>(key: K, value: BuyerProfile[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const text = (key: keyof BuyerProfile, label: string, options: { hint?: string; type?: string; wide?: boolean; legal?: boolean } = {}) => (
    <Field label={`${label}`} error={errors[key]} hint={options.hint} wide={options.wide}>
      <input type={options.type ?? "text"} value={profile[key] as string} disabled={reviewing} onChange={(event) => set(key, event.target.value as never)} />
    </Field>
  );
  const toggle = (key: "procurementCategories" | "preferredRegions", value: string) =>
    set(key, profile[key].includes(value) ? profile[key].filter((item) => item !== value) : [...profile[key], value]);

  const save = () => {
    const result = saveProfile(profile);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setMessage(result.value.reverify ? "Saved. Your legal details changed, so the profile went back for verification; new trades are paused until it is verified again." : "Saved.");
  };

  const submit = () => {
    const result = submitProfile(profile);
    if (!result.ok) {
      setErrors(result.errors);
      setMessage(null);
      return;
    }
    setErrors({});
    setMessage("Submitted. A Farmora coordinator checks your business, then your representative.");
  };

  return (
    <main className="ph-main bf-page">
      <Link to="/buyer" className="ph-back">
        <ArrowLeft size={16} /> Back to home
      </Link>
      <PageHead
        eyebrow="Business profile"
        title={saved.businessName || "Your business"}
        summary="Verified businesses can trade."
        demo={<VerifyDemo />}
        help="Farmora checks the business behind every buyer and the person acting for it. Until your profile is verified you can browse the market and keep demand drafts, but you cannot publish, bid, order or confirm."
        actions={<Pill tone={VERIFICATION_TONE[saved.status]}>{VERIFICATION_LABEL[saved.status]}</Pill>}
      />

      <section className="ph-card bf-verify">
        <Steps
          steps={STEPS}
          current={stepOf(saved.status)}
          stopped={saved.status === "NEEDS_ADDITIONAL_INFORMATION" ? "More information needed" : saved.status === "REJECTED" ? "Rejected" : undefined}
        />
        {saved.reviewNote && (
          <p className="bf-callout bf-callout--warn">
            <strong>Farmora coordinator:</strong> {saved.reviewNote}
          </p>
        )}
        {saved.status === "VERIFIED" && saved.verifiedAt && <p className="ph-muted">Verified {formatDateTime(saved.verifiedAt)}. Changing sections A, B or C sends the profile back for review.</p>}
        {reviewing && <p className="ph-muted">Your profile is locked while it is reviewed. Trading opens when it is verified.</p>}
      </section>

      <div className="bf-columns">
        <div className="bf-col-main">
          <Section title="A. Business">
            {text("businessName", "Business name", { legal: true, wide: true })}
            <Field label={`Business type`}>
              <select value={profile.businessType} disabled={reviewing} onChange={(event) => set("businessType", event.target.value as BusinessType)}>
                {Object.entries(BUSINESS_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            {text("registrationNumber", needsRegistrationNumber(profile.businessType) ? "Registration number" : "Registration number (if any)", { legal: true })}
            {text("taxCode", "Tax code (if any)", { legal: true, hint: "10 digits, or 10 + 3 for a branch" })}
            {text("industry", "Industry")}
            {text("businessEmail", "Business email", { type: "email" })}
            {text("businessPhone", "Business phone", { type: "tel" })}
            {text("website", "Website (optional)")}
            <Field label="What the business does (optional)" wide>
              <textarea rows={2} value={profile.description} disabled={reviewing} onChange={(event) => set("description", event.target.value)} />
            </Field>
          </Section>

          <Section title="B. Registered address" sub="Head office or registered place of business. Delivery locations are chosen per demand and buy order.">
            {text("country", "Country", { legal: true })}
            <Field label={`Province`} error={errors.province}>
              <select value={profile.province} disabled={reviewing} onChange={(event) => set("province", event.target.value)}>
                <option value="">Choose…</option>
                {PROVINCES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            {text("ward", "Ward", { legal: true })}
            {text("streetAddress", "Street address", { legal: true, wide: true })}
          </Section>

          <Section title="C. Representative" sub="The person who answers for the buyer's commitments on Farmora.">
            <Field group label={`Representative type`} wide>
              <div className="bf-radios">
                {(Object.keys(REPRESENTATIVE_TYPE_LABEL) as RepresentativeType[]).map((type) => (
                  <label key={type}>
                    <input type="radio" name="rep" checked={profile.representativeType === type} disabled={reviewing} onChange={() => set("representativeType", type)} />
                    {REPRESENTATIVE_TYPE_LABEL[type]}
                  </label>
                ))}
              </div>
            </Field>
            {text("representativeName", "Full name", { legal: true })}
            {text("representativePosition", "Position", { legal: true })}
            {text("representativeEmail", "Email", { legal: true, type: "email" })}
            {text("representativePhone", "Phone", { legal: true, type: "tel" })}
          </Section>

          <Section title="D. Procurement (optional)" sub="Helps suppliers and coordinators; you can change it any time.">
            <Field group label="Products you usually buy" wide>
              <div className="bf-checks">
                {catalog.map((product) => (
                  <label key={product.name}>
                    <input type="checkbox" checked={profile.procurementCategories.includes(product.name)} disabled={reviewing} onChange={() => toggle("procurementCategories", product.name)} />
                    {product.name}
                  </label>
                ))}
              </div>
            </Field>
            <Field group label="Regions you source from" wide>
              <div className="bf-checks">
                {SUPPLY_REGIONS.map((region) => (
                  <label key={region}>
                    <input type="checkbox" checked={profile.preferredRegions.includes(region)} disabled={reviewing} onChange={() => toggle("preferredRegions", region)} />
                    {region}
                  </label>
                ))}
              </div>
            </Field>
            {text("expectedVolume", "Expected volume")}
            {text("procurementFrequency", "How often you buy")}
          </Section>

          <section className="ph-card bf-form-section">
            <h2>E. Verification documents</h2>
            <ul className="bf-doc-needs">
              {requiredDocuments(profile).map((need) => {
                const uploaded = profile.documents.some((doc) => doc.type === need.type);
                return (
                  <li key={need.type} className={uploaded ? "is-done" : need.required ? "is-needed" : undefined}>
                    <strong>
                      {DOCUMENT_TYPE_LABEL[need.type]} {need.required ? <Pill tone={uploaded ? "good" : "warn"}>{uploaded ? "Uploaded" : "Required"}</Pill> : <Pill tone="muted">If applicable</Pill>}
                    </strong>
                    <small>{need.why}</small>
                  </li>
                );
              })}
            </ul>
            {errors.documents && (
              <p className="bf-error" role="alert">
                {errors.documents}
              </p>
            )}
            <ul className="bf-docs">
              {profile.documents.map((doc) => (
                <li key={doc.id}>
                  <FileText size={16} aria-hidden="true" />
                  <span>
                    <strong>{doc.fileName}</strong>
                    <small>
                      {DOCUMENT_TYPE_LABEL[doc.type]} · uploaded {formatDateTime(doc.uploadedAt)}
                      {doc.review && ` · ${doc.review.status === "ACCEPTED" ? "accepted" : doc.review.status === "NEEDS_FIX" ? "needs a fix" : "rejected"}${doc.review.note ? `: ${doc.review.note}` : ""}`}
                    </small>
                  </span>
                  {!reviewing && (
                    <button type="button" className="ph-btn ph-btn--icon" aria-label={`Remove ${doc.fileName}`} onClick={() => removeDocument(doc.id)}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {!reviewing && (
              <div className="bf-upload">
                <select value={docType} onChange={(event) => setDocType(event.target.value as DocumentType)} aria-label="Document type">
                  {Object.entries(DOCUMENT_TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <label className="ph-btn">
                  <Upload size={15} /> Upload file
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="ph-sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) addDocument(docType, file.name);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            )}
          </section>
        </div>

        <aside className="bf-col-side">
          <div className="ph-card bf-sticky">
            <h2>{canSubmit ? "Submit for verification" : "Save changes"}</h2>
            {canSubmit ? (
              <p className="ph-muted">Farmora checks the business against your documents and public records, then the representative. You can save a draft any time.</p>
            ) : reverify ? (
              <p className="bf-callout bf-callout--warn">You changed a legal detail. Saving sends the profile back for verification and pauses new trades until it is verified again.</p>
            ) : (
              <p className="ph-muted">Contact and procurement details save straight away.</p>
            )}
            <FormError errors={errors} />
            {Object.keys(errors).filter((key) => key !== "form").length > 0 && <p className="bf-error">Fix the highlighted fields.</p>}
            {message && (
              <p className="bf-callout" role="status">
                {message}
              </p>
            )}
            <div className="bf-stack">
              {canSubmit && (
                <button type="button" className="ph-btn ph-btn--primary" onClick={submit}>
                  Submit for verification
                </button>
              )}
              <button type="button" className={canSubmit ? "ph-btn" : "ph-btn ph-btn--primary"} disabled={reviewing || !dirty} onClick={save}>
                {canSubmit ? "Save draft" : reverify ? "Save and re-verify" : "Save changes"}
              </button>
            </div>
          </div>

          <History entries={saved.history} title="Verification history" />

          <details className="ph-card bf-demo">
            <summary>Demo: set verification status</summary>
            <p className="ph-muted">Stands in for the coordinator, to see what each status allows.</p>
            <div className="bf-chips">
              {(Object.keys(VERIFICATION_LABEL) as VerificationStatus[]).map((status) => (
                <button key={status} type="button" className={status === saved.status ? "ph-chip ph-chip--active" : "ph-chip"} onClick={() => demoSetVerification(status)}>
                  {VERIFICATION_LABEL[status]}
                </button>
              ))}
            </div>
          </details>
        </aside>
      </div>
    </main>
  );
}
