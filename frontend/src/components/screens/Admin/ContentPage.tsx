import { useState } from "react";
import { ExternalLink, RotateCcw } from "lucide-react";
import { useSite } from "@/lib/site";
import { CONTENT_FIELDS, type ContentField } from "@/lib/siteContent";
import { saveContent } from "./data/adminApi";
import { SaveBar } from "./sections/SaveBar";
import { useJustSaved } from "./data/useJustSaved";

const GROUPS = [...new Set(CONTENT_FIELDS.map((field) => field.group))];

function Field({ field, value, changed, onChange }: { field: ContentField; value: string; changed: boolean; onChange: (value: string) => void }) {
  const id = `content-${field.key}`;
  const over = value.length > field.maxLength;
  const Input = field.multiline ? "textarea" : "input";
  return (
    <div className="ad-field">
      <div className="ad-field-head">
        <label htmlFor={id}>{field.label}</label>
        {changed && <span className="ad-pill">Changed</span>}
        {value !== field.defaultValue && (
          <button type="button" className="ad-reset" onClick={() => onChange(field.defaultValue)} title="Back to the default text">
            <RotateCcw size={13} /> Default
          </button>
        )}
      </div>
      <Input
        id={id}
        className="ad-input"
        value={value}
        rows={field.multiline ? Math.min(5, Math.max(2, Math.ceil(field.defaultValue.length / 70))) : undefined}
        aria-invalid={over || !value.trim() ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="ad-field-foot">
        <span>{field.hint ?? <code>{field.key}</code>}</span>
        <span className={over ? "ad-over" : undefined}>
          {value.length}/{field.maxLength}
        </span>
      </p>
    </div>
  );
}

/** The landing page's text, grouped as it appears on the page. */
export default function ContentPage() {
  const site = useSite();
  const current = (field: ContentField) => site.content[field.key] ?? field.defaultValue;
  const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries(CONTENT_FIELDS.map((field) => [field.key, current(field)])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, markSaved] = useJustSaved();

  const changed = CONTENT_FIELDS.filter((field) => draft[field.key] !== current(field));
  const invalid = CONTENT_FIELDS.find((field) => !draft[field.key].trim() || draft[field.key].length > field.maxLength);
  const offline = site.source !== "api";

  const save = async () => {
    if (invalid) {
      setError(`${invalid.group} · ${invalid.label}: ${draft[invalid.key].trim() ? "too long" : "cannot be empty"}`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      // The default text is stored as "no override", so a reset field follows future defaults.
      await saveContent(Object.fromEntries(changed.map((field) => [field.key, draft[field.key] === field.defaultValue ? null : draft[field.key]])));
      markSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="ph-main lg-page ad-page ad-page--bar">
      <header className="lg-head lg-head--action">
        <div>
          <h1>Site content</h1>
          <p>Text on the public landing page. Saved text replaces the default for every visitor.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="ph-btn">
          Open the landing page <ExternalLink size={14} />
        </a>
      </header>

      {offline && <p className="ad-offline">The API is not reachable, so changes cannot be saved right now.</p>}

      <div className="co-stack">
        {GROUPS.map((group) => (
          <section key={group} className="ph-card ad-panel" aria-labelledby={`group-${group}`}>
            <h2 id={`group-${group}`}>{group}</h2>
            <div className="ad-fields">
              {CONTENT_FIELDS.filter((field) => field.group === group).map((field) => (
                <Field
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  changed={draft[field.key] !== current(field)}
                  onChange={(value) => setDraft((all) => ({ ...all, [field.key]: value }))}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <SaveBar
        dirty={changed.length > 0}
        saving={saving}
        error={offline && changed.length > 0 ? "the API is not reachable" : error}
        onSave={() => void save()}
        onDiscard={() => {
          setDraft(Object.fromEntries(CONTENT_FIELDS.map((field) => [field.key, current(field)])));
          setError("");
        }}
        justSaved={justSaved}
      />
    </main>
  );
}
