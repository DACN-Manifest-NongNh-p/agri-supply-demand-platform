// Buyer alerts are derived from current data, not stored: they disappear once the cause is fixed.
import { RULES } from "@/lib/site";
import { formatDayInText, formatKg } from "../../Producer/data/format";
import type { DeliveryIssue } from "../../Producer/data/deliveries";
import { fulfilmentOf } from "./demands";
import type { Allocation, BuyerDelivery, BuyerDemand, SupplyBatch } from "./mockBuyer";

export type AlertTone = "urgent" | "warning" | "info";

export type BuyerAlert = {
  id: string;
  kind: "short" | "waiting" | "supply_issue" | "hold_expiring" | "freshness" | "delivery_issue" | "offer" | "confirmed" | "lock_expired";
  tone: AlertTone;
  /** One plain sentence: what is wrong. */
  title: string;
  /** One short line of facts behind it. */
  detail: string;
  link: { label: string; to: string };
};

/** A demand is at risk when its deadline is this close and it is not fully sourced. */
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

  // Holds about to lapse get their own alert; a demand only waiting on those is not repeated.
  const expiringFor = new Set(
    allocations.filter((item) => item.stage === "held" && (item.holdHoursLeft ?? Infinity) <= RULES.holdWarningHours).map((item) => item.demandId),
  );

  for (const demand of demands) {
    const { allocatedKg, heldKg, openKg, status } = fulfilmentOf(demand, allocations);
    if (status === "fulfilled" || status === "completed" || demand.neededByDay > RULES.dueSoonDays) continue;
    const due = `Needed by ${formatDayInText(demand.neededByDay)}`;
    const product = demand.product.toLowerCase();

    if (openKg > 0) {
      // Still short: nothing covers part of it yet.
      const covered = [allocatedKg > 0 && `${formatKg(allocatedKg)} confirmed`, heldKg > 0 && `${formatKg(heldKg)} waiting for the producer`].filter(Boolean);
      alerts.push({
        id: `short-${demand.id}`,
        kind: "short",
        tone: "urgent",
        title: `${demand.id} still needs ${formatKg(openKg)} ${product}`,
        detail: [due, ...covered].join(" · "),
        link: { label: "Find supply", to: `/buyer/demands/${demand.id}` },
      });
    } else if (heldKg > 0 && !expiringFor.has(demand.id)) {
      // Fully sourced, but part of it is not confirmed yet.
      alerts.push({
        id: `waiting-${demand.id}`,
        kind: "waiting",
        tone: "warning",
        title: `${demand.id} is waiting for producers to confirm`,
        detail: `${due} · ${formatKg(heldKg)} of ${formatKg(demand.quantityKg)} ${product} on hold`,
        link: { label: "View", to: `/buyer/demands/${demand.id}#sources` },
      });
    }
  }

  for (const allocation of allocations) {
    const batch = supply.find((item) => item.code === allocation.batchCode);
    const demand = demandOf(allocation.demandId);
    const open = allocation.stage === "held" || allocation.stage === "confirmed";

    // A producer offered a batch to one of your demands: your answer is needed.
    if (allocation.stage === "offered") {
      alerts.push({
        id: `offer-${allocation.id}`,
        kind: "offer",
        tone: "warning",
        title: `${allocation.producer} offered ${formatKg(allocation.kg)} for ${allocation.demandId}`,
        detail: `${allocation.batchCode} · expires in ${allocation.offerHoursLeft ?? "–"} h. Accept and pay the deposit to confirm the order.`,
        link: { label: "Review offer", to: `/buyer/orders?tab=offered#order-${allocation.id}` },
      });
    }

    if (batch?.issue && open) {
      alerts.push({
        id: `issue-${allocation.id}`,
        kind: "supply_issue",
        tone: "urgent",
        title: `${batch.producer} reported a problem with ${batch.code}`,
        detail: `${batch.issue} Reserved for ${allocation.demandId}.`,
        link: { label: "Review", to: `/buyer/demands/${allocation.demandId}#sources` },
      });
    }

    if (allocation.stage === "held" && (allocation.holdHoursLeft ?? Infinity) <= RULES.holdWarningHours) {
      alerts.push({
        id: `hold-${allocation.id}`,
        kind: "hold_expiring",
        tone: "warning",
        title: `Your hold on ${allocation.batchCode} lapses in ${allocation.holdHoursLeft} h`,
        detail: `${allocation.producer} has not confirmed ${formatKg(allocation.kg)} for ${allocation.demandId} yet.`,
        link: { label: "View", to: `/buyer/demands/${allocation.demandId}#sources` },
      });
    }

    if (batch && demand && open && batch.sellByDay - demand.neededByDay <= FRESHNESS_MARGIN) {
      const margin = batch.sellByDay - demand.neededByDay;
      alerts.push({
        id: `fresh-${allocation.id}`,
        kind: "freshness",
        tone: "warning",
        title: `${batch.code} must be sold ${margin <= 0 ? "the day" : `${margin} ${margin === 1 ? "day" : "days"}`} after it arrives`,
        detail: `Sells by ${formatDayInText(batch.sellByDay)}; ${allocation.demandId} needs it ${formatDayInText(demand.neededByDay)}. Plan to sell it quickly.`,
        link: { label: "View", to: `/buyer/demands/${allocation.demandId}#sources` },
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
      title: reported ? `You reported a problem on delivery ${delivery.id}` : `Delivery ${delivery.id} has a problem`,
      detail: reported ? `${reported.reason}. A coordinator is following up.` : delivery.issue!,
      link: { label: "Track", to: `/buyer/deliveries/${delivery.id}` },
    });
  }

  const order: Record<AlertTone, number> = { urgent: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.tone] - order[b.tone]);
}
