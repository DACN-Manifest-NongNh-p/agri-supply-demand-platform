import { useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Camera, Check, Eye, EyeOff, KeyRound, Mail, Phone, X } from "lucide-react";
import { Link } from "react-router-dom";
import { usePartyParam } from "@/components/parties/usePartyParam";
import { SELF_BUYER_ID, SELF_PRODUCER_ID } from "@/lib/parties";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { getKeycloakUsername, isKeycloakAuthenticated, openAccountConsole } from "@/lib/keycloak";
import { Avatar } from "./Avatar";
import { PROFILE_FIELD_LABEL, saveProfile, squarePhoto, useProfile, type Profile, type ProfileArea, type ProfileField } from "./profileStore";
import "./profile.css";

type Props = {
  area: ProfileArea;
  roleLabel: string;
  /** "Farm" or "Company". */
  orgLabel: string;
  /** Extra cards in the side column (e.g. the buyer's delivery points). */
  aside?: ReactNode;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function problems(profile: Profile) {
  const list: string[] = [];
  if (!profile.name.trim()) list.push("Add your name.");
  if (!EMAIL.test(profile.email.trim())) list.push("Enter a valid email.");
  return list;
}

function ProductTags({ products, onChange }: { products: string[]; onChange: (products: string[]) => void }) {
  const [text, setText] = useState("");
  const add = () => {
    const value = text.trim();
    if (value && !products.some((product) => product.toLowerCase() === value.toLowerCase())) onChange([...products, value]);
    setText("");
  };
  return (
    <div className="pf-tags">
      {products.map((product) => (
        <span key={product} className="pf-tag">
          {product}
          <button type="button" aria-label={`Remove ${product}`} onClick={() => onChange(products.filter((item) => item !== product))}>
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={text}
        placeholder="Add a product…"
        aria-label="Add a product"
        onChange={(event) => setText(event.target.value)}
        onBlur={add}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add();
          } else if (event.key === "Backspace" && !text && products.length > 0) {
            onChange(products.slice(0, -1));
          }
        }}
      />
    </div>
  );
}

/** Public / private switch next to a field label. */
function Shown({ field, profile, onChange }: { field: ProfileField; profile: Profile; onChange: (field: ProfileField, value: boolean) => void }) {
  const on = profile.visibility[field];
  return (
    <button
      type="button"
      className={on ? "pf-vis is-public" : "pf-vis"}
      aria-pressed={on}
      title={on ? "Buyers and producers can see this. Click to keep it private." : "Only you and Farmora coordinators see this. Click to publish it."}
      onClick={() => onChange(field, !on)}
    >
      {on ? <Eye size={12} /> : <EyeOff size={12} />} {on ? "Public" : "Private"}
    </button>
  );
}

/** A field label with its public / private switch. */
function Label({ text, field, profile, onChange }: { text: string; field: ProfileField; profile: Profile; onChange: (field: ProfileField, value: boolean) => void }) {
  return (
    <span className="pf-label">
      {text} <Shown field={field} profile={profile} onChange={onChange} />
    </span>
  );
}

/** The signed-in user's profile: photo, personal details and the farm or company they act for. */
export function ProfilePage({ area, roleLabel, orgLabel, aside }: Props) {
  const saved = useProfile(area);
  const [draft, setDraft] = useState<Profile>(saved);
  const [errors, setErrors] = useState<string[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const authenticated = isKeycloakAuthenticated();
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const edit = (patch: Partial<Profile>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setJustSaved(false);
  };
  const editOrg = (patch: Partial<Profile["org"]>) => edit({ org: { ...draft.org, ...patch } });
  const setShown = (field: ProfileField, value: boolean) => edit({ visibility: { ...draft.visibility, [field]: value } });
  const { open: openParty } = usePartyParam();
  const publicCount = (Object.keys(draft.visibility) as ProfileField[]).filter((field) => draft.visibility[field]).length;

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError("");
    try {
      edit({ photo: await squarePhoto(file) });
    } catch (cause) {
      setPhotoError(cause instanceof Error ? cause.message : "Could not read that image.");
    }
  };

  const save = () => {
    const found = problems(draft);
    setErrors(found);
    if (found.length > 0) return;
    const clean: Profile = {
      ...draft,
      name: draft.name.trim(),
      title: draft.title.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      org: {
        ...draft.org,
        name: draft.org.name.trim(),
        type: draft.org.type.trim(),
        region: draft.org.region.trim(),
        about: draft.org.about.trim(),
        address: draft.org.address.trim(),
        taxId: draft.org.taxId.trim(),
        website: draft.org.website.trim(),
        volume: draft.org.volume.trim(),
      },
    };
    saveProfile(area, clean);
    setDraft(clean);
    setJustSaved(true);
  };

  return (
    <main className="ph-main pf-page">
      <Link to={`/${area}`} className="ph-back">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <section className="ph-card pf-hero">
        <div className="pf-photo">
          <Avatar name={draft.name || "?"} photo={draft.photo} size={92} />
          <button type="button" className="pf-photo-btn" aria-label="Change photo" title="Change photo" onClick={() => fileRef.current?.click()}>
            <Camera size={15} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              void pickPhoto(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
        <div className="pf-hero-text">
          <p className="ph-eyebrow">{roleLabel}</p>
          <h1>{draft.name || "Your name"}</h1>
          {(draft.title || draft.org.name) && <p className="pf-hero-sub">{[draft.title, draft.org.name].filter(Boolean).join(" · ")}</p>}
          <p className="pf-hero-meta">
            {draft.email && (
              <span>
                <Mail size={13} /> {draft.email}
              </span>
            )}
            {draft.phone && (
              <span>
                <Phone size={13} /> {draft.phone}
              </span>
            )}
          </p>
          {draft.photo && (
            <button type="button" className="ph-link-btn pf-remove-photo" onClick={() => edit({ photo: null })}>
              Remove photo
            </button>
          )}
          {photoError && <p className="ph-field-error">{photoError}</p>}
        </div>
      </section>

      <div className="pf-columns">
        <div className="pf-main-col">
        <form
          className="pf-forms"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <section className="ph-card pf-section" aria-labelledby="pf-personal">
            <h2 id="pf-personal">Personal details</h2>
            <p className="ph-muted pf-hint">
              Use <strong>Public</strong> / <strong>Private</strong> to choose what buyers and producers see on your card. Private details are shared
              with the other side only once you have a confirmed order together; coordinators always see them.
            </p>
            <div className="ph-field-row">
              <label className="ph-field">
                <Label text="Full name" field="contact" profile={draft} onChange={setShown} />
                <input value={draft.name} onChange={(event) => edit({ name: event.target.value })} autoComplete="name" />
              </label>
              <label className="ph-field">
                <span>Job title</span>
                <input value={draft.title} placeholder={area === "producer" ? "e.g. Farm owner" : "e.g. Purchasing manager"} onChange={(event) => edit({ title: event.target.value })} autoComplete="organization-title" />
              </label>
            </div>
            <div className="ph-field-row">
              <label className="ph-field">
                <Label text="Email" field="email" profile={draft} onChange={setShown} />
                <input type="email" value={draft.email} onChange={(event) => edit({ email: event.target.value })} autoComplete="email" />
              </label>
              <label className="ph-field">
                <Label text="Phone" field="phone" profile={draft} onChange={setShown} />
                <input type="tel" value={draft.phone} placeholder="e.g. 0912 345 678" onChange={(event) => edit({ phone: event.target.value })} autoComplete="tel" />
              </label>
            </div>
          </section>

          <section className="ph-card pf-section" aria-labelledby="pf-org">
            <h2 id="pf-org">{orgLabel}</h2>
            <div className="ph-field-row">
              <label className="ph-field">
                <span>{orgLabel} name</span>
                <input value={draft.org.name} placeholder={area === "producer" ? "e.g. Hoa Phat Cooperative" : "e.g. GreenBasket Supermarkets"} onChange={(event) => editOrg({ name: event.target.value })} autoComplete="organization" />
              </label>
              <label className="ph-field">
                <span>Type</span>
                <input value={draft.org.type} placeholder={area === "producer" ? "Cooperative, family farm…" : "Retail chain, wholesaler, factory…"} onChange={(event) => editOrg({ type: event.target.value })} />
              </label>
            </div>
            <div className={area === "producer" ? "ph-field-row" : "ph-field-row pf-row-single"}>
              <label className="ph-field">
                <span>{area === "producer" ? "Growing region" : "Head office"}</span>
                <input value={draft.org.region} placeholder={area === "producer" ? "District, province" : "Address of the main office"} onChange={(event) => editOrg({ region: event.target.value })} />
              </label>
              {area === "producer" && (
                <label className="ph-field">
                  <Label text="Growing area (ha)" field="hectares" profile={draft} onChange={setShown} />
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={draft.org.hectares ?? ""}
                    onChange={(event) => editOrg({ hectares: event.target.value === "" ? null : Math.max(0, Number(event.target.value) || 0) })}
                  />
                </label>
              )}
            </div>
            <div className="ph-field">
              <Label text={area === "producer" ? "What you grow" : "What you usually buy"} field="products" profile={draft} onChange={setShown} />
              <ProductTags products={draft.org.products} onChange={(products) => editOrg({ products })} />
            </div>
            <label className="ph-field">
              <Label text="About" field="about" profile={draft} onChange={setShown} />
              <textarea rows={3} value={draft.org.about} placeholder="A line or two about what you do." onChange={(event) => editOrg({ about: event.target.value })} />
            </label>
          </section>

          <section className="ph-card pf-section" aria-labelledby="pf-business">
            <h2 id="pf-business">Business details</h2>
            <div className="ph-field-row">
              <label className="ph-field">
                <Label text="Business address" field="address" profile={draft} onChange={setShown} />
                <input value={draft.org.address} placeholder="Street, ward, district, province" onChange={(event) => editOrg({ address: event.target.value })} autoComplete="street-address" />
              </label>
              <label className="ph-field">
                <Label text="Tax / registration no." field="taxId" profile={draft} onChange={setShown} />
                <input value={draft.org.taxId} placeholder="e.g. 0313 554 201" onChange={(event) => editOrg({ taxId: event.target.value })} />
              </label>
            </div>
            <div className="ph-field-row">
              <label className="ph-field">
                <Label text="Website" field="website" profile={draft} onChange={setShown} />
                <input value={draft.org.website} placeholder="e.g. hoaphat.coop" onChange={(event) => editOrg({ website: event.target.value })} autoComplete="url" />
              </label>
              <label className="ph-field">
                <Label text={area === "producer" ? "Typical harvest volume" : "Typical order volume"} field="volume" profile={draft} onChange={setShown} />
                <input value={draft.org.volume} placeholder={area === "producer" ? "e.g. about 25 t a month in season" : "e.g. 40–60 t a month"} onChange={(event) => editOrg({ volume: event.target.value })} />
              </label>
            </div>
            {area === "producer" && (
              <div className="ph-field">
                <Label text="Certifications" field="certifications" profile={draft} onChange={setShown} />
                <ProductTags products={draft.org.certifications} onChange={(certifications) => editOrg({ certifications })} />
              </div>
            )}
          </section>

          {errors.length > 0 && (
            <ul className="ph-form-errors" role="alert">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}

          <div className="pf-actions">
            {justSaved && !dirty && (
              <span className="pf-saved" role="status">
                <Check size={15} /> Saved
              </span>
            )}
            <button
              type="button"
              className="ph-btn"
              disabled={!dirty}
              onClick={() => {
                setDraft(saved);
                setErrors([]);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="ph-btn ph-btn--primary" disabled={!dirty}>
              Save changes
            </button>
          </div>
        </form>
        <NotificationSettings area={area} contact={{ email: saved.email, phone: saved.phone }} />
        </div>

        <aside className="pf-aside">
          <section className="ph-card pf-section" aria-labelledby="pf-account">
            <h2 id="pf-account">Account</h2>
            <dl className="pf-facts">
              <div>
                <dt>Username</dt>
                <dd>{getKeycloakUsername() || "Demo account"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{roleLabel}</dd>
              </div>
            </dl>
            {authenticated && (
              <button type="button" className="ph-btn pf-wide" onClick={() => void openAccountConsole()}>
                <KeyRound size={15} /> Password & security
              </button>
            )}
          </section>
          <section className="ph-card pf-section" aria-labelledby="pf-visibility">
            <h2 id="pf-visibility">What others see</h2>
            <p className="ph-muted">
              {publicCount} of {Object.keys(draft.visibility).length} details are public.
            </p>
            <ul className="pf-vis-list">
              {(Object.keys(draft.visibility) as ProfileField[])
                .filter((field) => area === "producer" || (field !== "hectares" && field !== "certifications"))
                .map((field) => (
                  <li key={field}>
                    {PROFILE_FIELD_LABEL[field]} <Shown field={field} profile={draft} onChange={setShown} />
                  </li>
                ))}
            </ul>
            <button type="button" className="ph-btn pf-wide" disabled={dirty} title={dirty ? "Save your changes first" : undefined} onClick={() => openParty(area === "producer" ? SELF_PRODUCER_ID : SELF_BUYER_ID, area)}>
              <Eye size={15} /> Preview my card
            </button>
          </section>
          {aside}
        </aside>
      </div>
    </main>
  );
}
