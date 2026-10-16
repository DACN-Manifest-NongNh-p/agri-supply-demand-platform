import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./sections/TopBar";
import type { TaskOutcome } from "./sections/AttentionList";
import { batches as initialBatches, demands, tasks, type BatchStatus, type Task } from "./data/mockProducer";
import type { ProducerState } from "./data/producerContext";
import type { DeliveryIssue } from "./data/deliveries";
import { orderStage, orders as placedOrders, type ProducerOrder } from "./data/orders";
import "./styles/ProducerHome.css";
import { AnnouncementBanner } from "@/components/notifications/AnnouncementBanner";

/** Shell for all producer pages: top bar plus the demo state shared between them. */
export default function ProducerLayout() {
  const [batches, setBatches] = useState(initialBatches);
  const [outcomes, setOutcomes] = useState<Record<string, TaskOutcome>>({});
  const [offers, setOffers] = useState<Record<string, string>>({});
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [deliveryIssues, setDeliveryIssues] = useState<Record<string, DeliveryIssue>>({});
  const location = useLocation();

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

  const offer = (demandId: string, batchCode: string) =>
    setOffers((current) => ({ ...current, [demandId]: batchCode }));

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
              stage: "offered" as const,
            },
          ]
        : [];
    }),
  ];

  const state: ProducerState = {
    batches,
    setStatus,
    addBatch,
    addBatches,
    outcomes,
    resolveTask,
    offers,
    offer,
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
    </div>
  );
}
