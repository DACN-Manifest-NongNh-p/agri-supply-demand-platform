import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./sections/TopBar";
import type { TaskOutcome } from "./sections/AttentionList";
import { batches as initialBatches, demands, tasks, type BatchStatus, type Task } from "./data/mockProducer";
import type { ProducerState } from "./data/producerContext";
import type { DeliveryIssue } from "./data/deliveries";
import { orderStage, orders as placedOrders, type ProducerOrder } from "./data/orders";
import { OfferSentNotice } from "./sections/OfferSentNotice";
import { useAuctionSimulation } from "@/components/auction/useAuctionSimulation";
import { getSite } from "@/lib/site";
import { RiskToasts } from "@/components/freshness/RiskToasts";
import { useSpoilageAlerts, type SpoilageItem } from "@/components/freshness/useSpoilageAlerts";
import "./styles/ProducerHome.css";
import { AnnouncementBanner } from "@/components/notifications/AnnouncementBanner";

/**
 * Demo only: the areas do not share state, so a buyer cannot really answer an offer sent from here.
 * The buyer "accepts" a few seconds later instead, so the order moves on and the popup shows it.
 */
const BUYER_REPLY_MS = 6000;

/** Shell for all producer pages: top bar plus the demo state shared between them. */
export default function ProducerLayout() {
  const [batches, setBatches] = useState(initialBatches);
  const [outcomes, setOutcomes] = useState<Record<string, TaskOutcome>>({});
  const [offers, setOffers] = useState<Record<string, string>>({});
  const [offerAnswers, setOfferAnswers] = useState<Record<string, "confirmed" | "declined">>({});
  /** The offer just sent, shown in a popup until closed. */
  const [sentOffer, setSentOffer] = useState<string | null>(null);
  const replyTimers = useRef<number[]>([]);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [deliveryIssues, setDeliveryIssues] = useState<Record<string, DeliveryIssue>>({});
  const location = useLocation();
  // Demo: other buyers bid on the open pre-harvest auctions, and auctions close on time.
  useAuctionSimulation();
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

  useEffect(() => {
    const timers = replyTimers.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

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

  const offer = (demandId: string, batchCode: string) => {
    setOffers((current) => ({ ...current, [demandId]: batchCode }));
    setSentOffer(demandId);
    replyTimers.current.push(
      window.setTimeout(() => {
        setOfferAnswers((current) => ({ ...current, [demandId]: "confirmed" }));
        setStatus(batchCode, "allocated");
      }, BUYER_REPLY_MS),
    );
  };

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

  // One list for the whole life of a sale: placed orders with their current stage, then this
  // session's offers, which wait for the buyer.
  const orders: ProducerOrder[] = [
    ...placedOrders.map((order) => ({ ...order, stage: orderStage(order, outcomes) })),
    ...Object.entries(offers).flatMap(([demandId, batch]) => {
      const demand = demands.find((item) => item.id === demandId);
      return demand
        ? [
            {
              id: `OF-${demandId}`,
              demandId,
              buyer: demand.buyer,
              buyerType: demand.buyerType,
              product: demand.product,
              batch,
              quantityKg: demand.quantityKg,
              neededByDay: demand.neededByDay,
              destination: demand.destination,
              placedDay: 0,
              stage: offerAnswers[demandId] ?? ("offered" as const),
              origin: "producer" as const,
            },
          ]
        : [];
    }),
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
      <TopBar openTasks={openTasks} ordersToConfirm={orders.filter((order) => order.stage === "to_confirm").length} />
      <AnnouncementBanner audience="PRODUCER" />
      <Outlet context={state} />
      <RiskToasts
        alerts={spoilage.alerts.filter((alert) => !hiddenToasts[alert.id])}
        onDismiss={(id) => setHiddenToasts((current) => ({ ...current, [id]: true }))}
        actionLabel="Find buyers"
      />
      {sentOffer && orders.some((order) => order.id === `OF-${sentOffer}`) && (
        <OfferSentNotice order={orders.find((order) => order.id === `OF-${sentOffer}`)!} onClose={() => setSentOffer(null)} />
      )}
    </div>
  );
}
