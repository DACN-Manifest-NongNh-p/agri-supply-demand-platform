import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useSite, type Rule } from "@/lib/site";
import { saveRules } from "./data/adminApi";
import { useJustSaved } from "./data/useJustSaved";
import { SaveBar } from "./sections/SaveBar";

/** Where each rule takes effect, so the admin knows what a change does. */
const WHERE: Record<Rule["key"], string> = {
  autoMatchMinScore: "Coordinator matching",
  signOffKg: "Coordinator matching",
  holdHours: "Holds (buyer, producer, coordinator)",
  holdWarningHours: "Alerts and Needs action",
  dueSoonDays: "Alerts and Needs action",
  sellSoonDays: "Coordinator: unsold supply",
  coldChainMin: "Deliveries: cold chain",
  coldChainMax: "Deliveries: cold chain",
};

const format = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

/** Thresholds the matching engine, holds and alerts use; changed here, applied on everyone's next visit. */
export default function RulesPage() {
  const { rules, source } = useSite();
  const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries(rules.map((rule) => [rule.key, format(rule.value)])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, markSaved] = useJustSaved();

  const parsed = (rule: Rule) => Number(draft[rule.key]);
  const invalid = (rule: Rule) => draft[rule.key].trim() === "" || !Number.isFinite(parsed(rule)) || parsed(rule) < rule.min || parsed(rule) > rule.max;
  const changed = rules.filter((rule) => !invalid(rule) && parsed(rule) !== rule.value);
  const bad = rules.find(invalid);
  const offline = source !== "api";

  const save = async () => {
    if (bad) {
      setError(`${bad.label} must be between ${format(bad.min)} and ${format(bad.max)} ${bad.unit}`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveRules(Object.fromEntries(changed.map((rule) => [rule.key, parsed(rule)])));
      markSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="ph-main lg-page ad-page ad-page--bar">
      <header className="lg-head">
        <h1>Operating rules</h1>
        <p>Thresholds that decide when the system acts on its own and when it warns people. Each change applies on users' next visit.</p>
      </header>

      {offline && <p className="ad-offline">The API is not reachable, so rules cannot be changed right now.</p>}

      <section className="ph-card ad-panel">
        <ul className="ad-rules">
          {rules.map((rule) => {
            const id = `rule-${rule.key}`;
            const isChanged = !invalid(rule) && parsed(rule) !== rule.value;
            return (
              <li key={rule.key} className="ad-rule">
                <div className="ad-rule-text">
                  <label htmlFor={id}>
                    {rule.label}
                    {rule.value !== rule.defaultValue && !isChanged && <span className="ad-pill ad-pill--soft">Custom</span>}
                    {isChanged && <span className="ad-pill">Changed</span>}
                  </label>
                  <p>{rule.description}</p>
                  <small>
                    {WHERE[rule.key]} · default {format(rule.defaultValue)} {rule.unit} · allowed {format(rule.min)}–{format(rule.max)}
                    {rule.updatedBy && ` · last changed by ${rule.updatedBy}`}
                  </small>
                </div>
                <div className="ad-rule-input">
                  <span className="ad-unit-input">
                    <input
                      id={id}
                      type="number"
                      inputMode="decimal"
                      min={rule.min}
                      max={rule.max}
                      step={rule.unit === "°C" ? 0.5 : 1}
                      value={draft[rule.key]}
                      aria-invalid={invalid(rule) ? true : undefined}
                      onChange={(event) => setDraft((all) => ({ ...all, [rule.key]: event.target.value }))}
                    />
                    <em>{rule.unit}</em>
                  </span>
                  {parsed(rule) !== rule.defaultValue && (
                    <button type="button" className="ad-reset" onClick={() => setDraft((all) => ({ ...all, [rule.key]: format(rule.defaultValue) }))}>
                      <RotateCcw size={13} /> Default
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <SaveBar
        dirty={changed.length > 0 || Boolean(bad)}
        saving={saving}
        error={offline ? "the API is not reachable" : error}
        onSave={() => void save()}
        onDiscard={() => {
          setDraft(Object.fromEntries(rules.map((rule) => [rule.key, format(rule.value)])));
          setError("");
        }}
        justSaved={justSaved}
      />
    </main>
  );
}
