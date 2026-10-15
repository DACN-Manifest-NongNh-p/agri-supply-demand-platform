import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./sections/TopBar";
import type { TaskOutcome } from "./sections/AttentionList";
import { batches as initialBatches, demands, offerHistory, tasks, type BatchStatus, type Offer, type Task } from "./data/mockProducer";
import type { ProducerState } from "./data/producerContext";
import type { DeliveryIssue } from "./data/deliveries";
import "./styles/ProducerHome.css";

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
  const addBatch: ProducerState["addBatch"] = (draft) => {
    const next = Math.max(...batches.map((batch) => Number(batch.code.replace(/\D/g, "")) || 0)) + 1;
    const code = `B-${next}`;
    const status: BatchStatus = draft.readyDay <= 0 ? "ready" : "expected";
    setBatches((current) => [...current, { ...draft, code, allocatedKg: 0, status }]);
    return code;
  };

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

  const offerLog: Offer[] = [
    ...offerHistory.map((past) => {
      const outcome = past.taskId ? outcomes[past.taskId] : undefined;
      return outcome ? { ...past, status: outcome === "done" ? ("confirmed" as const) : ("declined" as const) } : past;
    }),
    ...Object.entries(offers).flatMap(([demandId, batch]) => {
      const demand = demands.find((item) => item.id === demandId);
      return demand
        ? [{ demandId, buyer: demand.buyer, product: demand.product, quantityKg: demand.quantityKg, batch, sentDay: 0, status: "sent" as const }]
        : [];
    }),
  ];

  const state: ProducerState = {
    batches,
    setStatus,
    addBatch,
    outcomes,
    resolveTask,
    offers,
    offer,
    offerLog,
    issues,
    reportIssue: (code, reason) => setIssues((current) => ({ ...current, [code]: reason })),
    deliveryIssues,
    reportDeliveryIssue: (deliveryId, issue) => setDeliveryIssues((current) => ({ ...current, [deliveryId]: issue })),
    openTasks,
  };

  return (
    <div className="producer-home" id="top">
      <TopBar openTasks={openTasks} />
      <Outlet context={state} />
    </div>
  );
}
