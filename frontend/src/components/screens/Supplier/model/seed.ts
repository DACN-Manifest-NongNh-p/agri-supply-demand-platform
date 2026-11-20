// Demo data for the supplier "Hoa Phat Dragon Fruit Cooperative" (the same cooperative buyers see on
// the market). Dates are relative to now so the demo always has something live.
import { addDays, DAY, HOUR, MINUTE, slotsOn, todayIso } from "../../Buyer/model/time";
import type { Allocation, BuyerBid, MyAuction, MyProposal, OpenDemand, ProductionArea, ProductionPlan, SellOrder, SupplierMatch, SupplierProfile, SupplierTransaction, SupplyLot } from "./types";

export const SELF = "Hoa Phat Dragon Fruit Cooperative";

const now = Date.now();
const ago = (ms: number) => now - ms;
const d = (days: number) => addDays(todayIso(), days);
const year = new Date().getFullYear();

export const seedProfile: SupplierProfile = {
  type: "COOPERATIVE",
  name: SELF,
  contactName: "Nguyen Thi Hoa",
  phone: "0912 345 678",
  email: "hoa@hoaphat-coop.vn",
  address: "Thon 2, Ham Thuan Nam",
  province: "Binh Thuan",
  representative: "Nguyen Thi Hoa (Chair)",
  taxCode: "3401234567",
  registrationNumber: "HTX-BTH-0192",
  documents: [
    { id: "D-1", type: "Cooperative registration certificate", name: "htx-registration.pdf", uploadedAt: ago(40 * DAY) },
    { id: "D-2", type: "Representative ID", name: "cccd-hoa.jpg", uploadedAt: ago(40 * DAY) },
  ],
  status: "VERIFIED",
  history: [
    { at: ago(40 * DAY), by: "SUPPLIER", action: "Submitted for verification" },
    { at: ago(38 * DAY), by: "COORDINATOR", action: "Verified" },
  ],
};

export const seedAreas: ProductionArea[] = [
  {
    code: "PA-BTH-0412",
    name: "Plot 5 – Ham Thuan Nam",
    province: "Binh Thuan",
    commune: "Ham Minh",
    address: "Thon 2, Ham Minh, Ham Thuan Nam",
    lat: 10.889,
    lng: 107.995,
    hectares: 12,
    ownership: "Members' land, managed by the cooperative",
    crops: [
      { id: "C-1", crop: "Dragon fruit", variety: "Red flesh", hectares: 7, method: "VietGAP", season: "Year-round", plantingFrom: `${year - 3}-03-01`, harvestFrom: d(-20), expectedYield: 42_000 },
      { id: "C-2", crop: "Dragon fruit", variety: "White flesh", hectares: 4, method: "VietGAP", season: "Year-round", plantingFrom: `${year - 4}-03-01`, harvestFrom: d(-10), expectedYield: 26_000 },
    ],
    puc: "PUC-BTH-0412",
    pucVerified: true,
    documents: [
      { id: "D-3", type: "Land use certificate", name: "so-do-plot5.pdf", uploadedAt: ago(35 * DAY) },
      { id: "D-4", type: "VietGAP certificate", name: "vietgap-2026.pdf", uploadedAt: ago(35 * DAY) },
      { id: "D-5", type: "Field photos", name: "plot5-photos.zip", uploadedAt: ago(35 * DAY) },
    ],
    status: "VERIFIED",
    zone: "SC-BTH",
    createdAt: ago(35 * DAY),
    history: [
      { at: ago(35 * DAY), by: "SUPPLIER", action: "Declared" },
      { at: ago(30 * DAY), by: "COORDINATOR", action: "Verified", note: "Documents and PUC checked" },
    ],
  },
  {
    code: "PA-BTH-0455",
    name: "Hill plot – Ham Can",
    province: "Binh Thuan",
    commune: "Ham Can",
    address: "Ham Can, Ham Thuan Nam",
    lat: 10.951,
    lng: 107.871,
    hectares: 5,
    ownership: "Leased (10 years)",
    crops: [{ id: "C-3", crop: "Mango", variety: "Cat Chu", hectares: 4, method: "Conventional", season: "Dry season", plantingFrom: `${year - 2}-05-01`, harvestFrom: d(25), expectedYield: 18_000 }],
    pucVerified: false,
    documents: [{ id: "D-6", type: "Lease contract", name: "lease-ham-can.pdf", uploadedAt: ago(3 * DAY) }],
    status: "NEEDS_ADDITIONAL_INFORMATION",
    coordinatorNote: "Please add recent photos of the mango trees and the plot boundary.",
    zone: "SC-BTH",
    createdAt: ago(3 * DAY),
    history: [
      { at: ago(3 * DAY), by: "SUPPLIER", action: "Declared" },
      { at: ago(DAY), by: "COORDINATOR", action: "Needs more information", note: "Please add recent photos of the mango trees and the plot boundary." },
    ],
  },
];

export const seedPlans: ProductionPlan[] = [
  { code: "PP-2611", areaCode: "PA-BTH-0412", crop: "Dragon fruit", variety: "Red flesh", year, season: "Year-round", productionStart: d(-60), productionEnd: d(60), plantingDate: d(-60), hectares: 7, method: "VietGAP", productionType: "Open field", harvestStart: d(-20), harvestEnd: d(40), expectedQuantity: 42_000, unit: "kg", status: "DRAFT", createdAt: ago(60 * DAY) },
  { code: "PP-2614", areaCode: "PA-BTH-0412", crop: "Dragon fruit", variety: "White flesh", year, season: "Year-round", productionStart: d(-45), productionEnd: d(75), plantingDate: d(-45), hectares: 4, method: "VietGAP", productionType: "Open field", harvestStart: d(-10), harvestEnd: d(50), expectedQuantity: 26_000, unit: "kg", status: "DRAFT", createdAt: ago(45 * DAY) },
];

const lotBase = {
  areaCode: "PA-BTH-0412",
  partial: true,
  standards: ["VietGAP"],
  packaging: "Plastic crates",
  packSize: "20 kg per crate",
  storage: "Cool, shaded packhouse",
  storageTemp: "8–10 °C",
  deliveryLocation: "Hoa Phat packhouse, Ham Thuan Nam",
  deliveryMethod: "AGREED_CARRIER" as const,
};

export const seedLots: SupplyLot[] = [
  {
    ...lotBase,
    code: "SL-DF-104",
    planCode: "PP-2611",
    crop: "Dragon fruit",
    variety: "Red flesh",
    name: "Plot 5 red flesh, week 47",
    description: "Red-flesh dragon fruit, 400–550 g, bright skin, picked at full colour",
    grade: "A",
    harvestDate: d(-1),
    availableFrom: d(0),
    availableUntil: d(6),
    total: 5200,
    reserved: 1500,
    inTransaction: 1100,
    moq: 200,
    quality: { "Average weight": "400–550 g", "Skin colour": "Bright red, green bracts", Uniformity: "High", Surface: "No bruises or sunburn", Brix: "≥ 14" },
    evidence: [
      { id: "E-1", type: "PRODUCE_PHOTO", name: "df104-crates.jpg", uploadedAt: ago(DAY) },
      { id: "E-2", type: "CERTIFICATE", name: "vietgap-2026.pdf", uploadedAt: ago(DAY) },
    ],
    accuracyConfirmedAt: ago(DAY),
    askingPrice: 24_000,
    transport: "Refrigerated truck available on request",
    status: "PARTIALLY_RESERVED",
    createdAt: ago(2 * DAY),
    publishedAt: ago(DAY),
    versions: [{ number: 1, at: ago(DAY), reason: "Published", snapshot: "5,200 kg · Grade A · 24,000 ₫/kg" }],
  },
  {
    ...lotBase,
    code: "SL-DF-107",
    planCode: "PP-2614",
    crop: "Dragon fruit",
    variety: "White flesh",
    description: "White-flesh dragon fruit, 350–500 g, export packing possible",
    grade: "A",
    expectedHarvestDate: d(2),
    availableFrom: d(3),
    availableUntil: d(10),
    total: 5000,
    reserved: 0,
    inTransaction: 0,
    moq: 300,
    quality: { "Average weight": "350–500 g", "Skin colour": "Pink-red", Uniformity: "High", Surface: "Clean, intact", Brix: "≥ 12" },
    evidence: [{ id: "E-3", type: "PRODUCE_PHOTO", name: "df107-field.jpg", uploadedAt: ago(2 * DAY) }],
    accuracyConfirmedAt: ago(2 * DAY),
    status: "PUBLISHED",
    createdAt: ago(3 * DAY),
    publishedAt: ago(2 * DAY),
    versions: [{ number: 1, at: ago(2 * DAY), reason: "Published", snapshot: "5,000 kg · Grade A · no asking price" }],
  },
  {
    ...lotBase,
    code: "SL-DF-112",
    planCode: "PP-2611",
    crop: "Dragon fruit",
    variety: "Red flesh",
    description: "Red-flesh dragon fruit, second picking, 300–450 g",
    grade: "B",
    expectedHarvestDate: d(8),
    availableFrom: d(9),
    availableUntil: d(15),
    total: 3000,
    reserved: 0,
    inTransaction: 0,
    quality: { "Average weight": "300–450 g" },
    standards: [],
    evidence: [],
    status: "DRAFT",
    createdAt: ago(HOUR * 5),
    versions: [],
  },
];

const slots = slotsOn(d(-1));

export const seedSellOrders: SellOrder[] = [
  { code: "SO-2041", lotCode: "SL-DF-104", crop: "Dragon fruit", variety: "Red flesh", grade: "A", zone: "SC-BTH", offered: 1000, remaining: 400, minPrice: 23_000, availableFrom: d(0), availableUntil: d(5), deliveryTerms: "Ex-packhouse, carrier agreed", timeInForce: "GTC", validUntil: d(5), priorityTime: ago(2 * DAY), status: "PARTIALLY_FILLED", createdAt: ago(2 * DAY), history: [{ at: ago(2 * DAY), by: "SUPPLIER", action: "Placed" }, { at: slots[2].scheduled, by: "SYSTEM", action: "Matched 600 kg", note: `${slots[2].code} · 24,500 ₫/kg` }] },
];

export const seedMatches: SupplierMatch[] = [
  { code: "MR-8731", sessionCode: slots[2].code, sellOrderCode: "SO-2041", lotCode: "SL-DF-104", buyer: "Saigon Fresh Mart", crop: "Dragon fruit", variety: "Red flesh", grade: "A", quantity: 600, clearingPrice: 24_500, total: 14_700_000, deliveryLocation: "District 7, Ho Chi Minh City", deliveryWindow: `${d(1)} – ${d(3)}`, buyerSide: "CONFIRMED", supplier: "PENDING", status: "PARTIALLY_CONFIRMED", createdAt: slots[2].scheduled, deadline: slots[2].scheduled + 24 * HOUR },
];

export const seedDemands: OpenDemand[] = [
  { code: "DM-0598", buyer: "GreenBasket Supermarkets", title: "Red-flesh dragon fruit for the Tet promotion", crop: "Dragon fruit", variety: "Red flesh", grade: "A", quantity: 3000, deliveryFrom: d(4), deliveryTo: d(6), deliveryLocation: "GreenBasket DC, Tan Thuan EPZ, District 7, HCMC", certifications: ["VietGAP"], criteria: [{ type: "PRICE", weight: 40 }, { type: "QUALITY", weight: 30 }, { type: "CAPACITY", weight: 20 }, { type: "DELIVERY_TIME", weight: 10 }], deadline: now + 6 * HOUR, status: "PUBLISHED", notes: "350 g and up, export packing" },
  { code: "DM-0603", buyer: "Mekong Juice Co.", title: "Dragon fruit for juice processing", crop: "Dragon fruit", grade: "B", quantity: 8000, deliveryFrom: d(5), deliveryTo: d(12), deliveryLocation: "Mekong Juice factory, Long An", certifications: [], criteria: [{ type: "PRICE", weight: 60 }, { type: "CAPACITY", weight: 40 }], deadline: now + 2 * DAY, status: "PUBLISHED" },
  { code: "DM-0606", buyer: "Hanoi Fruit Hub", title: "White-flesh dragon fruit, weekly lots", crop: "Dragon fruit", variety: "White flesh", grade: "A", quantity: 2500, deliveryFrom: d(6), deliveryTo: d(9), deliveryLocation: "Long Bien market, Ha Noi", certifications: [], criteria: [], deadline: now + 30 * HOUR, status: "PUBLISHED" },
  { code: "DM-0587", buyer: "GreenBasket Supermarkets", title: "Mango Cat Hoa Loc, 2 tonnes", crop: "Mango", variety: "Cat Hoa Loc", grade: "A", quantity: 2000, deliveryFrom: d(3), deliveryTo: d(4), deliveryLocation: "GreenBasket DC, HCMC", certifications: [], criteria: [], deadline: now + 20 * HOUR, status: "PUBLISHED" },
  { code: "DM-0571", buyer: "Coastal Hotels Group", title: "Dragon fruit for hotel breakfasts", crop: "Dragon fruit", variety: "Red flesh", grade: "A", quantity: 800, deliveryFrom: d(2), deliveryTo: d(3), deliveryLocation: "Coastal Hotels central kitchen, Phan Thiet", certifications: [], criteria: [], deadline: ago(DAY), status: "AWARDED" },
];

export const seedProposals: MyProposal[] = [
  { code: "SP-5121", demandCode: "DM-0598", lotCode: "SL-DF-104", quantity: 1500, price: 23_800, deliveryDate: d(5), deliveryMethod: "SUPPLIER_DELIVERS", terms: "Delivered in crates, refrigerated", status: "SUBMITTED", submittedAt: ago(8 * HOUR), rounds: [], history: [{ at: ago(8 * HOUR), by: "SUPPLIER", action: "Submitted" }] },
  {
    code: "SP-5098",
    demandCode: "DM-0571",
    lotCode: "SL-DF-104",
    quantity: 800,
    price: 25_000,
    deliveryDate: d(2),
    deliveryMethod: "SUPPLIER_DELIVERS",
    status: "SELECTED",
    submittedAt: ago(4 * DAY),
    rounds: [{ round: 1, by: "BUYER", price: 24_000, note: "Can you meet 24,000 for 800 kg?", status: "PENDING", at: ago(3 * HOUR) }],
    history: [
      { at: ago(4 * DAY), by: "SUPPLIER", action: "Submitted" },
      { at: ago(5 * HOUR), by: "BUYER", action: "Selected" },
      { at: ago(3 * HOUR), by: "BUYER", action: "Proposed other terms", note: "24,000 ₫/kg" },
    ],
  },
];

export const seedAuctions: MyAuction[] = [
  { code: "AU-311", lotCode: "SL-DF-104", name: "Red-flesh dragon fruit, Plot 5", crop: "Dragon fruit", variety: "Red flesh", grade: "A", quantity: 1500, minBid: 200, startingPrice: 25_000, startTime: ago(5 * HOUR), endTime: now + 3 * HOUR, deliveryLocation: "Hoa Phat packhouse, Ham Thuan Nam", deliveryTerms: "Ex-packhouse; buyer arranges pickup within 2 days", status: "ACTIVE", history: [{ at: ago(6 * HOUR), by: "SUPPLIER", action: "Created" }, { at: ago(5 * HOUR), by: "SUPPLIER", action: "Published" }] },
  { code: "AU-306", lotCode: "SL-DF-104", name: "Red-flesh dragon fruit, first picking", crop: "Dragon fruit", variety: "Red flesh", grade: "A", quantity: 1100, minBid: 200, startingPrice: 24_000, startTime: ago(3 * DAY), endTime: ago(2 * DAY), endedAt: ago(2 * DAY), endReason: "Ended on time", deliveryLocation: "Hoa Phat packhouse, Ham Thuan Nam", status: "COMPLETED", history: [{ at: ago(3 * DAY), by: "SUPPLIER", action: "Published" }, { at: ago(2 * DAY), by: "SYSTEM", action: "Ended on time" }] },
];

export const seedBids: BuyerBid[] = [
  { code: "BD-901", auctionCode: "AU-311", buyer: "GreenBasket Supermarkets", price: 26_500, quantity: 800, submittedAt: ago(2 * HOUR), status: "SUBMITTED" },
  { code: "BD-902", auctionCode: "AU-311", buyer: "Saigon Fresh Mart", price: 25_800, quantity: 1000, note: "Pickup on day 2", submittedAt: ago(4 * HOUR), status: "SUBMITTED" },
  { code: "BD-903", auctionCode: "AU-311", buyer: "Mekong Juice Co.", price: 25_000, quantity: 1500, submittedAt: ago(90 * MINUTE), status: "SUBMITTED" },
  { code: "BD-880", auctionCode: "AU-306", buyer: "Saigon Fresh Mart", price: 25_200, quantity: 1100, submittedAt: ago(2.5 * DAY), status: "CONFIRMED" },
];

export const seedAllocations: Allocation[] = [{ id: "AL-77", auctionCode: "AU-306", bidCode: "BD-880", buyer: "Saigon Fresh Mart", quantity: 1100, price: 25_200, deadline: ago(DAY), status: "CONFIRMED", createdAt: ago(2 * DAY) }];

export const seedTransactions: SupplierTransaction[] = [
  { code: "TX-3015", mechanism: "SUPPLIER_LED_AUCTION", sourceRef: "AL-77", sourceParent: "AU-306", buyer: "Saigon Fresh Mart", lotCode: "SL-DF-104", crop: "Dragon fruit", variety: "Red flesh", quantity: 1100, price: 25_200, total: 27_720_000, deliveryTerms: "Ex-packhouse, pickup within 2 days", status: "ACTIVE", createdAt: ago(1.8 * DAY), deliveryId: "S-301" },
];
