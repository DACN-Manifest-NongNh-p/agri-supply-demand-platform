// Demo data for the logistics provider area. Replace with API calls once the backend exposes them.
// The provider is Delta Cold Chain, the carrier on S-301, S-307, S-296 and S-288 in the other
// areas, so the same delivery codes mean the same trips everywhere. Day values are offsets from today.
import type { RouteKey } from "../../Producer/data/routes";
import { deliveries as marketDeliveries, type MarketDelivery } from "../../Coordinator/data/mockCoordinator";

export type ProviderProfile = {
  name: string;
  legalName: string;
  taxCode: string;
  address: string;
  /** Dispatch desk: the number Farmora coordinators call. */
  dispatchPhone: string;
  email: string;
  memberSince: number;
  /** Business registration checked by Farmora. */
  verified: boolean;
};

export const provider: ProviderProfile = {
  name: "Delta Cold Chain",
  legalName: "Delta Cold Chain Logistics JSC",
  taxCode: "0312458967",
  address: "Lot B4, Tan Thuan Export Processing Zone, District 7, Ho Chi Minh City",
  dispatchPhone: "028 3812 4400",
  email: "dispatch@deltacoldchain.vn",
  memberSince: 2022,
  verified: true,
};

/** Who can do what in the provider's account. The backend enforces the same rules. */
export type TeamRole = "Owner" | "Dispatcher" | "Driver";

export type Permission = "orders" | "fleet" | "trips" | "incidents" | "account";

export const PERMISSION_LABEL: Record<Permission, string> = {
  orders: "Accept or decline transport orders",
  fleet: "Declare vehicles and capacity",
  trips: "Update delivery status",
  incidents: "Report incidents",
  account: "Edit company details and team",
};

export const ROLE_PERMISSIONS: Record<TeamRole, Permission[]> = {
  Owner: ["orders", "fleet", "trips", "incidents", "account"],
  Dispatcher: ["orders", "fleet", "trips", "incidents"],
  // Drivers only see and update the trips assigned to them.
  Driver: ["trips", "incidents"],
};

export type TeamMember = { id: string; name: string; email: string; role: TeamRole; status: "active" | "invited" };

export const team: TeamMember[] = [
  { id: "U-1", name: "Nguyen Thanh Son", email: "son.nguyen@deltacoldchain.vn", role: "Owner", status: "active" },
  { id: "U-2", name: "Do Thi Lan", email: "lan.do@deltacoldchain.vn", role: "Dispatcher", status: "active" },
  { id: "U-3", name: "Tran Van Minh", email: "minh.tran@deltacoldchain.vn", role: "Driver", status: "active" },
  { id: "U-4", name: "Vo Thanh Long", email: "long.vo@deltacoldchain.vn", role: "Driver", status: "active" },
  { id: "U-5", name: "Pham Quoc Bao", email: "bao.pham@deltacoldchain.vn", role: "Driver", status: "active" },
];

/** Regular trucks carry fruit that keeps at ambient temperature; refrigerated ones hold 2–8 °C. */
export const VEHICLE_TYPES = ["Refrigerated", "Regular"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const isRefrigerated = (type: VehicleType) => type === "Refrigerated";

export type Vehicle = {
  plate: string;
  type: VehicleType;
  capacityKg: number;
  base: string;
  driver?: string;
  /** Days the vehicle is on a Farmora trip. */
  bookedDays: number[];
  /** Days the provider marked it unavailable (maintenance, other clients). */
  offDays: number[];
};

export const fleet: Vehicle[] = [
  { plate: "51C-482.19", type: "Refrigerated", capacityKg: 5000, base: "District 7, Ho Chi Minh City", driver: "Tran Van Minh", bookedDays: [0], offDays: [] },
  { plate: "51C-611.08", type: "Refrigerated", capacityKg: 3500, base: "District 7, Ho Chi Minh City", driver: "Vo Thanh Long", bookedDays: [0, 1], offDays: [] },
  { plate: "51D-203.77", type: "Refrigerated", capacityKg: 1500, base: "District 7, Ho Chi Minh City", driver: "Pham Quoc Bao", bookedDays: [], offDays: [5, 6] },
  { plate: "51D-118.40", type: "Refrigerated", capacityKg: 2500, base: "Phan Thiet, Binh Thuan", bookedDays: [], offDays: [0, 1, 2] },
  { plate: "51C-730.52", type: "Regular", capacityKg: 8000, base: "Phan Thiet, Binh Thuan", driver: "Nguyen Van Hai", bookedDays: [], offDays: [] },
];

export const PROVINCES = ["Binh Thuan", "Ho Chi Minh City", "Dong Nai", "Binh Duong", "Lam Dong", "Tien Giang", "Dong Thap", "Khanh Hoa", "Dak Lak"] as const;

export const serviceAreas: string[] = ["Binh Thuan", "Ho Chi Minh City", "Dong Nai"];

/** A corridor the provider runs regularly, in either direction. */
export type OperatingRoute = { from: string; to: string };

export const operatingRoutes: OperatingRoute[] = [
  { from: "Binh Thuan", to: "Ho Chi Minh City" },
  { from: "Binh Thuan", to: "Dong Nai" },
];

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** When the provider takes pickups and drop-offs. `days` uses Date.getDay(): 0 is Sunday. */
export type OperatingSchedule = { days: number[]; from: string; to: string };

export const schedule: OperatingSchedule = { days: [1, 2, 3, 4, 5, 6], from: "04:00", to: "22:00" };

type Stop = { place: string; short: string; province: string; day: number; window: string };

export type OrderStatus = "new" | "accepted" | "declined";

/**
 * A transport order Farmora offers the provider once a producer confirmed an allocation.
 * The provider accepts it (with a vehicle) or declines it; then it goes to the next carrier.
 */
export type TransportOrder = {
  id: string;
  demandId: string;
  batch: string;
  product: string;
  quantityKg: number;
  producer: string;
  buyer: string;
  needsCold: boolean;
  pickup: Stop;
  dropoff: Stop;
  distanceKm: number;
  routeKey: RouteKey;
  /** What the provider is paid, in VND. */
  payVnd: number;
  /** Hours left to respond before Farmora offers it to the next carrier. */
  respondWithinHours: number;
  note?: string;
  status: OrderStatus;
  vehiclePlate?: string;
  driver?: string;
  deliveryId?: string;
  declineReason?: string;
};

export const orders: TransportOrder[] = [
  {
    id: "TO-714",
    demandId: "D-540",
    batch: "B-102",
    product: "Dragon fruit",
    quantityKg: 3000,
    producer: "Hoa Phat Dragon Fruit Cooperative",
    buyer: "Phu Tho Wholesale Market",
    needsCold: true,
    pickup: { place: "Hoa Phat packhouse, Ham Thuan Nam", short: "Ham Thuan Nam", province: "Binh Thuan", day: 0, window: "14:00–16:00" },
    dropoff: { place: "Phu Tho Wholesale Market, District 11", short: "District 11, HCMC", province: "Ho Chi Minh City", day: 1, window: "by 04:00" },
    distanceKm: 205,
    routeKey: "district1",
    payVnd: 9_600_000,
    respondWithinHours: 3,
    note: "Night delivery to the wholesale market gate.",
    status: "new",
  },
  {
    id: "TO-711",
    demandId: "D-551",
    batch: "B-104",
    product: "Dragon fruit",
    quantityKg: 2000,
    producer: "Hoa Phat Dragon Fruit Cooperative",
    buyer: "GreenBasket Supermarkets",
    needsCold: true,
    pickup: { place: "Hoa Phat packhouse, Ham Thuan Nam", short: "Ham Thuan Nam", province: "Binh Thuan", day: 1, window: "05:00–07:00" },
    dropoff: { place: "GreenBasket DC, District 7", short: "District 7, HCMC", province: "Ho Chi Minh City", day: 2, window: "by 09:00" },
    distanceKm: 210,
    routeKey: "district7",
    payVnd: 6_900_000,
    respondWithinHours: 5,
    status: "new",
  },
  {
    id: "TO-712",
    demandId: "D-565",
    batch: "M-331",
    product: "Mango",
    quantityKg: 600,
    producer: "Thuan Nam Mango Growers",
    buyer: "GreenBasket Supermarkets",
    needsCold: true,
    pickup: { place: "Thuan Nam Mango Growers, Orchard 2", short: "Thuan Nam", province: "Binh Thuan", day: 2, window: "06:00–08:00" },
    dropoff: { place: "GreenBasket DC, District 7", short: "District 7, HCMC", province: "Ho Chi Minh City", day: 3, window: "by 09:00" },
    distanceKm: 205,
    routeKey: "district7",
    payVnd: 2_600_000,
    respondWithinHours: 18,
    status: "new",
  },
  {
    id: "TO-715",
    demandId: "D-560",
    batch: "B-107",
    product: "Dragon fruit",
    quantityKg: 4500,
    producer: "Hoa Phat Dragon Fruit Cooperative",
    buyer: "Mekong Export Co.",
    needsCold: true,
    pickup: { place: "Hoa Phat packhouse, Ham Thuan Nam", short: "Ham Thuan Nam", province: "Binh Thuan", day: 4, window: "05:00–07:00" },
    dropoff: { place: "Cat Lai Port, Thu Duc", short: "Cat Lai Port", province: "Ho Chi Minh City", day: 5, window: "by 12:00" },
    distanceKm: 200,
    routeKey: "catlai",
    payVnd: 12_400_000,
    respondWithinHours: 30,
    note: "Export packing, 180 cartons. Container cut-off at the port 14:00.",
    status: "new",
  },
  {
    id: "TO-706",
    demandId: "D-558",
    batch: "H-209",
    product: "Dragon fruit",
    quantityKg: 1500,
    producer: "Ham Kiem Green Farm",
    buyer: "GreenBasket Supermarkets",
    needsCold: true,
    pickup: { place: "Ham Kiem Green Farm packhouse", short: "Ham Kiem", province: "Binh Thuan", day: 0, window: "06:00–08:00" },
    dropoff: { place: "GreenBasket DC, District 7", short: "District 7, HCMC", province: "Ho Chi Minh City", day: 1, window: "by 09:00" },
    distanceKm: 195,
    routeKey: "district7",
    payVnd: 5_400_000,
    respondWithinHours: 0,
    status: "accepted",
    vehiclePlate: "51C-611.08",
    driver: "Vo Thanh Long",
    deliveryId: "S-307",
  },
  {
    id: "TO-703",
    demandId: "D-548",
    batch: "N-420",
    product: "Mango",
    quantityKg: 600,
    producer: "Cao Lanh Mango Cooperative",
    buyer: "Saigon Fresh Kitchen",
    needsCold: true,
    pickup: { place: "Cao Lanh Mango Cooperative, Orchard 1", short: "Cao Lanh", province: "Dong Thap", day: 3, window: "06:00–08:00" },
    dropoff: { place: "Saigon Fresh Kitchen, District 1", short: "District 1, HCMC", province: "Ho Chi Minh City", day: 3, window: "by 14:00" },
    distanceKm: 160,
    routeKey: "district1",
    payVnd: 2_300_000,
    respondWithinHours: 0,
    status: "declined",
    declineReason: "Outside our service areas",
  },
];

/** Trips Farmora assigned to this provider, from the shared demo deliveries. */
export const trips: MarketDelivery[] = marketDeliveries.filter((delivery) => delivery.carrier === provider.name);

export const DECLINE_REASONS = ["No suitable vehicle free", "Outside our areas or routes", "Pickup or delivery time does not work", "Rate too low", "Other"];

export const INCIDENT_TYPES = ["Vehicle breakdown", "Running late", "Temperature out of range", "Accident", "Goods damaged", "Other"];
