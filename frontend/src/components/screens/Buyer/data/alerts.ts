// Buyer alerts are derived from current data, not stored: they disappear once the cause is fixed.
import { formatDayInText, formatKg } from "../../Producer/data/format";
import type { DeliveryIssue } from "../../Producer/data/deliveries";
import { fulfilmentOf } from "./demands";
import type { Allocation, BuyerDelivery, BuyerDemand, SupplyBatch } from "./mockBuyer";

export type AlertTone = "urgent" | "warning" | "info";

export type BuyerAlert = {
  id: string;
  kind: "at_risk" | "supply_issue" | "hold_expiring" | "freshness" | "delivery_issue";
  tone: AlertTone;
  /** The big number or code the card is about. */
  figure: string;
  caption: string;
  link: { label: string; to: string };
};

/** A demand is at risk when its deadline is this close and it is not fully sourced. */
const AT_RISK_DAYS = 3;
const HOLD_WARNING_HOURS = 6;
/** Days of shelf life left on arrival below which an unshipped batch is flagged. */
const FRESHNESS_MARGIN = 1;

type Input = {
  demands: BuyerDemand[];
  allocations: Allocation[];
  supply: SupplyBatch[];
  deliveries: BuyerDelivery[];
  deliveryIssues: Record<string, DeliveryIssue>;
};

export function buildAlerts({ demands, allocations, supply, deliveries, deliveryIssues }: Input): BuyerAlert[] {
  const alerts: BuyerAlert[] = [];
  const demandOf = (id: string) => demands.find((demand) => demand.id === id);

  for (const demand of demands) {
    const { allocatedKg, heldKg, status } = fulfilmentOf(demand, allocations);
    if (status === "fulfilled" || status === "completed" || demand.neededByDay > AT_RISK_DAYS) continue;
    const coverage = Math.round(((allocatedKg + heldKg) / demand.quantityKg) * 100);
    alerts.push({
      id: `risk-${demand.id}`,
      kind: "at_risk",
      tone: "urgent",
      figure: `${Math.round((allocatedKg / demand.quantityKg) * 100)}% confirmed`,
      caption: `${demand.product} (${demand.id}) is needed by ${formatDayInText(demand.neededByDay)}; ${coverage}% sourced including holds.`,
      link: { label: "Find supply", to: `/buyer/demands/${demand.id}` },
    });
  }

  for (const allocation of allocations) {
    const batch = supply.find((item) => item.code === allocation.batchCode);
    const demand = demandOf(allocation.demandId);
    const open = allocation.stage === "held" || allocation.stage === "allocated";

    if (batch?.issue && open) {
      alerts.push({
        id: `issue-${allocation.id}`,
        kind: "supply_issue",
        tone: "urgent",
        figure: batch.code,
        caption: batch.issue,
        link: { label: "Review demand", to: `/buyer/demands/${allocation.demandId}` },
      });
    }

    if (allocation.stage === "held" && (allocation.holdHoursLeft ?? Infinity) <= HOLD_WARNING_HOURS) {
      alerts.push({
        id: `hold-${allocation.id}`,
        kind: "hold_expiring",
        tone: "warning",
        figure: `${allocation.holdHoursLeft}h left`,
        caption: `on your ${formatKg(allocation.kg)} hold of ${allocation.batchCode}. ${allocation.producer} has not confirmed yet.`,
        link: { label: "View hold", to: `/buyer/demands/${allocation.demandId}` },
      });
    }

    if (batch && demand && open && batch.sellByDay - demand.neededByDay <= FRESHNESS_MARGIN) {
      const margin = batch.sellByDay - demand.neededByDay;
      alerts.push({
        id: `fresh-${allocation.id}`,
        kind: "freshness",
        tone: "warning",
        figure: batch.code,
        caption: `Sells by ${formatDayInText(batch.sellByDay)}, only ${margin} ${margin === 1 ? "day" : "days"} after you need it. Plan to sell it quickly.`,
        link: { label: "View demand", to: `/buyer/demands/${allocation.demandId}` },
      });
    }
  }

  for (const delivery of deliveries) {
    const reported = deliveryIssues[delivery.id];
    if (delivery.step === 3 || (!delivery.issue && !reported)) continue;
    alerts.push({
      id: `delivery-${delivery.id}`,
      kind: "delivery_issue",
      tone: "warning",
      figure: delivery.id,
      caption: reported ? `You reported: ${reported.reason}.` : delivery.issue!,
      link: { label: "Track delivery", to: `/buyer/deliveries/${delivery.id}` },
    });
  }

  const order: Record<AlertTone, number> = { urgent: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.tone] - order[b.tone]);
}
