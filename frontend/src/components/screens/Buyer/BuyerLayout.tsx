import { useEffect, useRef, useState } from "react";
import { RULES } from "@/lib/site";
import { Outlet, useLocation } from "react-router-dom";
import { BuyerTopBar } from "./sections/BuyerTopBar";
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
// The buyer area reuses the producer styles (same layout, cards and moss palette) and adds its own.
import "../Producer/styles/ProducerHome.css";
import "./styles/Buyer.css";


/**
 * Demo only: the areas do not share state, so a producer cannot really answer an order confirmed here.
 * The producer "confirms" a few seconds later instead, so the order moves on and the bell says so.
 * The checkout lock is a timer in this browser; a real one would be a lock with a TTL on the server.
 */
const PRODUCER_REPLY_MS = 6000;

/** Shell for all buyer pages: top bar plus the demo state shared between them. */
export default function BuyerLayout() {
  const [demands, setDemands] = useState(initialDemands);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [supply, setSupply] = useState(initialSupply);
  const [allocations, setAllocations] = useState(initialAllocations);
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
    const id = `ADR-${addresses.length + 1}-${Date.now()}`;
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
    const id = `A-${Date.now()}`;
    const ttlMs = RULES.lockMinutes * 60_000;
    setAllocations((current) => [
      ...current,
      { id, demandId, batchCode, producer: batch.producer, kg, stage: "locked", origin: "reserved", lockExpiresAt: Date.now() + ttlMs },
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
    const deposit = { amount: depositFor(order.kg, pricePerKg, percent).deposit, percent, method, ref: `FM-${String(Date.now()).slice(-5)}` };

    if (order.stage === "offered") {
      setAllocations((current) =>
        current.map((item) => (item.id === allocationId ? { ...item, stage: "confirmed", offerHoursLeft: undefined, pricePerKg, deposit } : item)),
      );
      changeBatchAllocated(order.batchCode, order.kg);
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

  const declineOffer: BuyerState["declineOffer"] = (allocationId) =>
    setAllocations((current) =>
      current.map((item) =>
        item.id === allocationId && item.stage === "offered"
          ? { ...item, stage: "declined", offerHoursLeft: undefined, closedNote: "You declined this offer" }
          : item,
      ),
    );

  const release: BuyerState["release"] = (allocationId) => {
    const allocation = allocations.find((item) => item.id === allocationId);
    if (!allocation || (allocation.stage !== "held" && allocation.stage !== "locked")) return;
    releasedIds.current.add(allocationId);
    setAllocations((current) => current.filter((item) => item.id !== allocationId));
    changeBatchAllocated(allocation.batchCode, -allocation.kg);
  };

  const alerts = [...updates, ...buildAlerts({ demands, allocations, supply, deliveries, deliveryIssues })].filter((alert) => !dismissed[alert.id]);

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
      <Outlet context={state} />
    </div>
  );
}
