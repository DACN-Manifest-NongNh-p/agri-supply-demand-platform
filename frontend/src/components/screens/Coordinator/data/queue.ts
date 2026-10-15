// The coordinator's "needs action" list, derived from current data like the buyer's alerts:
// an item disappears once its cause is handled (decision made, hold settled, request resolved,
// both sides told about a delivery problem). Clean matches never show up here: the system holds them.
import { formatDayInText, formatKg } from "../../Producer/data/format";
import { TEMPERATURE_RANGE } from "../../Producer/data/deliveries";
import type { BoardRow } from "./market";
import { REQUEST_KIND_LABEL, type HelpRequest, type MarketAllocation, type MarketDelivery, type MarketDemand } from "./mockCoordinator";

export type QueueTone = "urgent" | "warning" | "info";
/** What kind of work an item is, so the overview can group the non-urgent ones. */
export type QueueGroup = "gap" | "decision" | "hold" | "delivery" | "request";

export type QueueItem = {
  id: string;
  tone: QueueTone;
  group: QueueGroup;
  label: string;
  title: string;
  caption: string;
  link: { label: string; to: string };
};

/** Demands due within this many days are flagged when not fully sourced. */
const DUE_SOON_DAYS = 3;
const HOLD_WARNING_HOURS = 6;

type Input = {
  rows: BoardRow[];
  demands: MarketDemand[];
  allocations: MarketAllocation[];
  requests: HelpRequest[];
  resolved: Record<string, unknown>;
  deliveries: MarketDelivery[];
  /** Deliveries the coordinator already sent both sides an update about. */
  deliveryUpdates: Record<string, unknown[]>;
};

/** What is wrong on the road: a problem on record, or cold-chain readings outside the band. */
export function deliveryIncident(delivery: MarketDelivery): string | undefined {
  if (delivery.step === 3) return undefined;
  if (delivery.issue) return delivery.issue;
  const outside = delivery.temperatures.filter(({ celsius }) => celsius < TEMPERATURE_RANGE.min || celsius > TEMPERATURE_RANGE.max);
  if (outside.length === 0) return undefined;
  const worst = outside.reduce((a, b) => (Math.abs(b.celsius - 5) > Math.abs(a.celsius - 5) ? b : a));
  return `Cold chain out of range: ${worst.celsius} °C at ${worst.time} (target ${TEMPERATURE_RANGE.min}–${TEMPERATURE_RANGE.max} °C).`;
}

export function buildQueue({ rows, demands, allocations, requests, resolved, deliveries, deliveryUpdates }: Input): QueueItem[] {
  const items: QueueItem[] = [];

  for (const row of rows) {
    const { demand, fulfilment, best } = row;
    const dueSoon = demand.neededByDay <= DUE_SOON_DAYS;
    const due = `needed by ${formatDayInText(demand.neededByDay)}`;
    if (best) {
      // Only proposals with an exception are left on the board; every one of them needs a person.
      items.push({
        id: `decide-${demand.id}`,
        tone: dueSoon ? "warning" : "info",
        group: "decision",
        label: "Needs your decision",
        title: `${demand.id} · ${demand.buyer}`,
        caption: `${formatKg(fulfilment.openKg)} ${demand.product.toLowerCase()} ${due}. ${row.exceptions.map((item) => item.text).join(" ")}`,
        link: { label: "Decide", to: `/coordinator/matching?demand=${demand.id}#demand-${demand.id}` },
      });
    } else if (dueSoon) {
      items.push({
        id: `gap-${demand.id}`,
        tone: "urgent",
        group: "gap",
        label: "No supply",
        title: `${demand.id} · ${demand.buyer}`,
        caption: `${formatKg(fulfilment.openKg)} ${demand.product.toLowerCase()} ${due}. ${row.reason ?? ""}`.trim(),
        link: { label: "See gaps", to: `/coordinator/matching?tab=gaps#demand-${demand.id}` },
      });
    }
  }

  for (const allocation of allocations) {
    if (allocation.stage !== "held" || (allocation.holdHoursLeft ?? Infinity) > HOLD_WARNING_HOURS) continue;
    const demand = demands.find((item) => item.id === allocation.demandId);
    items.push({
      id: `hold-${allocation.id}`,
      tone: "warning",
      group: "hold",
      label: "Hold expiring",
      title: `${allocation.batchCode} · ${allocation.holdHoursLeft} h left`,
      caption: `${allocation.producer} has not confirmed ${formatKg(allocation.kg)} for ${demand?.buyer ?? allocation.demandId} (${allocation.demandId}).`,
      link: { label: "Follow up", to: "/coordinator/matching?tab=holds" },
    });
  }

  const openRequests = requests.filter((request) => !resolved[request.id]);

  for (const delivery of deliveries) {
    const incident = deliveryIncident(delivery);
    if (!incident || deliveryUpdates[delivery.id]?.length) continue;
    // An open request about the same delivery already covers it.
    const path = `/coordinator/deliveries/${delivery.id}`;
    if (openRequests.some((request) => request.link?.to === path)) continue;
    items.push({
      id: `delivery-${delivery.id}`,
      tone: delivery.issue ? "urgent" : "warning",
      group: "delivery",
      label: "Delivery problem",
      title: `${delivery.id} · ${delivery.fromShort} → ${delivery.toShort}`,
      caption: `${incident} Call ${delivery.carrier}, then send ${delivery.buyer} and ${delivery.producer} an update.`,
      link: { label: "Handle", to: path },
    });
  }

  for (const request of openRequests) {
    items.push({
      id: `request-${request.id}`,
      tone: request.urgent ? "urgent" : "info",
      group: "request",
      label: REQUEST_KIND_LABEL[request.kind],
      title: request.subject,
      caption: `${request.from} · ${request.detail}`,
      link: { label: "Handle", to: `/coordinator/requests#${request.id}` },
    });
  }

  const order: Record<QueueTone, number> = { urgent: 0, warning: 1, info: 2 };
  return items.sort((a, b) => order[a.tone] - order[b.tone]);
}
