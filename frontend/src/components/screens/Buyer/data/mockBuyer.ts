// Demo data for the buyer area. Replace with API calls once the backend exposes them.
// Day values are offsets from today, like the producer mock, so dates always look current.
// The buyer is GreenBasket Supermarkets, which also appears as a buyer in the producer demo.
import type { Batch, Delivery } from "../../Producer/data/mockProducer";
import { deliveries as producerDeliveries } from "../../Producer/data/mockProducer";

export const buyer = {
  name: "GreenBasket Supermarkets",
  type: "Retail chain",
  contact: "Tran Minh Anh",
  role: "Fresh produce buyer",
  destination: "GreenBasket DC, District 7, Ho Chi Minh City",
  /** What this buyer usually orders; any other product can be typed in when posting a demand. */
  products: ["Dragon fruit", "Mango", "Pomelo", "Avocado"],
};

export const GRADE_OPTIONS = ["Grade A", "Grade A–B", "Grade B", "Any grade"] as const;

/** A place the buyer receives goods. Carriers need all of it: where, who signs, when the dock is open. */
export type DeliveryAddress = {
  id: string;
  /** Short name the buyer knows the place by, e.g. "Thu Duc store". */
  label: string;
  street: string;
  ward?: string;
  district: string;
  province: string;
  contactName: string;
  phone: string;
  /** When the receiving dock takes deliveries, e.g. "05:00–10:00". */
  receivingHours: string;
  /** Gate, dock or parking instructions for the driver. */
  note?: string;
};

export const PROVINCES = [
  "Ho Chi Minh City",
  "Dong Nai",
  "Binh Duong",
  "Long An",
  "Ba Ria - Vung Tau",
  "Binh Thuan",
  "Lam Dong",
  "Can Tho",
  "Khanh Hoa",
  "Da Nang",
  "Ha Noi",
] as const;

/** The buyer's saved addresses; the first is the default. */
export const addresses: DeliveryAddress[] = [
  {
    id: "ADR-1",
    label: "GreenBasket DC",
    street: "Lot C2, Tan Thuan Export Processing Zone",
    ward: "Tan Thuan Dong",
    district: "District 7",
    province: "Ho Chi Minh City",
    contactName: "Le Thi Thu",
    phone: "0903 112 458",
    receivingHours: "05:00–10:00",
    note: "Dock 3. Show the Farmora delivery code at gate B.",
  },
  {
    id: "ADR-2",
    label: "Thu Duc store",
    street: "216 Vo Van Ngan",
    ward: "Binh Tho",
    district: "Thu Duc",
    province: "Ho Chi Minh City",
    contactName: "Pham Minh Khoa",
    phone: "0918 334 201",
    receivingHours: "06:00–09:00",
    note: "Unload at the back entrance on Dang Van Bi.",
  },
  {
    id: "ADR-3",
    label: "Bien Hoa store",
    street: "89 Pham Van Thuan",
    ward: "Tan Mai",
    district: "Bien Hoa",
    province: "Dong Nai",
    contactName: "Nguyen Thi Hoa",
    phone: "0937 556 120",
    receivingHours: "06:00–10:00",
  },
];

/** One line for lists and tickets: "Thu Duc store, 216 Vo Van Ngan, Thu Duc, Ho Chi Minh City". */
export function formatAddress(address: Omit<DeliveryAddress, "id">) {
  return [address.label, address.street, address.ward, address.district, address.province].filter(Boolean).join(", ");
}

/** A producer batch as the buyer sees it on the market: who grows it and how far away it is. */
export type SupplyBatch = Batch & {
  producer: string;
  region: string;
  /** Road distance to the buyer's distribution centre. */
  distanceKm: number;
  /** A supply problem the producer reported on this batch. */
  issue?: string;
};

export type BuyerDemand = {
  id: string;
  product: string;
  quantityKg: number;
  gradeWanted: string;
  neededByDay: number;
  /** Delivery address as one line. */
  destination: string;
  /** Saved address it goes to, when it is one. */
  addressId?: string;
  /** Preferred arrival window, e.g. "05:00–10:00". */
  deliveryWindow?: string;
  createdDay: number;
  note?: string;
};

/** Held → allocated → in transit → delivered. A hold reserves quantity until the producer confirms. */
export type AllocationStage = "held" | "allocated" | "in_transit" | "delivered";

export const ALLOCATION_STAGE_LABEL: Record<AllocationStage, string> = {
  held: "Reserved",
  allocated: "Allocated",
  in_transit: "On the way",
  delivered: "Delivered",
};

export type Allocation = {
  id: string;
  demandId: string;
  batchCode: string;
  producer: string;
  kg: number;
  stage: AllocationStage;
  /** Hours until a hold lapses if the producer has not confirmed it. */
  holdHoursLeft?: number;
  deliveryId?: string;
};

export type BuyerDelivery = Delivery & { producer: string; demandId: string };

export const supply: SupplyBatch[] = [
  { code: "B-104", producer: "Hoa Phat Dragon Fruit Cooperative", region: "Ham Thuan Nam, Binh Thuan", distanceKm: 210, product: "Dragon fruit", variety: "Red flesh", quantityKg: 2600, allocatedKg: 0, grade: "A", plot: "Plot 5", harvestDay: -1, readyDay: 0, sellByDay: 6, status: "ready" },
  { code: "B-107", producer: "Hoa Phat Dragon Fruit Cooperative", region: "Ham Thuan Nam, Binh Thuan", distanceKm: 210, product: "Dragon fruit", variety: "White flesh", quantityKg: 5000, allocatedKg: 0, grade: "A", plot: "Plot 2", harvestDay: 3, readyDay: 4, sellByDay: 10, status: "expected" },
  { code: "H-215", producer: "Ham Kiem Green Farm", region: "Ham Kiem, Binh Thuan", distanceKm: 195, product: "Dragon fruit", variety: "White flesh", quantityKg: 1800, allocatedKg: 0, grade: "B", plot: "North field", harvestDay: 0, readyDay: 1, sellByDay: 7, status: "expected" },
  { code: "M-331", producer: "Thuan Nam Mango Growers", region: "Thuan Nam, Binh Thuan", distanceKm: 205, product: "Mango", variety: "Cat Hoa Loc", quantityKg: 1500, allocatedKg: 1000, grade: "A", plot: "Orchard 2", harvestDay: -2, readyDay: 0, sellByDay: 4, status: "ready" },
  { code: "M-334", producer: "Thuan Nam Mango Growers", region: "Thuan Nam, Binh Thuan", distanceKm: 205, product: "Mango", variety: "Cat Chu", quantityKg: 900, allocatedKg: 0, grade: "B", plot: "Orchard 4", harvestDay: 1, readyDay: 2, sellByDay: 7, status: "expected" },
  { code: "G-118", producer: "Green Hills Farm", region: "Tanh Linh, Binh Thuan", distanceKm: 160, product: "Mango", variety: "Cat Chu", quantityKg: 700, allocatedKg: 0, grade: "C", plot: "Block C", harvestDay: 0, readyDay: 1, sellByDay: 3, status: "expected" },
  { code: "P-140", producer: "Muong Man Pomelo Cooperative", region: "Muong Man, Binh Thuan", distanceKm: 190, product: "Pomelo", variety: "Da xanh", quantityKg: 2000, allocatedKg: 1200, grade: "A", plot: "Garden 1", harvestDay: -2, readyDay: -1, sellByDay: 9, status: "allocated", issue: "Storm damage on part of the garden: the producer may ship 1,000 kg instead of 1,200 kg." },
  { code: "B-110", producer: "Bac Binh Citrus Farm", region: "Bac Binh, Binh Thuan", distanceKm: 230, product: "Pomelo", variety: "Da xanh", quantityKg: 3200, allocatedKg: 0, grade: "B", plot: "Plot 7", harvestDay: 7, readyDay: 9, sellByDay: 13, status: "expected" },
  { code: "L-077", producer: "Lam Ha Avocado Cooperative", region: "Lam Ha, Lam Dong", distanceKm: 300, product: "Avocado", variety: "Booth 7", quantityKg: 1200, allocatedKg: 0, grade: "A", plot: "Hill 3", harvestDay: 2, readyDay: 3, sellByDay: 9, status: "expected" },
  { code: "L-079", producer: "Lam Ha Avocado Cooperative", region: "Lam Ha, Lam Dong", distanceKm: 300, product: "Avocado", variety: "034", quantityKg: 600, allocatedKg: 0, grade: "B", plot: "Hill 1", harvestDay: 5, readyDay: 6, sellByDay: 11, status: "expected" },
];

export const demands: BuyerDemand[] = [
  { id: "D-551", product: "Dragon fruit", quantityKg: 2000, gradeWanted: "Grade A", neededByDay: 2, destination: buyer.destination, createdDay: -1, note: "Red flesh preferred" },
  { id: "D-565", product: "Mango", quantityKg: 1200, gradeWanted: "Grade A–B", neededByDay: 3, destination: buyer.destination, createdDay: -2, note: "Weekend promotion, stores in District 7 and 4" },
  { id: "D-570", product: "Pomelo", quantityKg: 2000, gradeWanted: "Grade A–B", neededByDay: 7, destination: buyer.destination, createdDay: -3 },
  { id: "D-572", product: "Avocado", quantityKg: 800, gradeWanted: "Grade A", neededByDay: 5, destination: buyer.destination, createdDay: 0 },
  { id: "D-558", product: "Dragon fruit", quantityKg: 1500, gradeWanted: "Grade A", neededByDay: 1, destination: buyer.destination, createdDay: -4 },
  { id: "D-536", product: "Dragon fruit", quantityKg: 2400, gradeWanted: "Grade A", neededByDay: -1, destination: buyer.destination, createdDay: -10 },
];

export const allocations: Allocation[] = [
  { id: "A-1", demandId: "D-565", batchCode: "M-329", producer: "Thuan Nam Mango Growers", kg: 400, stage: "in_transit", deliveryId: "S-305" },
  { id: "A-2", demandId: "D-565", batchCode: "M-331", producer: "Thuan Nam Mango Growers", kg: 600, stage: "held", holdHoursLeft: 4 },
  { id: "A-3", demandId: "D-570", batchCode: "P-140", producer: "Muong Man Pomelo Cooperative", kg: 1200, stage: "allocated" },
  { id: "A-4", demandId: "D-558", batchCode: "H-209", producer: "Ham Kiem Green Farm", kg: 1500, stage: "in_transit", deliveryId: "S-307" },
  { id: "A-5", demandId: "D-536", batchCode: "B-095", producer: "Hoa Phat Dragon Fruit Cooperative", kg: 2400, stage: "delivered", deliveryId: "S-296" },
];

const greenBasketDelivered = producerDeliveries.find((delivery) => delivery.id === "S-296")!;

export const deliveries: BuyerDelivery[] = [
  {
    id: "S-307",
    batch: "H-209",
    product: "Dragon fruit",
    buyer: buyer.name,
    producer: "Ham Kiem Green Farm",
    demandId: "D-558",
    quantityKg: 1500,
    carrier: "Delta Cold Chain",
    driver: { name: "Vo Thanh Long" },
    vehiclePlate: "51C-611.08",
    origin: "Ham Kiem Green Farm packhouse, Binh Thuan",
    destination: buyer.destination,
    fromShort: "Ham Kiem",
    toShort: "District 7, HCMC",
    routeKey: "district7",
    progress: 0.52,
    lastSeen: "Near Xuan Loc · 12:40",
    step: 2,
    eta: "Today, 17:00",
    events: [
      { step: 0, time: "Today, 05:10", place: "Ham Kiem Green Farm", note: "100 crates, sealed" },
      { step: 1, time: "Today, 06:30", place: "Ham Kiem Green Farm", note: "Loaded by Delta Cold Chain" },
      { step: 2, time: "Today, 12:40", place: "Near Xuan Loc, Dong Nai", note: "On schedule" },
    ],
    temperatures: [
      { time: "07:00", celsius: 5.0 }, { time: "08:00", celsius: 4.4 }, { time: "09:00", celsius: 4.2 },
      { time: "10:00", celsius: 4.6 }, { time: "11:00", celsius: 4.9 }, { time: "12:00", celsius: 4.5 },
    ],
  },
  {
    id: "S-305",
    batch: "M-329",
    product: "Mango",
    buyer: buyer.name,
    producer: "Thuan Nam Mango Growers",
    demandId: "D-565",
    quantityKg: 400,
    carrier: "SouthLine Logistics",
    driver: { name: "Dang Van Tai" },
    vehiclePlate: "86C-204.31",
    origin: "Thuan Nam Mango Growers, Binh Thuan",
    destination: buyer.destination,
    fromShort: "Thuan Nam",
    toShort: "District 7, HCMC",
    routeKey: "district7",
    progress: 0.12,
    lastSeen: "Ham Thuan Nam · 10:15",
    step: 1,
    eta: "Tomorrow, 08:30 (revised)",
    events: [
      { step: 0, time: "Today, 07:00", place: "Thuan Nam Mango Growers", note: "32 crates" },
      { step: 1, time: "Today, 10:15", place: "Thuan Nam Mango Growers", note: "Pickup two hours late" },
    ],
    temperatures: [
      { time: "10:00", celsius: 6.4 }, { time: "11:00", celsius: 7.1 }, { time: "12:00", celsius: 6.8 },
    ],
    issue: "Pickup ran two hours late; the carrier revised the arrival to tomorrow morning.",
  },
  { ...greenBasketDelivered, producer: "Hoa Phat Dragon Fruit Cooperative", demandId: "D-536" },
];
