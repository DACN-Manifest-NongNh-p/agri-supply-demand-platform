// The order lifecycle in one place, so the orders page, demand detail, popup and alerts agree.
import type { Allocation, AllocationStage } from "./mockBuyer";

/** The four steps every order goes through; the first depends on who started it. */
export function orderSteps(order: Pick<Allocation, "origin">) {
  return [order.origin === "offered" ? "Producer offered" : "You reserved", "Both agreed", "On the way", "Delivered"];
}

/** Index of the step the order has reached (0–3; −1 while it is only locked); declined orders stop where they were. */
export function orderStepIndex(stage: AllocationStage) {
  switch (stage) {
    case "locked":
      return -1;
    case "offered":
    case "held":
    case "declined":
      return 0;
    case "confirmed":
      return 1;
    case "in_transit":
      return 2;
    case "delivered":
      return 3;
  }
}

/** Who has to act next, in a few words. */
export function nextStep(order: Allocation) {
  switch (order.stage) {
    case "locked":
      return "Pay the deposit before the lock runs out";
    case "offered":
      return `Accept and pay the deposit · expires in ${order.offerHoursLeft ?? "–"} h`;
    case "held":
      return `${order.producer} confirms · ${order.holdHoursLeft ?? "–"} h left`;
    case "confirmed":
      return "Truck being booked · pickup at the farm next";
    case "in_transit":
      return "On the road to you";
    case "delivered":
      return "Delivered and signed for";
    case "declined":
      return order.closedNote ?? "Declined";
  }
}

export type OrderTab = "held" | "offered" | "confirmed" | "deliveries" | "declined";

/** Tabs of the cart, On hold first. */
export const ORDER_TABS: { id: OrderTab; label: string; hint: string; empty: string; stages: AllocationStage[] }[] = [
  { id: "held", label: "On hold", hint: "Locked batches wait for your deposit before the timer runs out. Paid orders wait for the producer to confirm.", empty: "Nothing on hold. Reserve a batch from one of your demands.", stages: ["locked", "held"] },
  { id: "offered", label: "Offers", hint: "Producers offered a batch for one of your demands. Accept and pay the deposit to confirm the order.", empty: "No offers from producers right now.", stages: ["offered"] },
  { id: "confirmed", label: "Confirmed", hint: "Both sides agreed. A truck is being booked for pickup at the farm.", empty: "No confirmed orders waiting for pickup.", stages: ["confirmed"] },
  { id: "deliveries", label: "Deliveries", hint: "Confirmed orders once a truck picks them up, to proof of delivery at your DC. Problems first.", empty: "No deliveries yet.", stages: ["in_transit", "delivered"] },
  { id: "declined", label: "Declined", hint: "Offers you turned down.", empty: "You have not declined any offer.", stages: ["declined"] },
];

/** The tab an order of this stage is listed under. */
export const tabOf = (stage: AllocationStage): OrderTab => ORDER_TABS.find((tab) => tab.stages.includes(stage))!.id;

/** Offers to answer first, then holds, then everything moving, finished last. */
const ORDER: Record<AllocationStage, number> = { locked: 0, offered: 1, held: 2, confirmed: 3, in_transit: 4, delivered: 5, declined: 6 };

export function sortOrders(orders: Allocation[]) {
  return [...orders].sort((a, b) => ORDER[a.stage] - ORDER[b.stage]);
}
