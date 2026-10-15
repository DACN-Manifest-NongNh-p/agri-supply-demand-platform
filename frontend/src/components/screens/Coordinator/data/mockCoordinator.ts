// Demo data for the coordinator area. Replace with API calls once the backend exposes them.
// The coordinator sees the whole market: every buyer's demands, every producer's batches, and
// the deliveries between them. It reuses the producer and buyer demo data so the same codes
// (D-551, B-104, S-305...) mean the same thing in all three areas.
import type { Delivery } from "../../Producer/data/mockProducer";
import { deliveries as producerDeliveries, producer } from "../../Producer/data/mockProducer";
import type { Allocation, BuyerDemand, SupplyBatch } from "../../Buyer/data/mockBuyer";
import {
  allocations as buyerAllocations,
  buyer,
  deliveries as buyerDeliveries,
  demands as buyerDemands,
  supply as buyerSupply,
} from "../../Buyer/data/mockBuyer";

export const coordinator = {
  name: "Le Thu Ha",
};

/** A buyer demand as the coordinator sees it: same shape as the buyer's, plus who posted it. */
export type MarketDemand = BuyerDemand & { buyer: string; buyerType: string };

export type MarketDelivery = Delivery & { producer: string };

/** An allocation plus who made it: the matching engine on its own, or the coordinator on an exception. */
export type MarketAllocation = Allocation & { matchedBy?: "system" | "coordinator"; score?: number };

const hoaPhat = { producer: producer.name, region: producer.region, distanceKm: 210 };

/** Every batch on the market. Two of Hoa Phat's batches come from the producer demo. */
export const market: SupplyBatch[] = [
  ...buyerSupply,
  { ...hoaPhat, code: "B-102", product: "Dragon fruit", variety: "White flesh", quantityKg: 4200, allocatedKg: 3000, grade: "A", plot: "Plot 3", harvestDay: -3, readyDay: -2, sellByDay: 4, status: "on_hold" },
  { ...hoaPhat, code: "B-112", product: "Mango", variety: "Cat Chu", quantityKg: 1200, allocatedKg: 0, grade: "C", plot: "Plot 8", harvestDay: 1, readyDay: 2, sellByDay: 6, status: "expected" },
  // Farms in the other hubs. The durian is only ready after D-578's deadline, so that demand stays a gap.
  { code: "T-201", producer: "Cai Lay Durian Garden", region: "Cai Lay, Tien Giang", distanceKm: 95, product: "Durian", variety: "Ri6", quantityKg: 2500, allocatedKg: 0, grade: "A", plot: "Row 4", harvestDay: 7, readyDay: 8, sellByDay: 14, status: "expected" },
  { code: "T-208", producer: "Cho Gao Dragon Fruit Co-op", region: "Cho Gao, Tien Giang", distanceKm: 70, product: "Dragon fruit", variety: "Red flesh", quantityKg: 1800, allocatedKg: 0, grade: "B", plot: "Field 2", harvestDay: 1, readyDay: 2, sellByDay: 8, status: "expected" },
  { code: "C-150", producer: "Cai Lay Pomelo Farm", region: "Cai Lay, Tien Giang", distanceKm: 95, product: "Pomelo", variety: "Da xanh", quantityKg: 2400, allocatedKg: 0, grade: "A", plot: "Garden 3", harvestDay: -1, readyDay: 0, sellByDay: 10, status: "ready" },
  { code: "N-420", producer: "Cao Lanh Mango Cooperative", region: "Cao Lanh, Dong Thap", distanceKm: 160, product: "Mango", variety: "Cat Hoa Loc", quantityKg: 1600, allocatedKg: 0, grade: "A", plot: "Orchard 1", harvestDay: 2, readyDay: 3, sellByDay: 8, status: "expected" },
  { code: "R-512", producer: "Cam Lam Mango Growers", region: "Cam Lam, Khanh Hoa", distanceKm: 380, product: "Mango", variety: "Cat Chu", quantityKg: 1100, allocatedKg: 0, grade: "B", plot: "Orchard 6", harvestDay: 1, readyDay: 2, sellByDay: 7, status: "expected" },
  { code: "K-310", producer: "Krong Pac Highland Farm", region: "Krong Pac, Dak Lak", distanceKm: 350, product: "Avocado", variety: "Booth 7", quantityKg: 1500, allocatedKg: 0, grade: "A", plot: "Slope 2", harvestDay: 3, readyDay: 4, sellByDay: 10, status: "expected" },
];

const greenBasket = { buyer: buyer.name, buyerType: buyer.type };

export const demands: MarketDemand[] = [
  ...buyerDemands.map((demand) => ({ ...demand, ...greenBasket })),
  { id: "D-540", buyer: "Phu Tho Wholesale Market", buyerType: "Wholesale market", product: "Dragon fruit", quantityKg: 3000, gradeWanted: "Grade A", neededByDay: 1, destination: "Phu Tho Wholesale Market, District 11", createdDay: -5 },
  { id: "D-548", buyer: "Saigon Fresh Kitchen", buyerType: "Restaurant group", product: "Mango", quantityKg: 600, gradeWanted: "Grade A–B", neededByDay: 3, destination: "District 1, Ho Chi Minh City", createdDay: -2 },
  { id: "D-560", buyer: "Mekong Export Co.", buyerType: "Exporter", product: "Dragon fruit", quantityKg: 4500, gradeWanted: "Grade A", neededByDay: 6, destination: "Cat Lai Port", createdDay: -1, note: "Export packing required" },
  { id: "D-562", buyer: "Binh Duong School Meals", buyerType: "Institutional", product: "Pomelo", quantityKg: 1500, gradeWanted: "Grade B", neededByDay: 10, destination: "Thu Dau Mot, Binh Duong", createdDay: -1 },
  // Nothing on the market fits these two: they show up under "No supply".
  { id: "D-575", buyer: "Saigon Fresh Kitchen", buyerType: "Restaurant group", product: "Avocado", quantityKg: 300, gradeWanted: "Grade A", neededByDay: 2, destination: "District 1, Ho Chi Minh City", createdDay: 0, note: "For a new menu launching this weekend" },
  { id: "D-578", buyer: "Da Lat Fresh Mart", buyerType: "Retail chain", product: "Durian", quantityKg: 1000, gradeWanted: "Grade A", neededByDay: 4, destination: "Thu Duc, Ho Chi Minh City", createdDay: 0 },
];

export const allocations: MarketAllocation[] = [
  ...buyerAllocations,
  // Matches the producer demo: B-102 is on hold for Phu Tho, waiting for Hoa Phat to confirm.
  // 3,000 kg needs sign-off, so the coordinator approved it.
  { id: "A-6", demandId: "D-540", batchCode: "B-102", producer: producer.name, kg: 3000, stage: "held", holdHoursLeft: 5, matchedBy: "coordinator" },
];

// S-296 is in both demos; keep the buyer's copy, which knows its producer and demand.
export const deliveries: MarketDelivery[] = [
  ...buyerDeliveries,
  ...producerDeliveries
    .filter((delivery) => !buyerDeliveries.some((item) => item.id === delivery.id))
    .map((delivery) => ({ ...delivery, producer: producer.name })),
];

/** Dispatch desks the coordinator calls. Producers and buyers never contact drivers directly. */
export const CARRIER_DESKS: Record<string, string> = {
  "Delta Cold Chain": "028 3812 4400",
  "SouthLine Logistics": "0252 3821 990",
};

export type RequestKind = "supply_issue" | "delivery_issue" | "find_buyer" | "question" | "verification";

export const REQUEST_KIND_LABEL: Record<RequestKind, string> = {
  supply_issue: "Supply problem",
  delivery_issue: "Delivery problem",
  find_buyer: "Find a buyer",
  question: "Question",
  verification: "Verification",
};

/** Something a producer, buyer or carrier raised that a person has to handle. */
export type HelpRequest = {
  id: string;
  kind: RequestKind;
  urgent: boolean;
  from: string;
  fromRole: "Producer" | "Buyer" | "Carrier";
  subject: string;
  detail: string;
  /** Hours since it was raised. */
  openedHoursAgo: number;
  link?: { label: string; to: string };
  /** A one-click fix for requests that need a decision rather than a note. */
  action?: RequestAction;
};

export type RequestAction =
  /** Mark the producer's business registration as checked. */
  | { kind: "verify"; producer: string }
  /** The producer will ship less than allocated: shrink the allocation so matching covers the rest. */
  | { kind: "shortfall"; allocationId: string; kg: number };

export const requests: HelpRequest[] = [
  {
    id: "R-901",
    kind: "supply_issue",
    urgent: true,
    from: "Muong Man Pomelo Cooperative",
    fromRole: "Producer",
    subject: "P-140 may ship 1,000 kg instead of 1,200 kg",
    detail: "Storm damage on part of the garden. The 1,200 kg allocated to GreenBasket (D-570) may come in 200 kg short.",
    openedHoursAgo: 3,
    link: { label: "Open matching", to: "/coordinator/matching?demand=D-570#demand-D-570" },
    action: { kind: "shortfall", allocationId: "A-3", kg: 200 },
  },
  {
    id: "R-902",
    kind: "delivery_issue",
    urgent: true,
    from: "SouthLine Logistics",
    fromRole: "Carrier",
    subject: "S-303 broke down near Ham Kiem",
    detail: "Replacement vehicle dispatched, new ETA tomorrow 09:00. Mekong Export has not been told yet.",
    openedHoursAgo: 4,
    link: { label: "Track S-303", to: "/coordinator/deliveries/S-303" },
  },
  {
    id: "R-903",
    kind: "delivery_issue",
    urgent: false,
    from: "GreenBasket Supermarkets",
    fromRole: "Buyer",
    subject: "S-305 picked up two hours late",
    detail: "The mango is for a weekend promotion. The buyer wants to know whether it will still arrive before 09:00 tomorrow.",
    openedHoursAgo: 2,
    link: { label: "Track S-305", to: "/coordinator/deliveries/S-305" },
  },
  {
    id: "R-904",
    kind: "find_buyer",
    urgent: false,
    from: producer.name,
    fromRole: "Producer",
    subject: "Find a buyer for B-112, 1,200 kg grade C mango",
    detail: "Ready in two days with four days of shelf life after that. No open demand accepts grade C; a juice or dried-fruit processor could take it.",
    openedHoursAgo: 20,
    link: { label: "See unmatched batches", to: "/coordinator/matching?tab=gaps" },
  },
  {
    id: "R-905",
    kind: "question",
    urgent: false,
    from: "Saigon Fresh Kitchen",
    fromRole: "Buyer",
    subject: "Avocado by the weekend?",
    detail: "D-575 needs 300 kg grade A in two days. The nearest avocado batch (L-077) is ready one day too late.",
    openedHoursAgo: 6,
    link: { label: "View D-575", to: "/coordinator/matching?tab=gaps#demand-D-575" },
  },
  {
    id: "R-906",
    kind: "verification",
    urgent: false,
    from: "Green Hills Farm",
    fromRole: "Producer",
    subject: "Business registration uploaded",
    detail: "Registration certificate and farm address uploaded. Check them so buyers see the producer as verified.",
    openedHoursAgo: 30,
    action: { kind: "verify", producer: "Green Hills Farm" },
  },
];
