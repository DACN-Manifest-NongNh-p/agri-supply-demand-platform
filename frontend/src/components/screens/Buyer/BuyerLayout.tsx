import { useEffect, useRef, useState } from "react";
import { RULES } from "@/lib/site";
import { Outlet, useLocation } from "react-router-dom";
import { BuyerTopBar } from "./sections/BuyerTopBar";
import { ProfileNudge } from "@/components/profile/ProfileNudge";
import {
  depositFor,
  addresses as initialAddresses,
  allocations as initialAllocations,
  deliveries,
  demands as initialDemands,
  supply as initialSupply,
} from "./data/mockBuyer";
import { buildAlerts, type BuyerAlert } from "./data/alerts";
import type { BuyerState } from "./data/buyerContext";
import type { DeliveryIssue } from "../Producer/data/deliveries";
import { formatKg } from "../Producer/data/format";
import { useAuctionSimulation } from "@/components/auction/useAuctionSimulation";
import { accept, acceptedKg, awaiting, decline, hoursLeft, useOfferSimulation, useOffers, type Offer } from "@/lib/offerStore";
import { useMessageSimulation } from "@/lib/messageStore";
import { partyId, SELF_BUYER_ID } from "@/lib/parties";
import { PartyDrawer } from "@/components/parties/PartyDrawer";
import { useMessageNotices, useRoutedNotices, type EventNotice } from "@/components/notifications/useRoutedNotices";
import { useProfile } from "@/components/profile/profileStore";
import type { NotifyEvent } from "@/lib/notificationPrefs";
import type { Allocation } from "./data/mockBuyer";
import { buyer } from "./data/mockBuyer";
// The buyer area reuses the producer styles (same layout, cards and moss palette) and adds its own.
import "../Producer/styles/ProducerHome.css";
import "./styles/Buyer.css";


/**
 * Demo only: reservations made here are not in the producer area yet, so the producer "confirms" a few
 * seconds after the deposit instead, and the bell says so. Offers are shared (lib/offerStore): the
 * producer area answers those for real. The checkout lock is a timer in this browser; a real one would
 * be a lock with a TTL on the server.
 */
const PRODUCER_REPLY_MS = 6000;

/** The current time, for ids and timers (called from event handlers only). */
const stamp = () => Date.now();

/** Shell for all buyer pages: top bar plus the demo state shared between them. */
export default function BuyerLayout() {
  const [demands, setDemands] = useState(initialDemands);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [baseSupply, setSupply] = useState(initialSupply);
  // Offers from producers live in the shared store; the rest are this buyer's own reservations.
  const [ownAllocations, setAllocations] = useState(() => initialAllocations.filter((item) => item.origin !== "offered"));
  const offers = useOffers();
  const offerAllocations = offers.filter((offer) => partyId(offer.buyer) === SELF_BUYER_ID).map(allocationFromOffer);
  const allocations = [...ownAllocations, ...offerAllocations];
  // Kilograms accepted from offers are taken off the batch on the market.
  const supply = baseSupply.map((batch) => {
    const taken = acceptedKg(batch.code);
    return taken ? { ...batch, allocatedKg: Math.min(batch.quantityKg, batch.allocatedKg + taken) } : batch;
  });
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [deliveryIssues, setDeliveryIssues] = useState<Record<string, DeliveryIssue>>({});
  /** News that is not derived from the data (a producer just confirmed), newest first. */
  const [updates, setUpdates] = useState<BuyerAlert[]>([]);
  const timers = useRef<number[]>([]);
  /** Locks confirmed in time: their expiry is skipped. */
  const confirmedLocks = useRef(new Set<string>());
  /** Holds given back before the producer answered: their reply is skipped. */
  const releasedIds = useRef(new Set<string>());
  const location = useLocation();
  // Demo: other buyers bid on the open pre-harvest auctions, and auctions close on time.
  useAuctionSimulation();
  // Demo: producers other than Hoa Phat answer proposals and messages after a few seconds.
  useOfferSimulation();
  useMessageSimulation();

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  // Router navigation does not scroll on its own: jump to #section links, otherwise to the top.
  useEffect(() => {
    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  const changeBatchAllocated = (code: string, deltaKg: number) =>
    setSupply((current) =>
      current.map((batch) => (batch.code === code ? { ...batch, allocatedKg: Math.max(0, batch.allocatedKg + deltaKg) } : batch)),
    );

  // Ids continue from the highest existing number (D-572 → D-573).
  const addDemands: BuyerState["addDemands"] = (drafts) => {
    const first = Math.max(...demands.map((demand) => Number(demand.id.replace(/\D/g, "")) || 0)) + 1;
    const posted = drafts.map((draft, index) => ({ ...draft, id: `D-${first + index}`, createdDay: 0 }));
    setDemands((current) => [...current, ...posted]);
    return posted.map((demand) => demand.id);
  };

  const addDemand: BuyerState["addDemand"] = (draft) => addDemands([draft])[0];

  const addAddress: BuyerState["addAddress"] = (address) => {
    const id = `ADR-${addresses.length + 1}-${stamp()}`;
    setAddresses((current) => [...current, { ...address, id }]);
    return id;
  };

  const makeDefaultAddress: BuyerState["makeDefaultAddress"] = (id) =>
    setAddresses((current) => [...current.filter((address) => address.id === id), ...current.filter((address) => address.id !== id)]);

  // Picking a batch locks it for RULES.lockMinutes: nobody else can take the kilograms meanwhile.
  // Without a confirmation in time the lock lapses and they go straight back on the market.
  const reserve: BuyerState["reserve"] = (demandId, batchCode, kg) => {
    const batch = supply.find((item) => item.code === batchCode);
    if (!batch || kg <= 0) return undefined;
    const id = `A-${stamp()}`;
    const ttlMs = RULES.lockMinutes * 60_000;
    setAllocations((current) => [
      ...current,
      { id, demandId, batchCode, producer: batch.producer, kg, stage: "locked", origin: "reserved", lockExpiresAt: stamp() + ttlMs },
    ]);
    changeBatchAllocated(batchCode, kg);

    timers.current.push(
      window.setTimeout(() => {
        if (confirmedLocks.current.has(id) || releasedIds.current.has(id)) return;
        releasedIds.current.add(id);
        setAllocations((current) => current.filter((item) => !(item.id === id && item.stage === "locked")));
        changeBatchAllocated(batchCode, -kg);
        setUpdates((current) => [
          {
            id: `expired-${id}`,
            kind: "lock_expired",
            tone: "warning",
            title: `Your lock on ${batchCode} ran out`,
            detail: `${formatKg(kg)} went back on the market because the deposit for ${demandId} was not paid in time.`,
            link: { label: "Find supply", to: `/buyer/demands/${demandId}` },
          },
          ...current,
        ]);
      }, ttlMs),
    );
    return id;
  };

  // Paying the deposit is what turns a lock into an order (and an offer into a confirmed order).
  const payDeposit: BuyerState["payDeposit"] = (allocationId, method) => {
    const order = allocations.find((item) => item.id === allocationId);
    if (!order || releasedIds.current.has(allocationId)) return;
    const pricePerKg = order.pricePerKg ?? supply.find((item) => item.code === order.batchCode)?.pricePerKg ?? 0;
    const percent = RULES.depositPercent;
    const deposit = { amount: depositFor(order.kg, pricePerKg, percent).deposit, percent, method, ref: `FM-${String(stamp()).slice(-5)}` };

    if (order.offerId) {
      // The offer's terms are what was agreed; the store refuses it if another buyer took the kilograms first.
      // The buyer pays for the terms on screen; if they changed meanwhile, nothing is charged.
      const result = accept(order.offerId, deposit, { kg: order.kg, pricePerKg: order.pricePerKg ?? pricePerKg });
      if (!result.ok) {
        setUpdates((current) => [
          {
            id: `offer-failed-${allocationId}-${stamp()}`,
            kind: "lock_expired",
            tone: "warning",
            title:
              result.reason === "sold_out"
                ? `${order.batchCode} was taken by another buyer`
                : result.reason === "changed"
                  ? `The offer on ${order.batchCode} changed before you paid`
                  : `The offer on ${order.batchCode} is no longer open`,
            detail:
              result.reason === "sold_out"
                ? `Only ${formatKg(result.remainingKg)} left. No deposit was taken. Ask ${order.producer} for the rest in Messages.`
                : result.reason === "changed"
                  ? "Another buyer took part of the batch or the terms were updated. No deposit was taken: check the new terms and accept again."
                  : "No deposit was taken. The producer may send a new offer.",
            link: { label: "View offers", to: "/buyer/orders?tab=offered" },
          },
          ...current,
        ]);
      }
      return;
    }
    if (order.stage !== "locked") return;

    confirmedLocks.current.add(allocationId);
    setAllocations((current) =>
      current.map((item) =>
        item.id === allocationId ? { ...item, stage: "held", lockExpiresAt: undefined, holdHoursLeft: RULES.holdHours, pricePerKg, deposit } : item,
      ),
    );

    timers.current.push(
      window.setTimeout(() => {
        if (releasedIds.current.has(allocationId)) return;
        setAllocations((current) =>
          current.map((item) =>
            item.id === allocationId && item.stage === "held" ? { ...item, stage: "confirmed", holdHoursLeft: undefined } : item,
          ),
        );
        setUpdates((current) => [
          {
            id: `confirmed-${allocationId}`,
            kind: "confirmed",
            tone: "info",
            title: `${order.producer} confirmed ${formatKg(order.kg)} of ${order.batchCode}`,
            detail: `Your order for ${order.demandId} is confirmed. A truck is being booked; it shows under Deliveries once picked up.`,
            link: { label: "View order", to: `/buyer/orders#order-${allocationId}` },
          },
          ...current,
        ]);
      }, PRODUCER_REPLY_MS),
    );
  };

  const declineOffer: BuyerState["declineOffer"] = (allocationId) => {
    const order = allocations.find((item) => item.id === allocationId);
    if (order?.offerId) decline(order.offerId, "buyer");
  };

  const release: BuyerState["release"] = (allocationId) => {
    const allocation = allocations.find((item) => item.id === allocationId);
    if (!allocation || (allocation.stage !== "held" && allocation.stage !== "locked")) return;
    releasedIds.current.add(allocationId);
    setAllocations((current) => current.filter((item) => item.id !== allocationId));
    changeBatchAllocated(allocation.batchCode, -allocation.kg);
  };

  const profile = useProfile("buyer");
  const messageNotices = useMessageNotices("buyer", buyer.name);
  const routed = useRoutedNotices(
    "buyer",
    [
      ...[...updates, ...buildAlerts({ demands, allocations, supply, deliveries, deliveryIssues })].map((alert) => ({ ...alert, event: ALERT_EVENT[alert.kind] })),
      ...messageNotices.map((notice) => ({ ...notice, link: notice.link!, kind: "message" as const })),
    ] satisfies (EventNotice & BuyerAlert)[],
    { email: profile.email, phone: profile.phone },
  ) as BuyerAlert[];
  const alerts = routed.filter((alert) => !dismissed[alert.id]);

  const state: BuyerState = {
    demands,
    addDemand,
    addDemands,
    addresses,
    addAddress,
    updateAddress: (address) => setAddresses((current) => current.map((item) => (item.id === address.id ? address : item))),
    removeAddress: (id) => setAddresses((current) => (current.length > 1 ? current.filter((address) => address.id !== id) : current)),
    makeDefaultAddress,
    supply,
    allocations,
    reserve,
    payDeposit,
    release,
    declineOffer,
    alerts,
    dismissAlert: (id) => setDismissed((current) => ({ ...current, [id]: true })),
    deliveryIssues,
    reportDeliveryIssue: (deliveryId, issue) => setDeliveryIssues((current) => ({ ...current, [deliveryId]: issue })),
  };

  return (
    <div className="producer-home buyer-area" id="top">
      <BuyerTopBar
        alerts={alerts}
        onDismiss={(id) => setDismissed((current) => ({ ...current, [id]: true }))}
        cartCount={allocations.filter((item) => item.stage === "locked" || item.stage === "held" || item.stage === "offered").length}
        cartNeedsYou={allocations.some((item) => item.stage === "offered" || item.stage === "locked")}
      />
      <ProfileNudge area="buyer" />
      <Outlet context={state} />
      <PartyDrawer viewer={{ area: "buyer", self: buyer.name }} />
    </div>
  );
}

/** A producer's offer from the shared store, as an order in this buyer's cart. */
function allocationFromOffer(offer: Offer): Allocation {
  const stage: Allocation["stage"] = offer.status === "accepted" ? "confirmed" : offer.status === "sent" || offer.status === "countered" ? "offered" : "declined";
  const last = [...offer.events].reverse().find((item) => item.kind === "decline" || item.kind === "withdraw" || item.kind === "expire");
  const closedNote =
    offer.status === "declined"
      ? last?.by === "buyer"
        ? "You declined this offer"
        : `${offer.producer} declined your proposal`
      : offer.status === "withdrawn"
        ? last?.text ?? `${offer.producer} withdrew the offer`
        : offer.status === "expired"
          ? "The offer expired"
          : awaiting(offer) === "producer"
            ? `Waiting for ${offer.producer} to answer your proposal`
            : undefined;
  return {
    id: offer.id,
    offerId: offer.id,
    demandId: offer.demandId ?? "",
    batchCode: offer.batchCode,
    producer: offer.producer,
    kg: offer.kg,
    stage,
    origin: "offered",
    offerHoursLeft: hoursLeft(offer),
    note: offer.note,
    closedNote,
    pricePerKg: offer.pricePerKg,
    deposit: offer.deposit,
  };
}


/** Which notification setting each kind of buyer alert follows. */
const ALERT_EVENT: Record<BuyerAlert["kind"], NotifyEvent> = {
  short: "order",
  waiting: "order",
  supply_issue: "order",
  hold_expiring: "hold",
  freshness: "order",
  delivery_issue: "order",
  offer: "offer",
  confirmed: "offer_reply",
  lock_expired: "hold",
  message: "message",
};
