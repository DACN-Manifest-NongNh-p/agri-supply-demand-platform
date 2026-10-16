import { useEffect, useState } from "react";
import { RULES } from "@/lib/site";
import { Outlet, useLocation } from "react-router-dom";
import { BuyerTopBar } from "./sections/BuyerTopBar";
import {
  addresses as initialAddresses,
  allocations as initialAllocations,
  deliveries,
  demands as initialDemands,
  supply as initialSupply,
} from "./data/mockBuyer";
import { buildAlerts } from "./data/alerts";
import type { BuyerState } from "./data/buyerContext";
import type { DeliveryIssue } from "../Producer/data/deliveries";
// The buyer area reuses the producer styles (same layout, cards and moss palette) and adds its own.
import "../Producer/styles/ProducerHome.css";
import "./styles/Buyer.css";
import { AnnouncementBanner } from "@/components/notifications/AnnouncementBanner";


/** Shell for all buyer pages: top bar plus the demo state shared between them. */
export default function BuyerLayout() {
  const [demands, setDemands] = useState(initialDemands);
  const [addresses, setAddresses] = useState(initialAddresses);
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

  const reserve: BuyerState["reserve"] = (demandId, batchCode, kg) => {
    const batch = supply.find((item) => item.code === batchCode);
    if (!batch || kg <= 0) return undefined;
    const id = `A-${Date.now()}`;
    setAllocations((current) => [...current, { id, demandId, batchCode, producer: batch.producer, kg, stage: "held", holdHoursLeft: RULES.holdHours }]);
    changeBatchAllocated(batchCode, kg);
    return id;
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
    addDemands,
    addresses,
    addAddress,
    updateAddress: (address) => setAddresses((current) => current.map((item) => (item.id === address.id ? address : item))),
    removeAddress: (id) => setAddresses((current) => (current.length > 1 ? current.filter((address) => address.id !== id) : current)),
    makeDefaultAddress,
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
      <BuyerTopBar alerts={alerts} onDismiss={(id) => setDismissed((current) => ({ ...current, [id]: true }))} />
      <AnnouncementBanner audience="BUYER" />
      <Outlet context={state} />
    </div>
  );
}
