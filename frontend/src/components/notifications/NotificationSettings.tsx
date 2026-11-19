import { useState } from "react";
import { BellRing, Check } from "lucide-react";
import {
  AREA_EVENTS,
  CHANNEL_LABEL,
  clearOutbox,
  EVENT_LABEL,
  savePrefs,
  usePrefs,
  useOutbox,
  type NotifyArea,
  type NotifyChannel,
  type NotifyPrefs,
} from "@/lib/notificationPrefs";
import "@/components/offers/offers.css";

const CHANNELS: NotifyChannel[] = ["in_app", "email", "sms", "zalo"];
const time = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/**
 * Which events reach the user, on which channels, how often and when not. In-app notices follow it
 * right away; email, SMS and Zalo go to the outbox below until the backend sends them.
 */
export function NotificationSettings({ area, contact }: { area: NotifyArea; contact: { email: string; phone: string } }) {
  const saved = usePrefs(area);
  const [draft, setDraft] = useState<NotifyPrefs>(saved);
  const [justSaved, setJustSaved] = useState(false);
  const outbox = useOutbox().filter((entry) => entry.area === area);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const events = AREA_EVENTS[area];

  const toggle = (event: (typeof events)[number], channel: NotifyChannel) => {
    setJustSaved(false);
    setDraft((current) => {
      const list = current.channels[event] ?? [];
      return { ...current, channels: { ...current.channels, [event]: list.includes(channel) ? list.filter((item) => item !== channel) : [...list, channel] } };
    });
  };

  return (
    <section className="ph-card pf-section" aria-labelledby="ns-title">
      <h2 id="ns-title">
        <BellRing size={18} /> Notifications
      </h2>
      <p className="ph-muted pf-hint">Choose how you hear about each kind of event. Turning off “In the app” also hides it from the bell.</p>

      <div className="ph-table-scroll">
        <table className="ns-table">
          <thead>
            <tr>
              <th scope="col">Event</th>
              {CHANNELS.map((channel) => (
                <th key={channel} scope="col">
                  {CHANNEL_LABEL[channel]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event}>
                <td>
                  {EVENT_LABEL[event].label}
                  <small>{EVENT_LABEL[event].hint}</small>
                </td>
                {CHANNELS.map((channel) => (
                  <td key={channel}>
                    <input
                      type="checkbox"
                      checked={draft.channels[event]?.includes(channel) ?? false}
                      onChange={() => toggle(event, channel)}
                      aria-label={`${EVENT_LABEL[event].label} by ${CHANNEL_LABEL[channel]}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ns-options">
        <label className="ph-field">
          <span>Email and SMS</span>
          <select
            value={draft.frequency}
            onChange={(event) => {
              setJustSaved(false);
              setDraft({ ...draft, frequency: event.target.value as NotifyPrefs["frequency"] });
            }}
          >
            <option value="instant">Send each one right away</option>
            <option value="digest">One daily summary at 18:00</option>
          </select>
        </label>
        <div className="ph-field">
          <label className="ns-inline">
            <input
              type="checkbox"
              checked={draft.quietHours.enabled}
              onChange={(event) => {
                setJustSaved(false);
                setDraft({ ...draft, quietHours: { ...draft.quietHours, enabled: event.target.checked } });
              }}
            />
            Quiet hours (no SMS, Zalo or email)
          </label>
          <span className="ns-inline">
            <input
              type="time"
              value={draft.quietHours.from}
              disabled={!draft.quietHours.enabled}
              onChange={(event) => setDraft({ ...draft, quietHours: { ...draft.quietHours, from: event.target.value } })}
              aria-label="Quiet from"
            />
            to
            <input
              type="time"
              value={draft.quietHours.to}
              disabled={!draft.quietHours.enabled}
              onChange={(event) => setDraft({ ...draft, quietHours: { ...draft.quietHours, to: event.target.value } })}
              aria-label="Quiet until"
            />
          </span>
        </div>
        <label className="ph-field">
          <span>Send email to</span>
          <input type="email" value={draft.email} placeholder={contact.email || "your@email"} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
        </label>
        <label className="ph-field">
          <span>Send SMS / Zalo to</span>
          <input type="tel" value={draft.phone} placeholder={contact.phone || "0912 345 678"} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
        </label>
      </div>

      <div className="pf-actions">
        {justSaved && !dirty && (
          <span className="pf-saved" role="status">
            <Check size={15} /> Saved
          </span>
        )}
        <button type="button" className="ph-btn" disabled={!dirty} onClick={() => setDraft(saved)}>
          Cancel
        </button>
        <button
          type="button"
          className="ph-btn ph-btn--primary"
          disabled={!dirty}
          onClick={() => {
            savePrefs(area, draft);
            setJustSaved(true);
          }}
        >
          Save notification settings
        </button>
      </div>

      <details>
        <summary className="ph-link-btn">Sent outside the app ({outbox.length})</summary>
        <p className="ph-muted pf-hint">Demo: Farmora does not send email, SMS or Zalo yet. This list shows what would have gone out with your settings.</p>
        {outbox.length === 0 ? (
          <p className="ph-muted">Nothing yet.</p>
        ) : (
          <>
            <ul className="ns-outbox">
              {outbox.map((entry) => (
                <li key={entry.id}>
                  <span>
                    <strong>{CHANNEL_LABEL[entry.channel]}</strong> to {entry.to}: {entry.title}
                  </span>
                  <span className="ph-muted">
                    {time.format(entry.at)}
                    {entry.queued === "quiet_hours" && " · held for quiet hours"}
                    {entry.queued === "digest" && " · in today’s summary"}
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" className="ph-link-btn" onClick={clearOutbox}>
              Clear the list
            </button>
          </>
        )}
      </details>
    </section>
  );
}
