import { useState } from "react";
import { Check, Handshake, MessageSquareText, Send, Star, Undo2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDay, formatKg, formatVnd } from "../../Producer/data/format";
import { openOf } from "../../Buyer/data/demands";
import type { SupplyBatch } from "../../Buyer/data/mockBuyer";
import { suggestedPrice } from "../../Producer/data/pricing";
import { scoreFor, type BoardRow } from "../data/market";
import { useCoordinator } from "../data/coordinatorContext";
import { ACTION_LABEL, type GapAction } from "../data/coordinatorContext";
import type { MarketDemand } from "../data/mockCoordinator";
import { buyersFor, RELATION_LABEL, suppliersFor, type Counterpart } from "@/lib/tradeHistory";
import { OFFER_STATUS_LABEL, sendOffers, useOffers } from "@/lib/offerStore";
import { partyId } from "@/lib/parties";
import { PartyLink } from "@/components/parties/PartyLink";
import "@/components/offers/offers.css";


const time = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

type Tab = "past" | "new";

/** "Sold here before · last 12/10 · 4,000 kg · ★ 4.5" */
function track(item: Counterpart) {
  if (item.trades.length === 0) return "Never traded this product on Farmora";
  const parts = [`${item.trades.length} ${item.trades.length === 1 ? "order" : "orders"}`, formatKg(item.totalKg)];
  if (item.lastDay !== undefined) parts.push(`last ${formatDay(item.lastDay)}`);
  return parts.join(" · ");
}

function Log({ entries }: { entries: { action: GapAction; text: string; at: number }[] }) {
  if (entries.length === 0) return null;
  return (
    <ol className="co-gap-log">
      {entries.map((entry, index) => (
        <li key={index}>
          <strong>{ACTION_LABEL[entry.action]}</strong> · {entry.text} <span className="ph-muted">{time.format(entry.at)}</span>
        </li>
      ))}
    </ol>
  );
}

function NoteForm({ onSave }: { onSave: (text: string, resolved: boolean) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      className="co-gap-note"
      onSubmit={(event) => {
        event.preventDefault();
        if (!text.trim()) return;
        onSave(text.trim(), false);
        setText("");
      }}
    >
      <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Note what you agreed or learned…" aria-label="Note" />
      <button type="submit" className="ph-btn" disabled={!text.trim()}>
        Add note
      </button>
      <button type="button" className="ph-btn ph-btn--primary" onClick={() => onSave(text.trim() || "Closed by the coordinator", true)}>
        <Check size={15} /> Mark resolved
      </button>
    </form>
  );
}

function Tabs({ tab, onTab, past, fresh, pastLabel, newLabel }: { tab: Tab; onTab: (tab: Tab) => void; past: number; fresh: number; pastLabel: string; newLabel: string }) {
  return (
    <div className="ph-segmented" role="group" aria-label="Who to ask">
      <button type="button" aria-pressed={tab === "past"} onClick={() => onTab("past")}>
        {pastLabel} <span className="ph-count-badge">{past}</span>
      </button>
      <button type="button" aria-pressed={tab === "new"} onClick={() => onTab("new")}>
        {newLabel} <span className="ph-count-badge">{fresh}</span>
      </button>
    </div>
  );
}

/**
 * A demand no batch can fill: who could still supply it. Producers who supplied this buyer or this
 * product before come first; new producers of the product second. For each, their batches of the
 * product and why they miss, with a way to send an offer on their behalf or invite them to declare.
 */
export function DemandGapResolver({ row }: { row: BoardRow }) {
  const { market, gapLog, logGap } = useCoordinator();
  const offers = useOffers();
  const { demand, fulfilment } = row;
  const key = `demand:${demand.id}`;
  const everyone = suppliersFor(demand.product, demand.buyer);
  const past = everyone.filter((item) => item.relation !== "new");
  const fresh = everyone.filter((item) => item.relation === "new");
  const [tab, setTab] = useState<Tab>(past.length ? "past" : "new");
  const list = tab === "past" ? past : fresh;
  const related = offers.filter((offer) => offer.demandId === demand.id);

  return (
    <div className="co-resolver" aria-label={`Resolve ${demand.id}`}>
      <div className="co-resolver-head">
        <Tabs tab={tab} onTab={setTab} past={past.length} fresh={fresh.length} pastLabel="Past suppliers" newLabel="New suppliers" />
        <div className="co-resolver-actions">
          <button
            type="button"
            className="ph-btn"
            onClick={() => logGap(key, { action: "relax", text: `Asked ${demand.buyer} whether a wider grade or a later date would work` })}
          >
            <Undo2 size={15} /> Ask buyer to relax criteria
          </button>
          {fulfilment.openKg >= 1500 && (
            <Link to="/coordinator/rescue" className="ph-btn" onClick={() => logGap(key, { action: "rescue", text: "Looked for a combined delivery from several farms" })}>
              Combine farms
            </Link>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="ph-muted">{tab === "past" ? `No producer has sold ${demand.product.toLowerCase()} here yet.` : `No new producer lists ${demand.product.toLowerCase()}.`}</p>
      ) : (
        <ul className="co-resolver-list">
          {list.map((item) => (
            <SupplierRow key={item.party.id} item={item} demand={demand} openKg={fulfilment.openKg} batches={market.filter((batch) => partyId(batch.producer) === item.party.id && batch.product === demand.product)} />
          ))}
        </ul>
      )}

      {related.length > 0 && (
        <div className="co-resolver-offers">
          <p className="co-kicker">Offers on this demand</p>
          <ul className="pt-history">
            {related.map((offer) => (
              <li key={offer.id}>
                <span>
                  {offer.producer} · {offer.batchCode} · {formatKg(offer.kg)} at {formatVnd(offer.pricePerKg)}/kg
                </span>
                <span className={`of-status of-status--${offer.status}`}>{OFFER_STATUS_LABEL[offer.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Log entries={gapLog[key] ?? []} />
      <NoteForm onSave={(text, resolved) => logGap(key, { action: resolved ? "resolved" : "note", text })} />
    </div>
  );
}

function SupplierRow({ item, demand, openKg, batches }: { item: Counterpart; demand: MarketDemand; openKg: number; batches: SupplyBatch[] }) {
  const { gapLog, logGap } = useCoordinator();
  const key = `demand:${demand.id}`;
  const done = (gapLog[key] ?? []).filter((entry) => entry.party === item.party.name).map((entry) => entry.action);
  const sellable = batches.filter((batch) => openOf(batch) > 0 && batch.status !== "in_transit" && batch.status !== "delivered");

  const offerFor = (batch: SupplyBatch) => {
    const kg = Math.min(openOf(batch), openKg);
    sendOffers(
      { code: batch.code, product: batch.product, variety: batch.variety, grade: batch.grade, producer: batch.producer, openKg: openOf(batch) },
      [{ buyer: demand.buyer, demandId: demand.id, destination: demand.destination, neededByDay: demand.neededByDay, kg }],
      {
        pricePerKg: batch.pricePerKg ?? suggestedPrice(batch),
        validHours: 12,
        by: "coordinator",
        note: `Farmora coordinator: ${batch.code} does not meet every rule of ${demand.id}, but could cover ${formatKg(kg)}. Please check before accepting.`,
      },
    );
    logGap(key, { action: "offered", party: item.party.name, text: `${batch.code} offered to ${demand.buyer} for ${item.party.name} (${formatKg(kg)})` });
  };

  return (
    <li className="co-resolver-item">
      <div className="co-resolver-party">
        <span>
          <PartyLink name={item.party.name} role="producer" /> <span className={`co-relation co-relation--${item.relation}`}>{RELATION_LABEL[item.relation]}</span>
        </span>
        <small className="ph-muted">
          {item.party.region} · {track(item)}
          {item.averageRating && (
            <>
              {" "}
              · <Star size={11} /> {item.averageRating.toFixed(1)}
            </>
          )}
        </small>
      </div>

      {sellable.length > 0 ? (
        <ul className="co-resolver-batches">
          {sellable.map((batch) => {
            const fit = scoreFor(demand, batch, openKg);
            const miss = fit.criteria.find((criterion) => criterion.state === "fail");
            return (
              <li key={batch.code}>
                <span>
                  {batch.code} · {formatKg(openOf(batch))}, grade {batch.grade}, ready {formatDay(batch.readyDay)}
                  <small className={miss ? "co-low" : "ph-muted"}>{miss ? `Misses: ${miss.detail}` : "Fits every rule"}</small>
                </span>
                {done.includes("offered") ? (
                  <span className="co-done">
                    <Check size={14} /> Offer sent
                  </span>
                ) : (
                  <button type="button" className="ph-btn" onClick={() => offerFor(batch)}>
                    <Send size={14} /> Offer to {demand.buyer.split(" ")[0]}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="ph-muted co-resolver-none">No {demand.product.toLowerCase()} declared right now.</p>
      )}

      <div className="co-resolver-actions">
        {done.includes("invited") ? (
          <span className="co-done">
            <Check size={14} /> Invited
          </span>
        ) : (
          <button
            type="button"
            className="ph-link-btn"
            onClick={() => logGap(key, { action: "invited", party: item.party.name, text: `Asked ${item.party.name} to declare ${formatKg(openKg)} of ${demand.product.toLowerCase()}` })}
          >
            <MessageSquareText size={14} /> Ask to declare supply
          </button>
        )}
        {done.includes("contacted") ? (
          <span className="co-done">
            <Check size={14} /> Contacted
          </span>
        ) : (
          <button type="button" className="ph-link-btn" onClick={() => logGap(key, { action: "contacted", party: item.party.name, text: `Called ${item.party.name}` })}>
            <Handshake size={14} /> Mark contacted
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * Open kilograms nobody bought: who could take them. Buyers who bought this product (or from this
 * producer) before come first; buyers new to it second, with their open demand for the product.
 */
export function SupplyGapResolver({ batch, openKg, demands }: { batch: SupplyBatch; openKg: number; demands: MarketDemand[] }) {
  const { gapLog, logGap } = useCoordinator();
  const offers = useOffers();
  const key = `batch:${batch.code}`;
  const everyone = buyersFor(batch.product, batch.producer);
  const past = everyone.filter((item) => item.relation !== "new");
  const fresh = everyone.filter((item) => item.relation === "new");
  const [tab, setTab] = useState<Tab>(past.length ? "past" : "new");
  const list = tab === "past" ? past : fresh;
  const related = offers.filter((offer) => offer.batchCode === batch.code);
  const log = gapLog[key] ?? [];

  const offerTo = (buyer: string, demand?: MarketDemand) => {
    const kg = demand ? Math.min(openKg, demand.quantityKg) : openKg;
    sendOffers(
      { code: batch.code, product: batch.product, variety: batch.variety, grade: batch.grade, producer: batch.producer, openKg },
      [{ buyer, demandId: demand?.id, destination: demand?.destination, neededByDay: demand?.neededByDay, kg }],
      {
        pricePerKg: batch.pricePerKg ?? suggestedPrice(batch),
        validHours: 12,
        by: "coordinator",
        note: `Farmora coordinator, for ${batch.producer}: ${batch.variety}, grade ${batch.grade}, sells by ${formatDay(batch.sellByDay)}.`,
      },
    );
    logGap(key, { action: "offered", party: buyer, text: `Offered ${formatKg(kg)} to ${buyer}${demand ? ` for ${demand.id}` : ""}` });
  };

  return (
    <div className="co-resolver" aria-label={`Find a buyer for ${batch.code}`}>
      <div className="co-resolver-head">
        <Tabs tab={tab} onTab={setTab} past={past.length} fresh={fresh.length} pastLabel="Past buyers" newLabel="New buyers" />
        <div className="co-resolver-actions">
          <Link
            to={`/coordinator/rescue#proposal-rescue-${batch.code}`}
            className="ph-btn"
            onClick={() => logGap(key, { action: "rescue", text: "Looked at processors and the rescue market" })}
          >
            Rescue options
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="ph-muted">{tab === "past" ? `Nobody has bought ${batch.product.toLowerCase()} here yet.` : `No new buyer lists ${batch.product.toLowerCase()}.`}</p>
      ) : (
        <ul className="co-resolver-list">
          {list.map((item) => {
            const theirs = demands.filter((demand) => partyId(demand.buyer) === item.party.id && demand.product === batch.product && demand.neededByDay >= 0);
            const offered = log.some((entry) => entry.action === "offered" && entry.party === item.party.name);
            return (
              <li key={item.party.id} className="co-resolver-item">
                <div className="co-resolver-party">
                  <span>
                    <PartyLink name={item.party.name} role="buyer" /> <span className={`co-relation co-relation--${item.relation}`}>{RELATION_LABEL[item.relation]}</span>
                  </span>
                  <small className="ph-muted">
                    {item.party.type} · {track(item)}
                    {item.trades.some((trade) => trade.grade === batch.grade) && ` · has bought grade ${batch.grade}`}
                  </small>
                </div>
                {theirs.length > 0 ? (
                  <ul className="co-resolver-batches">
                    {theirs.map((demand) => {
                      const fit = scoreFor(demand, batch, demand.quantityKg);
                      const miss = fit.criteria.find((criterion) => criterion.state === "fail");
                      return (
                        <li key={demand.id}>
                          <span>
                            {demand.id} · wants {formatKg(demand.quantityKg)}, {demand.gradeWanted} by {formatDay(demand.neededByDay)}
                            <small className={miss ? "co-low" : "ph-muted"}>{miss ? `Misses: ${miss.detail}` : "Fits every rule"}</small>
                          </span>
                          {!offered && (
                            <button type="button" className="ph-btn" onClick={() => offerTo(item.party.name, demand)}>
                              <Send size={14} /> Offer for {demand.id}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="ph-muted co-resolver-none">No open demand for {batch.product.toLowerCase()}.</p>
                )}
                <div className="co-resolver-actions">
                  {offered ? (
                    <span className="co-done">
                      <Check size={14} /> Offer sent
                    </span>
                  ) : (
                    <button type="button" className="ph-link-btn" onClick={() => offerTo(item.party.name)}>
                      <Send size={14} /> Direct offer ({formatKg(openKg)})
                    </button>
                  )}
                  <button type="button" className="ph-link-btn" onClick={() => logGap(key, { action: "contacted", party: item.party.name, text: `Called ${item.party.name}` })}>
                    <Handshake size={14} /> Mark contacted
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {related.length > 0 && (
        <div className="co-resolver-offers">
          <p className="co-kicker">Offers on {batch.code}</p>
          <ul className="pt-history">
            {related.map((offer) => (
              <li key={offer.id}>
                <span>
                  {offer.buyer} · {formatKg(offer.kg)} at {formatVnd(offer.pricePerKg)}/kg{offer.origin === "coordinator" ? " · by Farmora" : ""}
                </span>
                <span className={`of-status of-status--${offer.status}`}>{OFFER_STATUS_LABEL[offer.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Log entries={log} />
      <NoteForm onSave={(text, resolved) => logGap(key, { action: resolved ? "resolved" : "note", text })} />
    </div>
  );
}
