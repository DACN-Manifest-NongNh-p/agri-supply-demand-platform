import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { conversationsOf, markRead, openConversation, otherSide, sendMessage, unreadIn, useConversations } from "@/lib/messageStore";
import { partyId, useParties } from "@/lib/parties";
import { PartyLink } from "@/components/parties/PartyLink";
import "@/components/offers/offers.css";

const clock = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayAndTime = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const when = (at: number) => (new Date(at).toDateString() === new Date().toDateString() ? clock.format(at) : dayAndTime.format(at));

/**
 * Messages between producers and buyers: one conversation per pair (and per offer or demand when it
 * was started from one). Both sides see the same thread. Deliveries are not discussed with drivers
 * here: problems on the road go to the coordinator.
 */
export function MessagesPage({ area, self }: { area: "producer" | "buyer"; self: string }) {
  const all = useConversations();
  const parties = useParties();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [starting, setStarting] = useState("");
  const listEnd = useRef<HTMLLIElement>(null);

  const mine = conversationsOf(self, all);
  const shown = mine.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return otherSide(item, self).toLowerCase().includes(q) || item.context?.label.toLowerCase().includes(q) || item.messages.some((message) => message.text.toLowerCase().includes(q));
  });
  const selectedId = params.get("c");
  const selected = mine.find((item) => item.id === selectedId);
  const otherRole = area === "producer" ? "buyer" : "producer";
  const others = parties.filter((party) => party.role === otherRole);

  useEffect(() => {
    if (selected) markRead(selected.id, self);
    listEnd.current?.scrollIntoView({ block: "end" });
  }, [selected, self]);

  const select = (id: string | null) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (id) next.set("c", id);
      else next.delete("c");
      return next;
    });

  const start = (name: string) => {
    if (!name) return;
    const id = area === "producer" ? openConversation(self, name) : openConversation(name, self);
    setStarting("");
    select(id);
  };

  return (
    <main className="ph-main">
      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Messages</p>
          <h1>Talk to {area === "producer" ? "buyers" : "producers"}</h1>
          <p className="ph-hello-summary">
            Agree on packing, timing and quality before you confirm. Price and quantity changes belong in the offer itself, so both sides have a record.
          </p>
        </div>
        <label className="ph-field" style={{ minWidth: 240 }}>
          <span>New conversation</span>
          <select value={starting} onChange={(event) => start(event.target.value)}>
            <option value="">Choose a {otherRole}…</option>
            {others.map((party) => (
              <option key={party.id} value={party.name}>
                {party.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className={selected ? "ms-page has-open" : "ms-page"}>
        <div className="ms-list-wrap">
          <div className="ms-list-search">
            <input type="search" placeholder="Search messages" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search messages" />
          </div>
          <ul className="ms-list" aria-label="Conversations">
            {shown.length === 0 && <li className="ms-empty">No conversations yet.</li>}
            {shown.map((item) => {
              const unread = unreadIn(item, self);
              const last = item.messages.at(-1);
              return (
                <li key={item.id}>
                  <button type="button" className="ms-item" aria-current={item.id === selected?.id} onClick={() => select(item.id)}>
                    <span className="ms-item-top">
                      <strong>{otherSide(item, self)}</strong>
                      {unread > 0 ? <span className="ms-unread">{unread}</span> : last && <small>{when(last.at)}</small>}
                    </span>
                    {item.context && <small>{item.context.label}</small>}
                    <small>{last ? last.text : "No messages yet"}</small>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <section className="ms-view" aria-label="Conversation">
          {selected ? (
            <>
              <header className="ms-view-head">
                <div>
                  <button type="button" className="ph-link-btn" onClick={() => select(null)}>
                    <ArrowLeft size={14} /> All
                  </button>
                  <h2>
                    <PartyLink name={otherSide(selected, self)} role={otherRole} />
                  </h2>
                </div>
                {selected.context && <span className="ms-context">{selected.context.label}</span>}
              </header>
              <ol className="ms-messages">
                {selected.messages.length === 0 && <li className="ms-empty">Say hello. They get a notice in the app (and by email or SMS if they chose to).</li>}
                {selected.messages.map((message) => (
                  <li key={message.id} className={message.from === partyId(self) ? "ms-bubble ms-bubble--mine" : "ms-bubble"}>
                    {message.text}
                    <time dateTime={new Date(message.at).toISOString()}>{when(message.at)}</time>
                  </li>
                ))}
                <li ref={listEnd} aria-hidden="true" />
              </ol>
              <form
                className="ms-compose"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage(selected.id, self, draft);
                  setDraft("");
                }}
              >
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={draft}
                  placeholder="Write a message…"
                  aria-label="Message"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage(selected.id, self, draft);
                      setDraft("");
                    }
                  }}
                />
                <button type="submit" className="ph-btn ph-btn--primary" disabled={!draft.trim()} aria-label="Send">
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="ms-empty">
              <p>
                <MessageCircle size={28} />
                <br />
                Pick a conversation, or start one from a {otherRole}’s card.
              </p>
            </div>
          )}
        </section>
      </div>
      <p className="ms-policy">Farmora keeps these messages so a coordinator can help if a deal goes wrong. Drivers are reached through the coordinator, not here.</p>
    </main>
  );
}
