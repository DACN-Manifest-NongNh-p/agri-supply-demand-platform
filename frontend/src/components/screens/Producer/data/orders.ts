// Orders on this farm's batches, one list for the whole life of a sale: offered by the producer
// (waiting for the buyer), placed by a buyer or the matching engine (waiting for the producer),
// confirmed, on the way, delivered. Demo data, using the same codes as the buyer and
// coordinator areas (A-6 is the Phu Tho hold on B-102; S-301, S-303, S-296, S-288 are the trips).
import type { TaskOutcome } from "../sections/AttentionList";

export type OrderStage = "offered" | "to_confirm" | "confirmed" | "in_transit" | "delivered" | "declined";

export const ORDER_STAGE_LABEL: Record<OrderStage, string> = {
  offered: "Offered",
  to_confirm: "To confirm",
  confirmed: "Confirmed",
  in_transit: "On the way",
  delivered: "Delivered",
  declined: "Declined",
};

export type ProducerOrder = {
  id: string;
  demandId: string;
  buyer: string;
  buyerType: string;
  product: string;
  batch: string;
  quantityKg: number;
  /** Day offset the buyer needs it by. */
  neededByDay: number;
  destination: string;
  /** Day offset the order was placed. */
  placedDay: number;
  stage: OrderStage;
  /** Hours left to confirm, while it waits for the producer. */
  confirmWithinHours?: number;
  /** The "confirm allocation" task on the home page that settles this order. */
  taskId?: string;
  deliveryId?: string;
};

export const orders: ProducerOrder[] = [
  {
    id: "A-6",
    demandId: "D-540",
    buyer: "Phu Tho Wholesale Market",
    buyerType: "Wholesale market",
    product: "Dragon fruit",
    batch: "B-102",
    quantityKg: 3000,
    neededByDay: 1,
    destination: "Phu Tho Wholesale Market, District 11",
    placedDay: -1,
    stage: "to_confirm",
    confirmWithinHours: 5,
    taskId: "T-1",
  },
  {
    id: "A-21",
    demandId: "D-544",
    buyer: "Saigon Fresh Kitchen",
    buyerType: "Restaurant group",
    product: "Mango",
    batch: "B-099",
    quantityKg: 1800,
    neededByDay: 0,
    destination: "District 1, Ho Chi Minh City",
    placedDay: -5,
    stage: "in_transit",
    deliveryId: "S-301",
  },
  {
    id: "A-18",
    demandId: "D-531",
    buyer: "Mekong Export Co.",
    buyerType: "Exporter",
    product: "Dragon fruit",
    batch: "B-100",
    quantityKg: 1500,
    neededByDay: 1,
    destination: "Cat Lai Port, Ho Chi Minh City",
    placedDay: -3,
    stage: "in_transit",
    deliveryId: "S-303",
  },
  {
    id: "A-5",
    demandId: "D-536",
    buyer: "GreenBasket Supermarkets",
    buyerType: "Retail chain",
    product: "Dragon fruit",
    batch: "B-095",
    quantityKg: 2400,
    neededByDay: -1,
    destination: "GreenBasket DC, District 7, Ho Chi Minh City",
    placedDay: -10,
    stage: "delivered",
    deliveryId: "S-296",
  },
  {
    id: "A-12",
    demandId: "D-519",
    buyer: "Saigon Fresh Kitchen",
    buyerType: "Restaurant group",
    product: "Mango",
    batch: "B-091",
    quantityKg: 900,
    neededByDay: -5,
    destination: "District 1, Ho Chi Minh City",
    placedDay: -12,
    stage: "delivered",
    deliveryId: "S-288",
  },
];

/** An order waiting on a home-page task takes that task's outcome once it is settled. */
export function orderStage(order: ProducerOrder, outcomes: Record<string, TaskOutcome>): OrderStage {
  const outcome = order.taskId ? outcomes[order.taskId] : undefined;
  if (!outcome) return order.stage;
  return outcome === "done" ? "confirmed" : "declined";
}
