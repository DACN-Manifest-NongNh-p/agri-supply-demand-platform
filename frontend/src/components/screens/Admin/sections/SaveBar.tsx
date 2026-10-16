import { Check } from "lucide-react";

type Props = {
  dirty: boolean;
  saving: boolean;
  /** Why the last save failed, or why saving is not possible. */
  error?: string;
  onSave: () => void;
  onDiscard: () => void;
  /** True for a moment after a successful save (see useJustSaved). */
  justSaved: boolean;
};

/** Bottom bar for pages edited as a draft: unsaved changes, Discard, Save. */
export function SaveBar({ dirty, saving, error, onSave, onDiscard, justSaved }: Props) {
  if (!dirty && !justSaved && !error) return null;

  return (
    <div className={dirty || error ? "lg-savebar" : "lg-savebar is-saved"} role="status">
      {dirty || error ? (
        <>
          <span>
            {dirty ? "You have unsaved changes" : "Not saved"}
            {error && <span className="lg-savebar-error"> · {error}</span>}
          </span>
          {dirty && (
            <button type="button" className="ph-btn" onClick={onDiscard} disabled={saving}>
              Discard
            </button>
          )}
          <button type="button" className="ph-btn ph-btn--primary" onClick={onSave} disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </>
      ) : (
        <span className="lg-savebar-ok">
          <Check size={16} aria-hidden="true" /> Saved. Everyone sees the change on their next visit.
        </span>
      )}
    </div>
  );
}
