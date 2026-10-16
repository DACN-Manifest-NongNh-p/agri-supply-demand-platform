import { RULES } from "@/lib/site";
import type { Delivery } from "./mockProducer";

export type DeliveryIssue = { reason: string; note: string };
export type DeliveryStatus = "in_transit" | "delivered" | "issue";

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  in_transit: "In transit",
  delivered: "Delivered",
  issue: "Needs attention",
};

/** Cold-chain band for fresh fruit; readings outside it are flagged. */
export const TEMPERATURE_RANGE = {
  get min() {
    return RULES.coldChainMin;
  },
  get max() {
    return RULES.coldChainMax;
  },
};

/** ETA text without the "Delivered" prefix (the label next to it already says so), first letter capitalised. */
export function etaText(delivery: Delivery) {
  const text = delivery.eta.replace(/^Delivered /, "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A problem on record or reported by the producer outranks the delivery step. */
export function deliveryStatus(delivery: Delivery, reported?: DeliveryIssue): DeliveryStatus {
  if (delivery.issue || reported) return "issue";
  return delivery.step === 3 ? "delivered" : "in_transit";
}

/** Active deliveries first (problems on top), then delivered ones. */
export function sortDeliveries<T extends Delivery>(list: T[], reported: Record<string, DeliveryIssue>) {
  const rank: Record<DeliveryStatus, number> = { issue: 0, in_transit: 1, delivered: 2 };
  return [...list].sort((a, b) => rank[deliveryStatus(a, reported[a.id])] - rank[deliveryStatus(b, reported[b.id])]);
}
