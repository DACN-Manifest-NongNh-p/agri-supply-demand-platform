// Demo data for the producer home UI. Replace with API calls once the backend exposes them.
// Day values are offsets from today so the calendar always looks current.
import marketImage from "@/assets/market.jpg";
import harvestImage from "@/assets/hero-harvest.jpg";
import produceImage from "@/assets/rescue-produce.jpg";
import type { RouteKey } from "./routes";

export type BatchStatus = "expected" | "ready" | "on_hold" | "allocated" | "in_transit" | "delivered";

export const BATCH_STAGES: { status: BatchStatus; label: string }[] = [
  { status: "expected", label: "Expected harvest" },
  { status: "ready", label: "Ready" },
  { status: "on_hold", label: "On hold" },
  { status: "allocated", label: "Allocated" },
  { status: "in_transit", label: "In transit" },
  { status: "delivered", label: "Delivered" },
];

export type Batch = {
  code: string;
  product: string;
  variety: string;
  quantityKg: number;
  allocatedKg: number;
  grade: "A" | "B" | "C";
  plot: string;
  harvestDay: number;
  readyDay: number;
  sellByDay: number;
  status: BatchStatus;
  /** Photos the producer took of the batch; the first is the cover buyers see. */
  photos?: string[];
};

export type Demand = {
  id: string;
  buyer: string;
  buyerType: string;
  product: string;
  quantityKg: number;
  gradeWanted: string;
  neededByDay: number;
  destination: string;
  distanceKm: number;
  note?: string;
};

export type Task =
  | { id: string; kind: "confirm_allocation"; batch: string; buyer: string; quantityKg: number; dueInHours: number }
  | { id: string; kind: "hold_expiring"; batch: string; buyer: string; dueInHours: number }
  | { id: string; kind: "update_status"; batch: string; from: BatchStatus; to: BatchStatus };

export const DELIVERY_STEPS = ["Packed", "Picked up", "On the road", "Delivered"] as const;

export type DeliveryEvent = { step: number; time: string; place: string; note?: string };

export type Delivery = {
  id: string;
  batch: string;
  product: string;
  buyer: string;
  quantityKg: number;
  carrier: string;
  /** Shown for reference only; producers don't contact drivers directly. */
  driver: { name: string };
  vehiclePlate: string;
  origin: string;
  destination: string;
  /** Short labels for route graphics. */
  fromShort: string;
  toShort: string;
  /** Key into ROUTES (data/routes.ts) for the road geometry. */
  routeKey: RouteKey;
  /** Share of the route covered, 0–1; drives the truck position on maps and progress bars. */
  progress: number;
  /** Where the truck was last seen. */
  lastSeen: string;
  /** Index into DELIVERY_STEPS of the latest step reached. */
  step: 0 | 1 | 2 | 3;
  eta: string;
  events: DeliveryEvent[];
  /** Cold-chain readings in °C; the target band is 2–8 °C. */
  temperatures: { time: string; celsius: number }[];
  receipt?: { receivedBy: string; receivedKg: number; note?: string };
  /** A problem already on record (from the carrier or a coordinator). */
  issue?: string;
};

export type InsightSource = {
  name: string;
  kind: "Market price feed" | "Platform demand" | "Weather service" | "News" | "Trade report";
  day: number;
  excerpt: string;
};

/** An AI-generated market insight: the list shows title + summary, the detail view shows the rest. */
export type Insight = {
  id: string;
  category: "Demand" | "Weather" | "Prices";
  image: string;
  title: string;
  summary: string;
  confidence: "High" | "Medium" | "Low";
  generatedDay: number;
  analysis: string[];
  evidence: { label: string; value: string; note: string }[];
  sources: InsightSource[];
};

export const producer = {
  name: "Hoa Phat Dragon Fruit Cooperative",
  contact: "Nguyen Van Hoa",
  region: "Ham Thuan Nam, Binh Thuan",
  hectares: 18,
  products: ["Dragon fruit", "Mango", "Pomelo"],
};

export const batches: Batch[] = [
  { code: "B-102", product: "Dragon fruit", variety: "White flesh", quantityKg: 4200, allocatedKg: 3000, grade: "A", plot: "Plot 3", harvestDay: -3, readyDay: -2, sellByDay: 4, status: "on_hold" },
  { code: "B-104", product: "Dragon fruit", variety: "Red flesh", quantityKg: 2600, allocatedKg: 0, grade: "A", plot: "Plot 5", harvestDay: -1, readyDay: 0, sellByDay: 6, status: "ready" },
  { code: "B-099", product: "Mango", variety: "Cat Hoa Loc", quantityKg: 1800, allocatedKg: 1800, grade: "B", plot: "Plot 1", harvestDay: -6, readyDay: -4, sellByDay: 2, status: "in_transit" },
  { code: "B-107", product: "Dragon fruit", variety: "White flesh", quantityKg: 5000, allocatedKg: 0, grade: "A", plot: "Plot 2", harvestDay: 3, readyDay: 4, sellByDay: 10, status: "expected" },
  { code: "B-110", product: "Pomelo", variety: "Da xanh", quantityKg: 3200, allocatedKg: 0, grade: "B", plot: "Plot 7", harvestDay: 7, readyDay: 9, sellByDay: 13, status: "expected" },
  // No buyer fits this one (mango demand wants grade A–B): shows up under "Batches without a buyer".
  { code: "B-112", product: "Mango", variety: "Cat Chu", quantityKg: 1200, allocatedKg: 0, grade: "C", plot: "Plot 8", harvestDay: 1, readyDay: 2, sellByDay: 6, status: "expected" },
  // Earlier batches, referenced by deliveries and orders; they appear in the batch list and history.
  { code: "B-100", product: "Dragon fruit", variety: "White flesh", quantityKg: 1500, allocatedKg: 1500, grade: "A", plot: "Plot 4", harvestDay: -2, readyDay: -1, sellByDay: 5, status: "in_transit" },
  { code: "B-095", product: "Dragon fruit", variety: "Red flesh", quantityKg: 2400, allocatedKg: 2400, grade: "A", plot: "Plot 5", harvestDay: -9, readyDay: -8, sellByDay: -2, status: "delivered" },
  { code: "B-091", product: "Mango", variety: "Cat Hoa Loc", quantityKg: 900, allocatedKg: 900, grade: "A", plot: "Plot 1", harvestDay: -12, readyDay: -10, sellByDay: -5, status: "delivered" },
];

export const demands: Demand[] = [
  { id: "D-551", buyer: "GreenBasket Supermarkets", buyerType: "Retail chain", product: "Dragon fruit", quantityKg: 2000, gradeWanted: "Grade A", neededByDay: 2, destination: "District 7, Ho Chi Minh City", distanceKm: 210, note: "Red flesh preferred" },
  { id: "D-548", buyer: "Saigon Fresh Kitchen", buyerType: "Restaurant group", product: "Mango", quantityKg: 600, gradeWanted: "Grade A–B", neededByDay: 3, destination: "District 1, Ho Chi Minh City", distanceKm: 205 },
  { id: "D-560", buyer: "Mekong Export Co.", buyerType: "Exporter", product: "Dragon fruit", quantityKg: 4500, gradeWanted: "Grade A", neededByDay: 6, destination: "Cat Lai Port", distanceKm: 240, note: "Export packing required" },
  { id: "D-562", buyer: "Binh Duong School Meals", buyerType: "Institutional", product: "Pomelo", quantityKg: 1500, gradeWanted: "Grade B", neededByDay: 10, destination: "Thu Dau Mot, Binh Duong", distanceKm: 290 },
];

export const tasks: Task[] = [
  { id: "T-1", kind: "confirm_allocation", batch: "B-102", buyer: "Phu Tho Wholesale Market", quantityKg: 3000, dueInHours: 5 },
  { id: "T-4", kind: "update_status", batch: "B-107", from: "expected", to: "ready" },
];

export const deliveries: Delivery[] = [
  {
    id: "S-301",
    batch: "B-099",
    product: "Mango",
    buyer: "Saigon Fresh Kitchen",
    quantityKg: 1800,
    carrier: "Delta Cold Chain",
    driver: { name: "Tran Van Minh" },
    vehiclePlate: "51C-482.19",
    origin: "Hoa Phat packhouse, Ham Thuan Nam",
    destination: "District 1, Ho Chi Minh City",
    fromShort: "Ham Thuan Nam",
    toShort: "District 1, HCMC",
    routeKey: "district1",
    progress: 0.64,
    lastSeen: "Near Dau Giay · 13:05",
    step: 2,
    eta: "Today, 16:30",
    events: [
      { step: 0, time: "Today, 05:40", place: "Hoa Phat packhouse", note: "120 crates, sealed" },
      { step: 1, time: "Today, 07:15", place: "Hoa Phat packhouse", note: "Loaded by Delta Cold Chain" },
      { step: 2, time: "Today, 13:05", place: "Near Dau Giay, Dong Nai", note: "On schedule" },
    ],
    temperatures: [
      { time: "07:00", celsius: 5.2 }, { time: "08:00", celsius: 4.6 }, { time: "09:00", celsius: 4.1 },
      { time: "10:00", celsius: 4.4 }, { time: "11:00", celsius: 5.0 }, { time: "12:00", celsius: 4.8 },
      { time: "13:00", celsius: 4.3 },
    ],
  },
  {
    id: "S-303",
    batch: "B-100",
    product: "Dragon fruit",
    buyer: "Mekong Export Co.",
    quantityKg: 1500,
    carrier: "SouthLine Logistics",
    driver: { name: "Le Hoang Nam" },
    vehiclePlate: "86C-117.45",
    origin: "Hoa Phat packhouse, Ham Thuan Nam",
    destination: "Cat Lai Port, Ho Chi Minh City",
    fromShort: "Ham Thuan Nam",
    toShort: "Cat Lai Port",
    routeKey: "catlai",
    progress: 0.16,
    lastSeen: "Near Ham Kiem interchange · 09:30",
    step: 1,
    eta: "Tomorrow, 09:00 (revised)",
    events: [
      { step: 0, time: "Today, 06:10", place: "Hoa Phat packhouse", note: "Export packing, 150 cartons" },
      { step: 1, time: "Today, 09:30", place: "Ham Kiem interchange", note: "Truck breakdown; replacement vehicle on the way" },
    ],
    temperatures: [
      { time: "09:00", celsius: 6.1 }, { time: "10:00", celsius: 6.8 }, { time: "11:00", celsius: 7.6 },
      { time: "12:00", celsius: 8.4 }, { time: "13:00", celsius: 7.2 },
    ],
    issue: "Truck broke down near the Ham Kiem interchange. A replacement vehicle is being dispatched by the carrier.",
  },
  {
    id: "S-296",
    batch: "B-095",
    product: "Dragon fruit",
    buyer: "GreenBasket Supermarkets",
    quantityKg: 2400,
    carrier: "Delta Cold Chain",
    driver: { name: "Tran Van Minh" },
    vehiclePlate: "51C-482.19",
    origin: "Hoa Phat packhouse, Ham Thuan Nam",
    destination: "District 7, Ho Chi Minh City",
    fromShort: "Ham Thuan Nam",
    toShort: "District 7, HCMC",
    routeKey: "district7",
    progress: 1,
    lastSeen: "Delivered · yesterday 15:10",
    step: 3,
    eta: "Delivered yesterday, 15:10",
    events: [
      { step: 0, time: "Yesterday, 04:50", place: "Hoa Phat packhouse" },
      { step: 1, time: "Yesterday, 06:00", place: "Hoa Phat packhouse" },
      { step: 2, time: "Yesterday, 06:05", place: "Ham Thuan Nam" },
      { step: 3, time: "Yesterday, 15:10", place: "GreenBasket DC, District 7", note: "Signed by receiving team" },
    ],
    temperatures: [
      { time: "06:00", celsius: 4.8 }, { time: "08:00", celsius: 4.2 }, { time: "10:00", celsius: 4.0 },
      { time: "12:00", celsius: 4.5 }, { time: "14:00", celsius: 4.9 }, { time: "15:00", celsius: 5.1 },
    ],
    receipt: { receivedBy: "Le Thi Thu, receiving team", receivedKg: 2380, note: "20 kg rejected for bruising" },
  },
  {
    id: "S-288",
    batch: "B-091",
    product: "Mango",
    buyer: "Saigon Fresh Kitchen",
    quantityKg: 900,
    carrier: "Delta Cold Chain",
    driver: { name: "Pham Quoc Bao" },
    vehiclePlate: "51D-203.77",
    origin: "Hoa Phat packhouse, Ham Thuan Nam",
    destination: "District 1, Ho Chi Minh City",
    fromShort: "Ham Thuan Nam",
    toShort: "District 1, HCMC",
    routeKey: "district1",
    progress: 1,
    lastSeen: "Delivered · Fri 11:40",
    step: 3,
    eta: "Delivered Fri, 11:40",
    events: [
      { step: 0, time: "Fri, 04:30", place: "Hoa Phat packhouse" },
      { step: 1, time: "Fri, 05:20", place: "Hoa Phat packhouse" },
      { step: 2, time: "Fri, 05:25", place: "Ham Thuan Nam" },
      { step: 3, time: "Fri, 11:40", place: "Saigon Fresh Kitchen, District 1" },
    ],
    temperatures: [
      { time: "06:00", celsius: 4.4 }, { time: "08:00", celsius: 4.1 }, { time: "10:00", celsius: 4.6 },
      { time: "11:00", celsius: 4.8 },
    ],
    receipt: { receivedBy: "Nguyen Minh Chau, kitchen manager", receivedKg: 900 },
  },
];

export const insights: Insight[] = [
  {
    id: "M-1",
    category: "Demand",
    image: marketImage,
    title: "Dragon fruit demand may rise next week",
    summary: "Demand in Ho Chi Minh City is trending upward, which may create a favourable opportunity for your upcoming batches.",
    confidence: "Medium",
    generatedDay: 0,
    analysis: [
      "Open dragon fruit demand from Ho Chi Minh City buyers on Farmora grew for the third week in a row, led by retail chains restocking ahead of the weekend promotions season.",
      "Wholesale prices at Binh Dien market rose slightly while arrivals from Binh Thuan stayed flat, a pattern that usually precedes stronger buying the following week.",
      "If the trend holds, batches that are ready between Saturday and Tuesday are best placed to meet it. B-107 (5,000 kg, expected ready Sat) falls inside that window.",
    ],
    evidence: [
      { label: "Open demand, HCMC", value: "+18%", note: "Week on week, dragon fruit, Farmora platform" },
      { label: "Wholesale price", value: "+6%", note: "Binh Dien market, white flesh grade A, 7-day average" },
      { label: "Arrivals from Binh Thuan", value: "−2%", note: "Week on week, market arrival logs" },
    ],
    sources: [
      { name: "Farmora demand data", kind: "Platform demand", day: 0, excerpt: "42 open dragon fruit demands from HCMC buyers, up from 36 last week." },
      { name: "Binh Dien wholesale price bulletin", kind: "Market price feed", day: -1, excerpt: "White-flesh dragon fruit grade A: 24,000–26,000 VND/kg, up from 23,000–24,500." },
      { name: "Regional produce trade report", kind: "Trade report", day: -3, excerpt: "Retailers in the south plan wider fruit promotions for the last week of October." },
    ],
  },
  {
    id: "M-2",
    category: "Weather",
    image: harvestImage,
    title: "Rain may affect harvest quality on Thursday and Friday",
    summary: "Heavy rain is forecast for Ham Thuan Nam. Harvesting ready dragon fruit before Thursday can reduce the risk of split fruit.",
    confidence: "High",
    generatedDay: 0,
    analysis: [
      "Forecasts agree on 30–45 mm of rain over Ham Thuan Nam from Thursday morning to Friday evening.",
      "Dragon fruit picked right after heavy rain splits and rots faster, which shortens shelf life and can push a batch below grade A.",
      "B-107 is expected to be ready on Saturday. Harvesting it on Wednesday, one day early, keeps it within grade A tolerances according to past harvest records.",
    ],
    evidence: [
      { label: "Forecast rainfall", value: "30–45 mm", note: "Thu–Fri, Ham Thuan Nam" },
      { label: "Rain probability", value: "85%", note: "Thursday, two independent forecasts" },
      { label: "Split-fruit rate after rain", value: "≈ 12%", note: "Average from past wet-week harvests in the region" },
    ],
    sources: [
      { name: "National weather service forecast", kind: "Weather service", day: 0, excerpt: "Southern Central Coast: moderate to heavy rain Thursday into Friday." },
      { name: "Provincial agriculture news", kind: "News", day: -1, excerpt: "Growers advised to bring harvests forward ahead of the late-week rain." },
    ],
  },
  {
    id: "M-3",
    category: "Prices",
    image: produceImage,
    title: "Mango wholesale prices are softening",
    summary: "Supply from the Mekong Delta is increasing, so mango prices may stay lower for about two weeks. Plan new mango batches with this in mind.",
    confidence: "Medium",
    generatedDay: -1,
    analysis: [
      "Cat Hoa Loc mango arrivals from Tien Giang and Dong Thap rose sharply as the main season peaked.",
      "Wholesale prices fell for a second week and buyer demand on Farmora is steady rather than growing, so extra supply is unlikely to be absorbed quickly.",
      "Prices typically recover once the peak passes. Declaring new mango batches for early November rather than late October may get better terms.",
    ],
    evidence: [
      { label: "Wholesale price", value: "−9%", note: "Cat Hoa Loc grade A, 14-day change" },
      { label: "Market arrivals", value: "+21%", note: "From Mekong Delta provinces, week on week" },
      { label: "Open mango demand", value: "±0%", note: "Farmora platform, week on week" },
    ],
    sources: [
      { name: "Thu Duc wholesale price bulletin", kind: "Market price feed", day: -1, excerpt: "Cat Hoa Loc grade A: 38,000 VND/kg, down from 42,000 two weeks ago." },
      { name: "Farmora demand data", kind: "Platform demand", day: 0, excerpt: "11 open mango demands, unchanged from last week." },
      { name: "Mekong fruit market report", kind: "Trade report", day: -2, excerpt: "Peak mango harvest expected to continue until early November." },
    ],
  },
];
