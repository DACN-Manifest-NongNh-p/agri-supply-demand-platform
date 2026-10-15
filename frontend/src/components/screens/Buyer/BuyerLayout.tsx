import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BuyerTopBar } from "./sections/BuyerTopBar";
import { allocations as initialAllocations, buyer, deliveries, demands as initialDemands, supply as initialSupply } from "./data/mockBuyer";
import { buildAlerts } from "./data/alerts";
import type { BuyerState } from "./data/buyerContext";
import type { DeliveryIssue } from "../Producer/data/deliveries";
// The buyer area reuses the producer styles (same layout, cards and moss palette) and adds its own.
import "../Producer/styles/ProducerHome.css";
import "./styles/Buyer.css";

const HOLD_HOURS = 24;

/** Shell for all buyer pages: top bar plus the demo state shared between them. */
export default function BuyerLayout() {
  const [demands, setDemands] = useState(initialDemands);
  const [supply, setSupply] = useState(initialSupply);
  const [allocations, setAllocations] = useState(initialAllocations);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [deliveryIssues, setDeliveryIssues] = useState<Record<string, DeliveryIssue>>({});
  const location = useLocation();

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
  const addDemand: BuyerState["addDemand"] = (draft) => {
    const next = Math.max(...demands.map((demand) => Number(demand.id.replace(/\D/g, "")) || 0)) + 1;
    const id = `D-${next}`;
    setDemands((current) => [...current, { ...draft, id, createdDay: 0, destination: buyer.destination }]);
    return id;
  };

  const reserve: BuyerState["reserve"] = (demandId, batchCode, kg) => {
    const batch = supply.find((item) => item.code === batchCode);
    if (!batch || kg <= 0) return;
    setAllocations((current) => [
      ...current,
      { id: `A-${Date.now()}`, demandId, batchCode, producer: batch.producer, kg, stage: "held", holdHoursLeft: HOLD_HOURS },
    ]);
    changeBatchAllocated(batchCode, kg);
  };

  const release: BuyerState["release"] = (allocationId) => {
    const allocation = allocations.find((item) => item.id === allocationId);
    if (!allocation || allocation.stage !== "held") return;
    setAllocations((current) => current.filter((item) => item.id !== allocationId));
    changeBatchAllocated(allocation.batchCode, -allocation.kg);
  };

  const alerts = buildAlerts({ demands, allocations, supply, deliveries, deliveryIssues }).filter((alert) => !dismissed[alert.id]);

  const state: BuyerState = {
    demands,
    addDemand,
    supply,
    allocations,
    reserve,
    release,
    alerts,
    dismissAlert: (id) => setDismissed((current) => ({ ...current, [id]: true })),
    deliveryIssues,
    reportDeliveryIssue: (deliveryId, issue) => setDeliveryIssues((current) => ({ ...current, [deliveryId]: issue })),
  };

  return (
    <div className="producer-home buyer-area" id="top">
      <BuyerTopBar alertCount={alerts.length} />
      <Outlet context={state} />
    </div>
  );
}
