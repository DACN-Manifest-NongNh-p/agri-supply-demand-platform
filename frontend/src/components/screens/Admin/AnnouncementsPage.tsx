import { useEffect, useState, type FormEvent } from "react";
import { Info, Megaphone, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useSite, type Announcement, type AnnouncementTone, type Audience } from "@/lib/site";
import { AUDIENCE_LABEL, TONE_LABEL, deleteAnnouncement, listAnnouncements, saveAnnouncement, type AnnouncementDraft } from "./data/adminApi";

const AUDIENCES = Object.keys(AUDIENCE_LABEL) as Audience[];
const TONES: AnnouncementTone[] = ["INFO", "WARNING", "URGENT"];
const ICON = { INFO: Info, WARNING: Megaphone, URGENT: TriangleAlert };
const MAX = 280;

const EMPTY: AnnouncementDraft = { message: "", tone: "INFO", audiences: ["PRODUCER", "BUYER"], startsAt: null, endsAt: null, active: true };

/** ISO instant → value for <input type="datetime-local"> in local time, and back. */
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

const when = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function status(item: Announcement) {
  if (!item.active) return { label: "Off", tone: "off" };
  if (item.live) return { label: "Live", tone: "live" };
  if (item.startsAt && new Date(item.startsAt) > new Date()) return { label: `Starts ${when.format(new Date(item.startsAt))}`, tone: "later" };
  return { label: "Ended", tone: "off" };
}

/** Banners shown at the top of chosen areas (or on the public site) for an optional time window. */
export default function AnnouncementsPage() {
  const { source } = useSite();
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<AnnouncementDraft>(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listAnnouncements()
      .then(setItems)
      .catch((cause) => setLoadError(cause instanceof Error ? cause.message : "Could not load announcements."));
  }, []);

  const open = (item?: Announcement) => {
    setEditing(item ? item.id : "new");
    setDraft(
      item
        ? { message: item.message, tone: item.tone, audiences: item.audiences, startsAt: item.startsAt ?? null, endsAt: item.endsAt ?? null, active: item.active }
        : EMPTY,
    );
    setError("");
  };

  const run = async (action: () => Promise<Announcement[]>) => {
    setBusy(true);
    setError("");
    try {
      setItems(await action());
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.message.trim()) return setError("Write the message.");
    if (draft.audiences.length === 0) return setError("Pick at least one audience.");
    if (await run(() => saveAnnouncement(editing === "new" ? null : (editing as number), draft))) setEditing(null);
  };

  const toggleAudience = (audience: Audience) =>
    setDraft((current) => ({
      ...current,
      audiences: current.audiences.includes(audience) ? current.audiences.filter((item) => item !== audience) : [...current.audiences, audience],
    }));

  const PreviewIcon = ICON[draft.tone];

  return (
    <main className="ph-main lg-page ad-page">
      <header className="lg-head lg-head--action">
        <div>
          <h1>Announcements</h1>
          <p>A banner at the top of the chosen areas, for example planned maintenance or a holiday schedule.</p>
        </div>
        {editing === null && (
          <button type="button" className="ph-btn ph-btn--primary" onClick={() => open()} disabled={source !== "api"}>
            <Plus size={16} /> New announcement
          </button>
        )}
      </header>

      {(source !== "api" || loadError) && <p className="ad-offline">{loadError || "The API is not reachable, so announcements cannot be changed right now."}</p>}

      {editing !== null && (
        <form className="ph-card ad-panel ad-announce-form" onSubmit={(event) => void submit(event)} noValidate>
          <h2>{editing === "new" ? "New announcement" : "Edit announcement"}</h2>

          <div className="ad-field">
            <div className="ad-field-head">
              <label htmlFor="announce-message">Message</label>
            </div>
            <textarea
              id="announce-message"
              className="ad-input"
              rows={2}
              maxLength={MAX}
              value={draft.message}
              placeholder="e.g. Farmora will be offline for maintenance on Sunday 02:00–04:00."
              onChange={(event) => setDraft({ ...draft, message: event.target.value })}
            />
            <p className="ad-field-foot">
              <span />
              <span>
                {draft.message.length}/{MAX}
              </span>
            </p>
          </div>

          <div className="ad-form-row">
            <fieldset className="ad-choice">
              <legend>Tone</legend>
              {TONES.map((tone) => (
                <label key={tone} className={draft.tone === tone ? "is-on" : undefined}>
                  <input type="radio" name="tone" checked={draft.tone === tone} onChange={() => setDraft({ ...draft, tone })} />
                  {TONE_LABEL[tone]}
                </label>
              ))}
            </fieldset>
            <fieldset className="ad-choice">
              <legend>Show to</legend>
              {AUDIENCES.map((audience) => (
                <label key={audience} className={draft.audiences.includes(audience) ? "is-on" : undefined}>
                  <input type="checkbox" checked={draft.audiences.includes(audience)} onChange={() => toggleAudience(audience)} />
                  {AUDIENCE_LABEL[audience]}
                </label>
              ))}
            </fieldset>
          </div>

          <div className="ad-form-row">
            <label className="ad-field">
              <span className="ad-label">Starts (optional)</span>
              <input type="datetime-local" className="ad-input" value={toLocalInput(draft.startsAt)} onChange={(event) => setDraft({ ...draft, startsAt: fromLocalInput(event.target.value) })} />
            </label>
            <label className="ad-field">
              <span className="ad-label">Ends (optional)</span>
              <input type="datetime-local" className="ad-input" value={toLocalInput(draft.endsAt)} onChange={(event) => setDraft({ ...draft, endsAt: fromLocalInput(event.target.value) })} />
            </label>
            <label className="ad-switch">
              <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
              Active
            </label>
          </div>

          <div className="ad-preview">
            <span className="ad-label">Preview</span>
            <p className={`ab-item ab-item--${draft.tone.toLowerCase()}`}>
              <PreviewIcon size={16} aria-hidden="true" />
              <span>{draft.message || "Your message"}</span>
            </p>
          </div>

          {error && <p className="ph-field-error">{error}</p>}
          <div className="ph-form-actions">
            <button type="button" className="ph-btn" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="ph-btn ph-btn--primary" disabled={busy}>
              {busy ? "Saving…" : editing === "new" ? "Publish" : "Save"}
            </button>
          </div>
        </form>
      )}

      <section className="ph-card ad-panel" aria-label="All announcements">
        {items === null ? (
          <p className="ad-muted">{loadError ? "Not available." : "Loading…"}</p>
        ) : items.length === 0 ? (
          <p className="ad-muted">No announcements yet.</p>
        ) : (
          <ul className="ad-announce-list">
            {items.map((item) => {
              const state = status(item);
              return (
                <li key={item.id}>
                  <div className="ad-announce-main">
                    <p className="ad-announce-top">
                      <span className={`ad-state ad-state--${state.tone}`}>{state.label}</span>
                      <span className={`ad-tone ad-tone--${item.tone.toLowerCase()}`}>{TONE_LABEL[item.tone]}</span>
                    </p>
                    <p className="ad-announce-message">{item.message}</p>
                    <small>
                      {item.audiences.map((audience) => AUDIENCE_LABEL[audience]).join(", ")}
                      {item.endsAt && ` · until ${when.format(new Date(item.endsAt))}`}
                      {item.updatedBy && ` · by ${item.updatedBy}`}
                    </small>
                  </div>
                  <div className="ad-row-actions">
                    <button type="button" className="ph-btn" onClick={() => open(item)} disabled={busy}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      className="ph-btn"
                      disabled={busy}
                      onClick={() => void run(() => saveAnnouncement(item.id, { message: item.message, tone: item.tone, audiences: item.audiences, startsAt: item.startsAt ?? null, endsAt: item.endsAt ?? null, active: !item.active }))}
                    >
                      {item.active ? "Turn off" : "Turn on"}
                    </button>
                    <button
                      type="button"
                      className="ph-btn ph-btn--icon"
                      aria-label="Delete announcement"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm("Delete this announcement?")) void run(() => deleteAnnouncement(item.id));
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
