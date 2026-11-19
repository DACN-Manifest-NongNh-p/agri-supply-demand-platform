import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./sections/TopBar";
import type { TaskOutcome } from "./sections/AttentionList";
import { batches as initialBatches, demands, producer, tasks, type BatchStatus, type Task } from "./data/mockProducer";
import { matchDemand } from "./data/matching";
import { formatDay, formatKg } from "./data/format";
import { MatchScore } from "./sections/MatchScore";
import { PartyDrawer } from "@/components/parties/PartyDrawer";
import { useAnnouncementNotices } from "@/components/notifications/announcements";
import { useMessageNotices, useRoutedNotices, type EventNotice } from "@/components/notifications/useRoutedNotices";
import { useProfile } from "@/components/profile/profileStore";
import { formatVnd } from "./data/format";
import type { ProducerState } from "./data/producerContext";
import type { DeliveryIssue } from "./data/deliveries";
import { orderFromOffer, orderStage, orders as placedOrders, type ProducerOrder } from "./data/orders";
import { OfferSentNotice } from "./sections/OfferSentNotice";
import { OfferComposer, type ComposerStart } from "./sections/OfferComposer";
import { acceptedKg, useOfferSimulation, useOffers } from "@/lib/offerStore";
import { useMessageSimulation } from "@/lib/messageStore";
import { partyId } from "@/lib/parties";
import { useAuctionSimulation } from "@/components/auction/useAuctionSimulation";
import { getSite } from "@/lib/site";
import { RiskToasts } from "@/components/freshness/RiskToasts";
import { useSpoilageAlerts, type SpoilageItem } from "@/components/freshness/useSpoilageAlerts";
import "./styles/ProducerHome.css";
import { AnnouncementBanner } from "@/components/notifications/AnnouncementBanner";
import { ProfileNudge } from "@/components/profile/ProfileNudge";

/** Shell for all producer pages: top bar plus the demo state shared between them. */
export default function ProducerLayout() {
  const [baseBatches, setBatches] = useState(initialBatches);
  const [outcomes, setOutcomes] = useState<Record<string, TaskOutcome>>({});
  /** The offer form, open with what it was started from. */
  const [composer, setComposer] = useState<ComposerStart | null>(null);
  /** The offers just sent, shown in a popup until closed. */
  const [sentOffers, setSentOffers] = useState<string[] | null>(null);
  // Offers live in the shared store, so the buyer area answers the same ones.
  const myOffers = useOffers().filter((item) => partyId(item.producer) === partyId(producer.name));
  // Kilograms buyers accepted from an offer are allocated on the batch.
  const batches = baseBatches.map((batch) => {
    const taken = acceptedKg(batch.code);
    if (!taken) return batch;
    const allocatedKg = Math.min(batch.quantityKg, batch.allocatedKg + taken);
    return { ...batch, allocatedKg, status: batch.status === "ready" || batch.status === "expected" ? ("allocated" as const) : batch.status };
  });
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [deliveryIssues, setDeliveryIssues] = useState<Record<string, DeliveryIssue>>({});
  const location = useLocation();
  // Demo: other buyers bid on the open pre-harvest auctions, and auctions close on time.
  useAuctionSimulation();
  // Demo: buyers other than GreenBasket answer offers and messages after a few seconds.
  useOfferSimulation();
  useMessageSimulation();
  const [hiddenToasts, setHiddenToasts] = useState<Record<string, boolean>>({});

  // The farm's unsold kilograms, watched for spoilage risk; alerts pop up without a reload.
  const watched: SpoilageItem[] = batches
    .filter((batch) => batch.status !== "in_transit" && batch.status !== "delivered" && batch.quantityKg - batch.allocatedKg > 0)
    .map((batch) => ({
      code: batch.code,
      product: batch.product,
      producer: "Your batch",
      harvestDay: batch.harvestDay,
      sellByDay: batch.sellByDay,
      quantityKg: batch.quantityKg,
      openKg: batch.quantityKg - batch.allocatedKg,
      to: `/producer/demand?view=unmatched`,
    }));
  const coldChain = new Set(getSite().products.filter((product) => product.coldChain).map((product) => product.name));
  // Demo sensor event target: the unsold, harvested cold-chain batch closest to its sell-by date.
  const excursionCode = watched
    .filter((item) => coldChain.has(item.product) && item.sellByDay >= 1 && item.harvestDay <= 0)
    .sort((a, b) => a.sellByDay - b.sellByDay)[0]?.code;
  const spoilage = useSpoilageAlerts(watched, excursionCode);

  // Router navigation does not scroll on its own: jump to #section links, otherwise to the top.
  useEffect(() => {
    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  const setStatus = (code: string, status: BatchStatus) =>
    setBatches((current) => current.map((batch) => (batch.code === code ? { ...batch, status } : batch)));

  // Codes continue from the highest existing number (B-110 → B-111).
  const addBatches: ProducerState["addBatches"] = (drafts) => {
    const first = Math.max(...batches.map((batch) => Number(batch.code.replace(/\D/g, "")) || 0)) + 1;
    const declared = drafts.map((draft, index) => ({
      ...draft,
      code: `B-${first + index}`,
      allocatedKg: 0,
      status: (draft.readyDay <= 0 ? "ready" : "expected") as BatchStatus,
    }));
    setBatches((current) => [...current, ...declared]);
    return declared.map((batch) => batch.code);
  };

  const addBatch: ProducerState["addBatch"] = (draft) => addBatches([draft])[0];

  const offer: ProducerState["offer"] = (demandId, batchCode, buyer) => setComposer({ demandId, batchCode, buyer });

  // The latest offer per demand (offers are newest last in the store), for the match cards.
  const offers: Record<string, string> = {};
  const offerIds: Record<string, string> = {};
  const offerAnswers: Record<string, "confirmed" | "declined"> = {};
  for (const item of myOffers) {
    if (!item.demandId || item.status === "withdrawn" || item.status === "expired") continue;
    offers[item.demandId] = item.batchCode;
    offerIds[item.demandId] = item.id;
    if (item.status === "accepted") offerAnswers[item.demandId] = "confirmed";
    else if (item.status === "declined") offerAnswers[item.demandId] = "declined";
    else delete offerAnswers[item.demandId];
  }

  const resolveTask = (task: Task, outcome: TaskOutcome) => {
    setOutcomes((current) => ({ ...current, [task.id]: outcome }));
    if (outcome !== "done") return;
    if (task.kind === "confirm_allocation") {
      setStatus(task.batch, "allocated");
      // Confirming the allocation settles the temporary hold on the same batch.
      const holds = tasks.filter((other) => other.kind === "hold_expiring" && other.batch === task.batch);
      setOutcomes((current) => ({ ...current, ...Object.fromEntries(holds.map((hold) => [hold.id, "done" as const])) }));
    }
    if (task.kind === "update_status") setStatus(task.batch, task.to);
  };

  const openTasks = tasks.filter((task) => !outcomes[task.id]).length;

  // The bell: home-page tasks, answers to offers, messages, freshness and Farmora announcements,
  // routed by the notification settings (some events may go by SMS or email instead).
  const [dismissedNotices, setDismissedNotices] = useState<Record<string, boolean>>({});
  const announcements = useAnnouncementNotices("PRODUCER");
  const messageNotices = useMessageNotices("producer", producer.name);
  const profile = useProfile("producer");
  const taskNotices: EventNotice[] = tasks
    .filter((task) => !outcomes[task.id])
    .map((task) =>
      task.kind === "confirm_allocation"
        ? { id: `task-${task.id}`, event: "order", tone: task.dueInHours <= 6 ? "urgent" : "warning", title: `Confirm ${formatKg(task.quantityKg)} of ${task.batch} for ${task.buyer}`, detail: `${task.dueInHours} h left to answer the reservation.`, link: { label: "Open orders", to: "/producer/orders?tab=to_confirm" } }
        : task.kind === "hold_expiring"
          ? { id: `task-${task.id}`, event: "hold", tone: "warning", title: `Hold on ${task.batch} for ${task.buyer} runs out`, detail: `${task.dueInHours} h left.`, link: { label: "See tasks", to: "/producer#attention" } }
          : { id: `task-${task.id}`, event: "order", tone: "info", title: `Update ${task.batch}`, detail: `Move it from ${task.from.replace("_", " ")} to ${task.to.replace("_", " ")}.`, link: { label: "See tasks", to: "/producer#attention" } },
    );
  const offerNotices: EventNotice[] = myOffers.flatMap((item): EventNotice[] => {
    const id = `offer-${item.id}-${item.status}-${item.events.length}`;
    const link = { label: "Open offer", to: `/producer/orders#order-${item.id}` };
    if (item.status === "countered" && item.proposal)
      return [{ id, event: "offer_reply", tone: "warning", title: `${item.buyer} proposed new terms for ${item.batchCode}`, detail: `${formatKg(item.proposal.kg)} at ${formatVnd(item.proposal.pricePerKg)}/kg instead of ${formatVnd(item.pricePerKg)}/kg.`, link }];
    if (item.status === "accepted") return [{ id, event: "offer_reply", tone: "info", title: `${item.buyer} accepted ${formatKg(item.kg)} of ${item.batchCode}`, detail: "The deposit is paid; a truck is being booked.", link }];
    if (item.status === "declined") return [{ id, event: "offer_reply", tone: "info", title: `${item.buyer} declined your offer on ${item.batchCode}`, detail: item.events.at(-1)?.text ?? "The kilograms are yours to offer again.", link }];
    return [];
  });
  const spoilageNotices: EventNotice[] = spoilage.alerts.map((alert) => ({ id: `risk-${alert.id}`, event: "spoilage", tone: alert.score >= 70 ? "urgent" : "warning", title: alert.title, detail: alert.detail, link: { label: "Find buyers", to: alert.to } }));
  const notices = useRoutedNotices(
    "producer",
    [...announcements.notices.map((notice) => ({ ...notice, event: "coordinator" as const })), ...taskNotices, ...offerNotices, ...messageNotices, ...spoilageNotices],
    { email: profile.email, phone: profile.phone },
  ).filter((notice) => !dismissedNotices[notice.id]);

  // One list for the whole life of a sale: placed orders with their current stage, then the offers
  // sent from here (or by a coordinator for this farm), newest first.
  const orders: ProducerOrder[] = [
    ...placedOrders.map((order) => ({ ...order, stage: orderStage(order, outcomes) })),
    ...[...myOffers].reverse().map(orderFromOffer),
  ];

  const state: ProducerState = {
    excursions: spoilage.excursions,
    spoilageItems: watched,
    batches,
    setStatus,
    addBatch,
    addBatches,
    outcomes,
    resolveTask,
    offers,
    offerIds,
    offer,
    offerAnswers,
    orders,
    issues,
    reportIssue: (code, reason) => setIssues((current) => ({ ...current, [code]: reason })),
    deliveryIssues,
    reportDeliveryIssue: (deliveryId, issue) => setDeliveryIssues((current) => ({ ...current, [deliveryId]: issue })),
    openTasks,
  };

  return (
    <div className="producer-home" id="top">
      <TopBar
        ordersToConfirm={orders.filter((order) => order.stage === "to_confirm").length}
        notices={notices}
        onDismiss={(id) => {
          if (!announcements.dismiss(id)) setDismissedNotices((current) => ({ ...current, [id]: true }));
        }}
      />
      <AnnouncementBanner audience="PRODUCER" />
      <ProfileNudge area="producer" />
      <Outlet context={state} />
      <RiskToasts
        alerts={spoilage.alerts.filter((alert) => !hiddenToasts[alert.id])}
        onDismiss={(id) => setHiddenToasts((current) => ({ ...current, [id]: true }))}
        actionLabel="Find buyers"
      />
      <PartyDrawer
        viewer={{ area: "producer", self: producer.name }}
        extra={(party) =>
          party.role === "buyer" ? (
            <>
              <button type="button" className="ph-btn" onClick={() => offer(undefined, undefined, party.name)}>
                Send an offer
              </button>
              <BuyerDemands buyer={party.name} batches={batches} onOffer={(demandId, code) => offer(demandId, code, party.name)} />
            </>
          ) : null
        }
      />
      {composer && (
        <OfferComposer
          batches={batches}
          start={composer}
          onClose={() => setComposer(null)}
          onSent={(ids) => {
            setComposer(null);
            setSentOffers(ids);
          }}
        />
      )}
      {sentOffers && <OfferSentNotice offerIds={sentOffers} onClose={() => setSentOffers(null)} />}
    </div>
  );
}

/** In the buyer card: what this buyer is asking for right now, and how well your batches fit. */
function BuyerDemands({ buyer, batches, onOffer }: { buyer: string; batches: ProducerState["batches"]; onOffer: (demandId: string, batchCode?: string) => void }) {
  const open = demands.filter((demand) => demand.buyer === buyer);
  return (
    <section className="pt-section" style={{ flexBasis: "100%" }} aria-label="Open demand">
      <h3>Open demand</h3>
      {open.length === 0 ? (
        <p className="ph-muted">No open demand from this buyer. You can still send a direct offer.</p>
      ) : (
        <ul className="pt-demands">
          {open.map((demand) => {
            const best = matchDemand(demand, batches).best;
            return (
              <li key={demand.id}>
                <span>
                  <strong>{demand.id}</strong> · {formatKg(demand.quantityKg)} {demand.product.toLowerCase()}, {demand.gradeWanted} · by {formatDay(demand.neededByDay)}
                </span>
                <span className="pt-actions">
                  {best && <MatchScore score={best.score} />}
                  <button type="button" className="ph-link-btn" onClick={() => onOffer(demand.id, best?.batch.code)}>
                    Offer {best ? best.batch.code : "a batch"}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
