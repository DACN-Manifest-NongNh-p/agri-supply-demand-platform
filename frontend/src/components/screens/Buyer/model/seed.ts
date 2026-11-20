// Demo data for the buyer area, one example of every state the BRDs define, all relative to now so
// the demo always looks current. Supplier names match the producer directory (data/producers.ts).
import { addDays, DAY, formatDate, formatDateRange, HOUR, MINUTE, slotsOn, todayIso } from "./time";
import type {
  Auction,
  AuctionAllocation,
  AwardAllocation,
  Bid,
  BookOrder,
  BuyerProfile,
  BuyOrder,
  ClearingPrice,
  Demand,
  MatchingSession,
  MatchResult,
  Proposal,
  SupplyLot,
  Transaction,
} from "./types";

const now = Date.now();
const today = todayIso();
const d = (days: number) => addDays(today, days);
const ago = (ms: number) => now - ms;

export const SELF = "GreenBasket Supermarkets";
export const DC = "GreenBasket DC, Lot C2, Tan Thuan EPZ, District 7, Ho Chi Minh City";

export const seedProfile: BuyerProfile = {
  businessName: SELF,
  businessType: "RETAILER",
  registrationNumber: "0314 552 908",
  taxCode: "0314552908",
  industry: "Food retail",
  description: "Supermarket chain with 42 stores in Ho Chi Minh City and the south-east.",
  website: "greenbasket.vn",
  businessEmail: "sourcing@greenbasket.vn",
  businessPhone: "028 3775 1200",
  country: "Viet Nam",
  province: "Ho Chi Minh City",
  ward: "Tan Thuan Dong",
  streetAddress: "Lot C2, Tan Thuan Export Processing Zone, District 7",
  representativeName: "Tran Minh Anh",
  representativePosition: "Fresh produce sourcing director",
  representativeEmail: "anh.tran@greenbasket.vn",
  representativePhone: "0903 112 458",
  representativeType: "AUTHORIZED_REPRESENTATIVE",
  procurementCategories: ["Dragon fruit", "Mango", "Pomelo", "Avocado"],
  preferredRegions: ["Binh Thuan", "Lam Dong"],
  expectedVolume: "40–60 t per month",
  procurementFrequency: "Several times a week",
  documents: [
    { id: "DOC-1", type: "BUSINESS_REGISTRATION", fileName: "greenbasket-business-registration.pdf", uploadedAt: ago(40 * DAY), review: { status: "ACCEPTED" } },
    { id: "DOC-2", type: "AUTHORIZATION_DOCUMENT", fileName: "authorisation-tran-minh-anh.pdf", uploadedAt: ago(40 * DAY), review: { status: "ACCEPTED", note: "Valid until 31 Dec 2027." } },
  ],
  status: "VERIFIED",
  verifiedAt: ago(37 * DAY),
  history: [
    { at: ago(41 * DAY), by: "BUYER", action: "Profile created" },
    { at: ago(40 * DAY), by: "BUYER", action: "Submitted for verification" },
    { at: ago(39 * DAY), by: "COORDINATOR", action: "Review started" },
    { at: ago(38 * DAY), by: "COORDINATOR", action: "Business verified", note: "Matches the national business registry." },
    { at: ago(37 * DAY), by: "COORDINATOR", action: "Representative verified", note: "Authorisation signed by the legal representative." },
  ],
};

export const seedLots: SupplyLot[] = [
  { code: "SL-DF-104", supplier: "Hoa Phat Dragon Fruit Cooperative", region: "Ham Thuan Nam, Binh Thuan", zone: "SC-BTH", crop: "Dragon fruit", variety: "Red flesh", grade: "A", qualityEvidence: "DOCUMENT_VERIFIED", certifications: ["VietGAP"], puc: "PUC-BTH-0412", quantity: 5200, available: 2600, unit: "kg", availableFrom: d(0), availableUntil: d(6), status: "PARTIALLY_RESERVED" },
  { code: "SL-DF-107", supplier: "Hoa Phat Dragon Fruit Cooperative", region: "Ham Thuan Nam, Binh Thuan", zone: "SC-BTH", crop: "Dragon fruit", variety: "White flesh", grade: "A", qualityEvidence: "DOCUMENT_VERIFIED", certifications: ["VietGAP"], puc: "PUC-BTH-0412", quantity: 5000, available: 5000, unit: "kg", availableFrom: d(3), availableUntil: d(10), status: "PUBLISHED" },
  { code: "SL-DF-215", supplier: "Ham Kiem Green Farm", region: "Ham Kiem, Binh Thuan", zone: "SC-BTH", crop: "Dragon fruit", variety: "Red flesh", grade: "B", qualityEvidence: "SELF_DECLARED", certifications: [], quantity: 3000, available: 1800, unit: "kg", availableFrom: d(1), availableUntil: d(7), status: "PARTIALLY_RESERVED" },
  { code: "SL-MG-331", supplier: "Thuan Nam Mango Growers", region: "Thuan Nam, Binh Thuan", zone: "SC-BTH", crop: "Mango", variety: "Cat Hoa Loc", grade: "A", qualityEvidence: "DOCUMENT_VERIFIED", certifications: ["VietGAP", "GlobalG.A.P."], puc: "PUC-BTH-0377", quantity: 3500, available: 1500, unit: "kg", availableFrom: d(0), availableUntil: d(5), status: "PARTIALLY_RESERVED" },
  { code: "SL-MG-334", supplier: "Thuan Nam Mango Growers", region: "Thuan Nam, Binh Thuan", zone: "SC-BTH", crop: "Mango", variety: "Cat Chu", grade: "B", qualityEvidence: "SELF_DECLARED", certifications: ["VietGAP"], quantity: 1800, available: 900, unit: "kg", availableFrom: d(1), availableUntil: d(7), status: "PARTIALLY_RESERVED" },
  { code: "SL-MG-118", supplier: "Green Hills Farm", region: "Tanh Linh, Binh Thuan", zone: "SC-BTH", crop: "Mango", variety: "Cat Hoa Loc", grade: "B", qualityEvidence: "SELF_DECLARED", certifications: [], quantity: 1400, available: 1400, unit: "kg", availableFrom: d(1), availableUntil: d(6), status: "PUBLISHED" },
  { code: "SL-PO-140", supplier: "Muong Man Pomelo Cooperative", region: "Muong Man, Binh Thuan", zone: "SC-BTH", crop: "Pomelo", variety: "Da xanh", grade: "A", qualityEvidence: "DOCUMENT_VERIFIED", certifications: ["VietGAP"], puc: "PUC-BTH-0290", quantity: 4000, available: 2000, unit: "kg", availableFrom: d(1), availableUntil: d(12), status: "PARTIALLY_RESERVED" },
  { code: "SL-PO-110", supplier: "Bac Binh Citrus Farm", region: "Bac Binh, Binh Thuan", zone: "SC-BTH", crop: "Pomelo", variety: "Da xanh", grade: "B", qualityEvidence: "SELF_DECLARED", certifications: [], quantity: 3200, available: 3200, unit: "kg", availableFrom: d(4), availableUntil: d(14), status: "PUBLISHED" },
  { code: "SL-AV-077", supplier: "Lam Ha Avocado Cooperative", region: "Lam Ha, Lam Dong", zone: "CH-LDG", crop: "Avocado", variety: "Booth 7", grade: "A", qualityEvidence: "DOCUMENT_VERIFIED", certifications: ["VietGAP"], puc: "PUC-LDG-1180", quantity: 1800, available: 1200, unit: "kg", availableFrom: d(2), availableUntil: d(9), status: "PARTIALLY_RESERVED" },
  { code: "SL-AV-079", supplier: "Lam Ha Avocado Cooperative", region: "Lam Ha, Lam Dong", zone: "CH-LDG", crop: "Avocado", variety: "034", grade: "B", qualityEvidence: "SELF_DECLARED", certifications: [], quantity: 600, available: 600, unit: "kg", availableFrom: d(5), availableUntil: d(11), status: "PUBLISHED" },
];

// ── B3.1 ──

const criteria = [
  { type: "PRICE" as const, weight: 40 },
  { type: "QUALITY" as const, weight: 30 },
  { type: "CAPACITY" as const, weight: 20 },
  { type: "DELIVERY_TIME" as const, weight: 10 },
];

const base = { unit: "kg" as const, deliveryLocation: DC, requiredCertifications: [] as string[], criteria: [] as Demand["criteria"] };

export const seedDemands: Demand[] = [
  {
    ...base,
    code: "DM-0601",
    crop: "Avocado",
    variety: "Booth 7",
    productDescription: "Booth 7 avocado, 250–350 g, for the ready-to-eat shelf",
    quantity: 800,
    qualityStandard: "A",
    qualityNotes: "Ripens in 3–4 days after delivery",
    deliveryFrom: d(9),
    deliveryTo: d(11),
    status: "DRAFT",
    createdAt: ago(2 * HOUR),
    history: [{ at: ago(2 * HOUR), by: "BUYER", action: "Draft created" }],
  },
  {
    ...base,
    code: "DM-0598",
    crop: "Dragon fruit",
    variety: "Red flesh",
    productDescription: "Red-flesh dragon fruit, 350 g and up, export packing",
    quantity: 3000,
    qualityStandard: "A",
    deliveryFrom: d(4),
    deliveryTo: d(6),
    budget: 82_000_000,
    requiredCertifications: ["VietGAP"],
    title: "Red-flesh dragon fruit for the Tet promotion",
    description: "3 t of red-flesh dragon fruit for 42 stores; VietGAP required. Delivery to our District 7 DC between 05:00 and 10:00.",
    scope: { kind: "REGIONS", regions: ["Binh Thuan"] },
    submissionDeadline: now + 6 * HOUR,
    criteria,
    status: "PUBLISHED",
    createdAt: ago(2 * DAY),
    publishedAt: ago(DAY + 20 * HOUR),
    history: [
      { at: ago(2 * DAY), by: "BUYER", action: "Draft created" },
      { at: ago(DAY + 20 * HOUR), by: "BUYER", action: "Published" },
    ],
  },
  {
    ...base,
    code: "DM-0592",
    crop: "Mango",
    variety: "Cat Hoa Loc",
    productDescription: "Cat Hoa Loc mango, 400–500 g, ripe on arrival",
    quantity: 2000,
    qualityStandard: "A",
    deliveryFrom: d(3),
    deliveryTo: d(4),
    title: "Cat Hoa Loc mango for the weekend promotion",
    description: "2 t of Cat Hoa Loc mango for the weekend promotion in District 7 and District 4 stores.",
    scope: { kind: "ALL" },
    submissionDeadline: ago(3 * HOUR),
    criteria,
    status: "CLOSED",
    createdAt: ago(4 * DAY),
    publishedAt: ago(3 * DAY),
    closedAt: ago(3 * HOUR),
    history: [
      { at: ago(4 * DAY), by: "BUYER", action: "Draft created" },
      { at: ago(3 * DAY), by: "BUYER", action: "Published" },
      { at: ago(3 * HOUR), by: "SYSTEM", action: "Closed at the submission deadline", note: "3 proposals received" },
    ],
  },
  {
    ...base,
    code: "DM-0587",
    crop: "Pomelo",
    variety: "Da xanh",
    productDescription: "Da xanh pomelo, 1.2–1.8 kg, green skin",
    quantity: 4000,
    deliveryFrom: d(5),
    deliveryTo: d(8),
    commercialTerms: "Delivered to our DC, unloaded",
    title: "Da xanh pomelo for December",
    description: "4 t of Da xanh pomelo for December, any grade from B up.",
    scope: { kind: "ALL" },
    submissionDeadline: ago(DAY),
    criteria: [],
    status: "UNDER_EVALUATION",
    createdAt: ago(6 * DAY),
    publishedAt: ago(5 * DAY),
    closedAt: ago(DAY),
    history: [
      { at: ago(6 * DAY), by: "BUYER", action: "Draft created" },
      { at: ago(5 * DAY), by: "BUYER", action: "Published" },
      { at: ago(DAY), by: "SYSTEM", action: "Closed at the submission deadline", note: "3 proposals received" },
      { at: ago(20 * HOUR), by: "BUYER", action: "Evaluation started" },
    ],
  },
  {
    ...base,
    code: "DM-0575",
    crop: "Dragon fruit",
    productDescription: "Dragon fruit, any flesh colour, 300 g and up",
    quantity: 2000,
    qualityStandard: "B",
    deliveryFrom: d(1),
    deliveryTo: d(3),
    title: "Dragon fruit for regular stock",
    description: "Weekly stock for all stores.",
    scope: { kind: "ALL" },
    submissionDeadline: ago(3 * DAY),
    criteria,
    status: "AWARDED",
    createdAt: ago(8 * DAY),
    publishedAt: ago(7 * DAY),
    closedAt: ago(3 * DAY),
    history: [
      { at: ago(8 * DAY), by: "BUYER", action: "Draft created" },
      { at: ago(7 * DAY), by: "BUYER", action: "Published" },
      { at: ago(3 * DAY), by: "SYSTEM", action: "Closed at the submission deadline" },
      { at: ago(3 * DAY - HOUR), by: "BUYER", action: "Evaluation started" },
      { at: ago(2 * DAY), by: "BUYER", action: "Award confirmed", note: "2 proposals selected, 2,200 kg" },
    ],
  },
  {
    ...base,
    code: "DM-0569",
    crop: "Durian",
    variety: "Ri6",
    productDescription: "Ri6 durian, 2–4 kg, 80% ripe",
    quantity: 600,
    deliveryFrom: d(2),
    deliveryTo: d(4),
    title: "Ri6 durian trial",
    description: "Trial order of Ri6 durian for 5 stores.",
    scope: { kind: "ALL" },
    submissionDeadline: ago(2 * DAY),
    criteria: [],
    status: "NO_PROPOSAL",
    createdAt: ago(7 * DAY),
    publishedAt: ago(6 * DAY),
    closedAt: ago(2 * DAY),
    history: [
      { at: ago(7 * DAY), by: "BUYER", action: "Draft created" },
      { at: ago(6 * DAY), by: "BUYER", action: "Published" },
      { at: ago(2 * DAY), by: "SYSTEM", action: "Closed at the submission deadline", note: "No proposals received" },
    ],
  },
  {
    ...base,
    code: "DM-0560",
    crop: "Mango",
    productDescription: "Mango for juice bar",
    quantity: 500,
    deliveryFrom: d(-2),
    deliveryTo: d(-1),
    title: "Mango for the juice bar",
    description: "Juice-grade mango.",
    scope: { kind: "ALL" },
    submissionDeadline: ago(6 * DAY),
    criteria: [],
    status: "CANCELLED",
    cancelReason: "The juice bar opening was postponed.",
    createdAt: ago(10 * DAY),
    publishedAt: ago(9 * DAY),
    history: [
      { at: ago(10 * DAY), by: "BUYER", action: "Draft created" },
      { at: ago(9 * DAY), by: "BUYER", action: "Published" },
      { at: ago(7 * DAY), by: "BUYER", action: "Cancelled", note: "The juice bar opening was postponed." },
    ],
  },
];

const proposal = (p: Omit<Proposal, "negotiations" | "agreed" | "deliveryLocation" | "deliveryMethod"> & Partial<Proposal>): Proposal => ({
  deliveryLocation: DC,
  deliveryMethod: "Refrigerated truck, supplier arranges",
  negotiations: [],
  agreed: { price: p.unitPrice, quantity: p.quantity, terms: p.additionalTerms },
  ...p,
});

export const seedProposals: Proposal[] = [
  // DM-0598 (still receiving)
  proposal({ code: "PR-2210", demandCode: "DM-0598", supplier: "Hoa Phat Dragon Fruit Cooperative", lotCode: "SL-DF-104", quantity: 2000, unitPrice: 26_500, qualityDescription: "Grade A, 350–450 g, VietGAP", qualityEvidence: "DOCUMENT_VERIFIED", deliveryDate: d(4), evidence: [{ type: "Certificate", name: "VietGAP-HoaPhat-2026.pdf" }], status: "SUBMITTED", submittedAt: ago(20 * HOUR) }),
  proposal({ code: "PR-2214", demandCode: "DM-0598", supplier: "Ham Kiem Green Farm", lotCode: "SL-DF-215", quantity: 1500, unitPrice: 24_000, qualityDescription: "Grade B, 300–400 g", qualityEvidence: "SELF_DECLARED", deliveryDate: d(5), evidence: [], status: "SUBMITTED", submittedAt: ago(5 * HOUR) }),
  // DM-0592 (closed, ready to evaluate)
  proposal({ code: "PR-2190", demandCode: "DM-0592", supplier: "Thuan Nam Mango Growers", lotCode: "SL-MG-331", quantity: 1500, unitPrice: 38_000, qualityDescription: "Grade A, 420–500 g, VietGAP + GlobalG.A.P.", qualityEvidence: "DOCUMENT_VERIFIED", deliveryDate: d(3), evidence: [{ type: "Certificate", name: "GlobalGAP-ThuanNam.pdf" }, { type: "Photo", name: "orchard-2-harvest.jpg" }], status: "SUBMITTED", submittedAt: ago(2 * DAY) }),
  proposal({ code: "PR-2193", demandCode: "DM-0592", supplier: "Green Hills Farm", lotCode: "SL-MG-118", quantity: 1200, unitPrice: 34_500, qualityDescription: "Grade B, 380–450 g", qualityEvidence: "SELF_DECLARED", deliveryDate: d(4), evidence: [{ type: "Photo", name: "block-c.jpg" }], status: "SUBMITTED", submittedAt: ago(DAY + 4 * HOUR) }),
  proposal({ code: "PR-2196", demandCode: "DM-0592", supplier: "Thuan Nam Mango Growers", lotCode: "SL-MG-334", quantity: 900, unitPrice: 31_000, qualityDescription: "Cat Chu, grade B", qualityEvidence: "SELF_DECLARED", deliveryDate: d(3), evidence: [], status: "INVALID", invalidReason: "Lot variety Cat Chu does not match the demanded Cat Hoa Loc.", submittedAt: ago(DAY) }),
  // DM-0587 (under evaluation, negotiations running)
  proposal({
    code: "PR-2170",
    demandCode: "DM-0587",
    supplier: "Muong Man Pomelo Cooperative",
    lotCode: "SL-PO-140",
    quantity: 2000,
    unitPrice: 35_000,
    qualityDescription: "Grade A, 1.4–1.8 kg",
    qualityEvidence: "DOCUMENT_VERIFIED",
    deliveryDate: d(5),
    evidence: [{ type: "Certificate", name: "VietGAP-MuongMan.pdf" }],
    status: "UNDER_REVIEW",
    submittedAt: ago(3 * DAY),
    negotiations: [{ round: 1, by: "BUYER", price: 33_500, note: "Can you meet 33,500 for the full 2 t?", status: "PENDING", at: ago(2 * HOUR) }],
  }),
  proposal({
    code: "PR-2174",
    demandCode: "DM-0587",
    supplier: "Bac Binh Citrus Farm",
    lotCode: "SL-PO-110",
    quantity: 3000,
    unitPrice: 32_000,
    qualityDescription: "Grade B, 1.2–1.6 kg",
    qualityEvidence: "SELF_DECLARED",
    deliveryDate: d(6),
    evidence: [],
    status: "UNDER_REVIEW",
    submittedAt: ago(2 * DAY),
    negotiations: [
      { round: 1, by: "BUYER", price: 30_000, note: "30,000 if you deliver on day one of the window?", status: "COUNTERED", at: ago(18 * HOUR), respondedAt: ago(10 * HOUR) },
      { round: 2, by: "SUPPLIER", price: 31_000, terms: "Delivery on the first day of the window", note: "31,000 and we deliver on the first day.", status: "PENDING", at: ago(10 * HOUR) },
    ],
  }),
  proposal({ code: "PR-2178", demandCode: "DM-0587", supplier: "Muong Man Pomelo Cooperative", lotCode: "SL-PO-140", quantity: 800, unitPrice: 36_000, qualityDescription: "Grade A, gift boxes of 2", qualityEvidence: "DOCUMENT_VERIFIED", deliveryDate: d(7), evidence: [], status: "WITHDRAWN", submittedAt: ago(4 * DAY) }),
  // DM-0575 (awarded)
  proposal({ code: "PR-2150", demandCode: "DM-0575", supplier: "Ham Kiem Green Farm", lotCode: "SL-DF-215", quantity: 1200, unitPrice: 22_000, qualityDescription: "Grade B, 300–400 g", qualityEvidence: "SELF_DECLARED", deliveryDate: d(1), evidence: [], status: "SELECTED", submittedAt: ago(5 * DAY) }),
  proposal({
    code: "PR-2153",
    demandCode: "DM-0575",
    supplier: "Hoa Phat Dragon Fruit Cooperative",
    lotCode: "SL-DF-107",
    quantity: 1000,
    unitPrice: 25_500,
    qualityDescription: "Grade A white flesh",
    qualityEvidence: "DOCUMENT_VERIFIED",
    deliveryDate: d(3),
    evidence: [{ type: "Certificate", name: "VietGAP-HoaPhat-2026.pdf" }],
    status: "SELECTED",
    submittedAt: ago(4 * DAY),
    negotiations: [{ round: 1, by: "BUYER", price: 25_000, status: "ACCEPTED", at: ago(2 * DAY + 5 * HOUR), respondedAt: ago(2 * DAY + 2 * HOUR) }],
    agreed: { price: 25_000, quantity: 1000 },
  }),
  proposal({ code: "PR-2156", demandCode: "DM-0575", supplier: "Green Hills Farm", lotCode: "SL-MG-118", quantity: 800, unitPrice: 23_500, qualityDescription: "Grade C", qualityEvidence: "SELF_DECLARED", deliveryDate: d(2), evidence: [], status: "NOT_SELECTED", submittedAt: ago(4 * DAY) }),
];

export const seedAwardAllocations: AwardAllocation[] = [
  { id: "AA-701", demandCode: "DM-0575", proposalCode: "PR-2150", supplier: "Ham Kiem Green Farm", lotCode: "SL-DF-215", quantity: 1200, price: 22_000, negotiated: false, status: "CONFIRMED", createdAt: ago(2 * DAY), deadline: ago(DAY), respondedAt: ago(2 * DAY - 3 * HOUR) },
  { id: "AA-702", demandCode: "DM-0575", proposalCode: "PR-2153", supplier: "Hoa Phat Dragon Fruit Cooperative", lotCode: "SL-DF-107", quantity: 1000, price: 25_000, negotiated: true, status: "PENDING_SUPPLIER_CONFIRMATION", createdAt: ago(2 * HOUR), deadline: now + 22 * HOUR },
];

// ── B3.2 ──

export const seedAuctions: Auction[] = [
  { code: "AU-311", name: "Red-flesh dragon fruit, Plot 5", supplier: "Hoa Phat Dragon Fruit Cooperative", lotCode: "SL-DF-104", crop: "Dragon fruit", variety: "Red flesh", grade: "A", zone: "SC-BTH", quantity: 1500, minBidQuantity: 200, startingPrice: 25_000, startTime: ago(5 * HOUR), endTime: now + 3 * HOUR, deliveryLocation: "Hoa Phat packhouse, Ham Thuan Nam", deliveryTerms: "Ex-packhouse; buyer arranges pickup within 2 days", status: "ACTIVE" },
  { code: "AU-314", name: "Booth 7 avocado, Hill 3", supplier: "Lam Ha Avocado Cooperative", lotCode: "SL-AV-077", crop: "Avocado", variety: "Booth 7", grade: "A", zone: "CH-LDG", quantity: 600, minBidQuantity: 100, startingPrice: 42_000, startTime: ago(DAY), endTime: now + 40 * MINUTE, deliveryLocation: "Delivered to buyer's DC in HCMC", deliveryTerms: "Refrigerated truck included", status: "ACTIVE" },
  { code: "AU-318", name: "Da xanh pomelo, Plot 7", supplier: "Bac Binh Citrus Farm", lotCode: "SL-PO-110", crop: "Pomelo", variety: "Da xanh", grade: "B", zone: "SC-BTH", quantity: 1200, minBidQuantity: 300, startingPrice: 29_000, startTime: now + 5 * HOUR, endTime: now + 29 * HOUR, deliveryLocation: "Bac Binh farm gate", status: "SCHEDULED" },
  { code: "AU-305", name: "Cat Hoa Loc mango, Orchard 2", supplier: "Thuan Nam Mango Growers", lotCode: "SL-MG-331", crop: "Mango", variety: "Cat Hoa Loc", grade: "A", zone: "SC-BTH", quantity: 1000, minBidQuantity: 200, startingPrice: 35_000, startTime: ago(2 * DAY), endTime: ago(6 * HOUR), endedAt: ago(6 * HOUR), endReason: "End time reached", deliveryLocation: "Delivered to buyer's DC in HCMC", status: "PENDING_CONFIRMATION" },
  { code: "AU-298", name: "White-flesh dragon fruit", supplier: "Hoa Phat Dragon Fruit Cooperative", lotCode: "SL-DF-107", crop: "Dragon fruit", variety: "White flesh", grade: "A", zone: "SC-BTH", quantity: 800, minBidQuantity: 100, startingPrice: 23_000, startTime: ago(6 * DAY), endTime: ago(5 * DAY), endedAt: ago(5 * DAY + 2 * HOUR), endReason: "Ended early by the supplier", deliveryLocation: "Hoa Phat packhouse", status: "COMPLETED" },
  { code: "AU-301", name: "Cat Chu mango, Orchard 4", supplier: "Thuan Nam Mango Growers", lotCode: "SL-MG-334", crop: "Mango", variety: "Cat Chu", grade: "B", zone: "SC-BTH", quantity: 600, minBidQuantity: 100, startingPrice: 27_000, startTime: ago(4 * DAY), endTime: ago(3 * DAY), endedAt: ago(3 * DAY), endReason: "End time reached", deliveryLocation: "Farm gate", status: "COMPLETED" },
];

export const seedBids: Bid[] = [
  { code: "BID-9120", auctionCode: "AU-311", price: 26_500, quantity: 800, deliveryPreference: "Pickup on day 1", status: "SUBMITTED", submittedAt: ago(3 * HOUR), history: [{ at: ago(4 * HOUR), by: "BUYER", action: "Bid submitted", note: "26,000 VND/kg × 800 kg" }, { at: ago(3 * HOUR), by: "BUYER", action: "Bid updated", note: "26,500 VND/kg × 800 kg" }] },
  { code: "BID-9081", auctionCode: "AU-305", price: 37_000, quantity: 600, status: "ACCEPTED", submittedAt: ago(DAY), history: [{ at: ago(DAY), by: "BUYER", action: "Bid submitted", note: "37,000 VND/kg × 600 kg" }, { at: ago(5 * HOUR), by: "SUPPLIER", action: "Bid selected", note: "500 kg allocated" }] },
  { code: "BID-9002", auctionCode: "AU-298", price: 24_500, quantity: 500, status: "CONFIRMED", submittedAt: ago(5 * DAY + 6 * HOUR), history: [{ at: ago(5 * DAY + 6 * HOUR), by: "BUYER", action: "Bid submitted" }, { at: ago(5 * DAY), by: "SUPPLIER", action: "Bid selected", note: "500 kg" }, { at: ago(4 * DAY + 20 * HOUR), by: "BUYER", action: "Result confirmed" }] },
  { code: "BID-9040", auctionCode: "AU-301", price: 27_500, quantity: 400, status: "REJECTED", submittedAt: ago(3 * DAY + 5 * HOUR), history: [{ at: ago(3 * DAY + 5 * HOUR), by: "BUYER", action: "Bid submitted" }, { at: ago(2 * DAY + 20 * HOUR), by: "SUPPLIER", action: "Not selected" }] },
];

export const seedAuctionAllocations: AuctionAllocation[] = [
  { id: "AL-5301", auctionCode: "AU-305", bidCode: "BID-9081", quantity: 500, acceptedPrice: 37_000, deadline: now + 18 * HOUR, status: "PENDING_CONFIRMATION", createdAt: ago(5 * HOUR) },
  { id: "AL-5280", auctionCode: "AU-298", bidCode: "BID-9002", quantity: 500, acceptedPrice: 24_500, deadline: ago(4 * DAY), status: "CONFIRMED", createdAt: ago(5 * DAY), respondedAt: ago(4 * DAY + 20 * HOUR) },
];

// ── B3.3 ──

const history = (at: number, action: string, note?: string) => ({ at, by: "BUYER" as const, action, note });

export const seedBuyOrders: BuyOrder[] = [
  { code: "BO-1042", crop: "Dragon fruit", variety: "Red flesh", grade: "A", requested: 1500, remaining: 1500, unit: "kg", maxPrice: 27_000, certifications: ["VietGAP"], deliveryLocation: DC, zone: "SE-HCM", deliveryStart: d(1), deliveryEnd: d(3), timeInForce: "DAY", priorityTime: ago(50 * MINUTE), status: "OPEN", createdAt: ago(50 * MINUTE), history: [history(ago(50 * MINUTE), "CREATED")] },
  { code: "BO-1039", crop: "Mango", grade: "B", requested: 2000, remaining: 800, unit: "kg", maxPrice: 33_000, certifications: [], deliveryLocation: DC, zone: "SE-HCM", deliveryStart: d(1), deliveryEnd: d(5), timeInForce: "GTC", validUntil: d(5), priorityTime: ago(2 * DAY), status: "PARTIALLY_FILLED", createdAt: ago(2 * DAY), history: [history(ago(2 * DAY), "CREATED"), { at: ago(DAY + 3 * HOUR), by: "SYSTEM", action: "PARTIALLY_FILLED", note: "700 kg in yesterday's afternoon session" }, { at: ago(3 * HOUR), by: "SYSTEM", action: "PARTIALLY_FILLED", note: "500 kg in today's last session" }] },
  { code: "BO-1031", crop: "Pomelo", variety: "Da xanh", grade: "A", requested: 1000, remaining: 0, unit: "kg", maxPrice: 36_000, certifications: [], deliveryLocation: DC, zone: "SE-HCM", deliveryStart: d(-1), deliveryEnd: d(2), timeInForce: "GTC", validUntil: d(2), priorityTime: ago(3 * DAY), status: "FILLED", createdAt: ago(3 * DAY), history: [history(ago(3 * DAY), "CREATED"), { at: ago(2 * DAY + 6 * HOUR), by: "SYSTEM", action: "FILLED", note: "1,000 kg at 34,500" }] },
  { code: "BO-1027", crop: "Avocado", grade: "A", requested: 400, remaining: 400, unit: "kg", maxPrice: 39_000, certifications: [], deliveryLocation: DC, zone: "SE-HCM", deliveryStart: d(-1), deliveryEnd: d(1), timeInForce: "DAY", priorityTime: ago(DAY + 5 * HOUR), status: "EXPIRED", createdAt: ago(DAY + 5 * HOUR), history: [history(ago(DAY + 5 * HOUR), "CREATED"), { at: ago(DAY - 8 * HOUR), by: "SYSTEM", action: "EXPIRED", note: "End of the trading day, nothing matched below 39,000" }] },
  { code: "BO-1020", crop: "Dragon fruit", grade: "B", requested: 600, remaining: 600, unit: "kg", maxPrice: 21_000, certifications: [], deliveryLocation: DC, zone: "SE-HCM", deliveryStart: d(-3), deliveryEnd: d(-1), timeInForce: "DAY", priorityTime: ago(4 * DAY), status: "CANCELLED", createdAt: ago(4 * DAY), history: [history(ago(4 * DAY), "CREATED"), history(ago(4 * DAY - HOUR), "CANCELLED", "Covered by a procurement award")] },
];

/** Everyone else's open orders in the book. Their limit prices never reach the buyer's screens. */
export const seedBook: BookOrder[] = [
  { code: "SO-5501", side: "SELL", owner: "Hoa Phat Dragon Fruit Cooperative", lotCode: "SL-DF-104", crop: "Dragon fruit", variety: "Red flesh", grade: "A", zone: "SC-BTH", remaining: 1100, limitPrice: 25_800, certifications: ["VietGAP"], from: d(0), until: d(6), priorityTime: ago(6 * HOUR) },
  { code: "SO-5504", side: "SELL", owner: "Ham Kiem Green Farm", lotCode: "SL-DF-215", crop: "Dragon fruit", variety: "Red flesh", grade: "B", zone: "SC-BTH", remaining: 1200, limitPrice: 21_500, certifications: [], from: d(1), until: d(7), priorityTime: ago(5 * HOUR) },
  { code: "SO-5510", side: "SELL", owner: "Thuan Nam Mango Growers", lotCode: "SL-MG-334", crop: "Mango", variety: "Cat Chu", grade: "B", zone: "SC-BTH", remaining: 900, limitPrice: 30_500, certifications: ["VietGAP"], from: d(1), until: d(7), priorityTime: ago(DAY) },
  { code: "SO-5512", side: "SELL", owner: "Green Hills Farm", lotCode: "SL-MG-118", crop: "Mango", variety: "Cat Hoa Loc", grade: "B", zone: "SC-BTH", remaining: 600, limitPrice: 32_000, certifications: [], from: d(1), until: d(6), priorityTime: ago(4 * HOUR) },
  { code: "SO-5520", side: "SELL", owner: "Lam Ha Avocado Cooperative", lotCode: "SL-AV-079", crop: "Avocado", variety: "034", grade: "B", zone: "CH-LDG", remaining: 600, limitPrice: 36_000, certifications: [], from: d(5), until: d(11), priorityTime: ago(2 * HOUR) },
  { code: "BX-3301", side: "BUY", owner: "Mekong Export Co.", crop: "Dragon fruit", variety: "Red flesh", grade: "A", zone: "SE-HCM", remaining: 800, limitPrice: 27_500, certifications: ["VietGAP"], from: d(1), until: d(4), priorityTime: ago(3 * HOUR) },
  { code: "BX-3307", side: "BUY", owner: "Saigon Fresh Mart", crop: "Mango", grade: "B", zone: "SE-HCM", remaining: 500, limitPrice: 31_000, certifications: [], from: d(1), until: d(4), priorityTime: ago(90 * MINUTE) },
];

const yesterday = slotsOn(d(-1));
const todaySlots = slotsOn(today);

export const seedSessions: MatchingSession[] = [
  ...yesterday.map((slot, index) => ({ ...slot, status: "COMPLETED" as const, buyOrders: [14, 11, 9][index], sellOrders: [12, 10, 8][index], matchedQuantity: [8200, 5400, 3900][index] })),
  ...todaySlots.filter((slot) => slot.scheduled < now).map((slot) => ({ ...slot, status: "COMPLETED" as const, buyOrders: 12, sellOrders: 10, matchedQuantity: 6100 })),
];

const lastToday = seedSessions[seedSessions.length - 1];

/** Earlier sessions of each group, oldest first, so the market page can show a trend. */
const priceHistory = (crop: string, variety: string | undefined, grade: "A" | "B", values: number[]): ClearingPrice[] =>
  values.map((price, index) => {
    const slot = slotsOn(d(-4 + Math.floor(index / 2)))[index % 2 === 0 ? 0 : 2];
    return { sessionCode: slot.code, crop, variety, grade, zone: "SE-HCM", price, volume: 400 + ((index * 370) % 1600), at: slot.scheduled };
  });

export const seedPrices: ClearingPrice[] = [
  ...priceHistory("Mango", undefined, "B", [30_200, 30_600, 30_400, 31_000, 31_200, 30_900]),
  ...priceHistory("Dragon fruit", "Red flesh", "A", [27_400, 27_100, 26_800, 26_900, 26_500, 26_400]),
  ...priceHistory("Avocado", undefined, "A", [41_000, 41_500, 42_000, 41_800, 42_400, 42_600]),
  ...priceHistory("Pomelo", "Da xanh", "A", [33_000, 33_400, 33_800, 34_000, 34_200, 34_300]),
  { sessionCode: yesterday[0].code, crop: "Pomelo", variety: "Da xanh", grade: "A", zone: "SE-HCM", price: 34_500, volume: 1000, at: yesterday[0].scheduled },
  { sessionCode: yesterday[1].code, crop: "Dragon fruit", variety: "Red flesh", grade: "A", zone: "SE-HCM", price: 26_200, volume: 2400, at: yesterday[1].scheduled },
  { sessionCode: yesterday[2].code, crop: "Mango", grade: "B", zone: "SE-HCM", price: 31_500, volume: 700, at: yesterday[2].scheduled },
  { sessionCode: lastToday.code, crop: "Mango", grade: "B", zone: "SE-HCM", price: 31_800, volume: 500, at: lastToday.scheduled },
  { sessionCode: lastToday.code, crop: "Dragon fruit", variety: "Red flesh", grade: "A", zone: "SE-HCM", price: 26_000, volume: 1800, at: lastToday.scheduled },
  { sessionCode: lastToday.code, crop: "Avocado", grade: "A", zone: "SE-HCM", price: 43_000, volume: 300, at: lastToday.scheduled },
];

export const seedMatches: MatchResult[] = [
  { code: "MR-8840", sessionCode: lastToday.code, buyOrderCode: "BO-1039", sellOrderCode: "SO-5498", supplier: "Thuan Nam Mango Growers", lotCode: "SL-MG-334", crop: "Mango", variety: "Cat Chu", grade: "B", quantity: 500, clearingPrice: 31_800, total: 500 * 31_800, buyer: "PENDING", supplierSide: "CONFIRMED", status: "PARTIALLY_CONFIRMED", deadline: lastToday.scheduled + 24 * HOUR, matchedAt: lastToday.scheduled },
  { code: "MR-8791", sessionCode: yesterday[2].code, buyOrderCode: "BO-1039", sellOrderCode: "SO-5470", supplier: "Green Hills Farm", lotCode: "SL-MG-118", crop: "Mango", variety: "Cat Hoa Loc", grade: "B", quantity: 700, clearingPrice: 31_500, total: 700 * 31_500, buyer: "CONFIRMED", supplierSide: "CONFIRMED", status: "CONFIRMED", deadline: yesterday[2].scheduled + 24 * HOUR, matchedAt: yesterday[2].scheduled, confirmedAt: yesterday[2].scheduled + 2 * HOUR },
  { code: "MR-8702", sessionCode: yesterday[0].code, buyOrderCode: "BO-1031", sellOrderCode: "SO-5433", supplier: "Muong Man Pomelo Cooperative", lotCode: "SL-PO-140", crop: "Pomelo", variety: "Da xanh", grade: "A", quantity: 1000, clearingPrice: 34_500, total: 1000 * 34_500, buyer: "CONFIRMED", supplierSide: "CONFIRMED", status: "CONFIRMED", deadline: yesterday[0].scheduled + 24 * HOUR, matchedAt: yesterday[0].scheduled, confirmedAt: yesterday[0].scheduled + HOUR },
];

// ── Transactions ──

export const seedTransactions: Transaction[] = [
  { code: "TX-3011", mechanism: "ORDER_MATCHING", sourceRef: "MR-8702", sourceParent: "BO-1031", supplier: "Muong Man Pomelo Cooperative", lotCode: "SL-PO-140", crop: "Pomelo", variety: "Da xanh", quantity: 1000, unit: "kg", price: 34_500, total: 34_500_000, qualityTerms: "Grade A, document-verified", deliveryTerms: `To ${DC}, ${formatDateRange(d(-1), d(2))}`, buyerConfirmedAt: yesterday[0].scheduled + 30 * MINUTE, supplierConfirmedAt: yesterday[0].scheduled + HOUR, status: "ACTIVE", createdAt: yesterday[0].scheduled + HOUR, deliveryId: "S-305" },
  { code: "TX-3008", mechanism: "BUYER_LED_PROCUREMENT", sourceRef: "AA-701", sourceParent: "DM-0575", supplier: "Ham Kiem Green Farm", lotCode: "SL-DF-215", crop: "Dragon fruit", variety: "Red flesh", quantity: 1200, unit: "kg", price: 22_000, total: 26_400_000, qualityTerms: "Grade B, 300–400 g, self-declared", deliveryTerms: `To ${DC} on ${formatDate(d(1))}`, buyerConfirmedAt: ago(2 * DAY), supplierConfirmedAt: ago(2 * DAY - 3 * HOUR), status: "PENDING_CONTRACT", createdAt: ago(2 * DAY - 3 * HOUR), deliveryId: "S-307" },
  { code: "TX-3004", mechanism: "SUPPLIER_LED_AUCTION", sourceRef: "AL-5280", sourceParent: "AU-298", supplier: "Hoa Phat Dragon Fruit Cooperative", lotCode: "SL-DF-107", crop: "Dragon fruit", variety: "White flesh", quantity: 500, unit: "kg", price: 24_500, total: 12_250_000, qualityTerms: "Grade A, document-verified", deliveryTerms: "Ex-packhouse, Ham Thuan Nam", buyerConfirmedAt: ago(4 * DAY + 20 * HOUR), supplierConfirmedAt: ago(5 * DAY), status: "COMPLETED", createdAt: ago(4 * DAY + 20 * HOUR) },
  { code: "TX-3013", mechanism: "ORDER_MATCHING", sourceRef: "MR-8791", sourceParent: "BO-1039", supplier: "Green Hills Farm", lotCode: "SL-MG-118", crop: "Mango", variety: "Cat Hoa Loc", quantity: 700, unit: "kg", price: 31_500, total: 22_050_000, qualityTerms: "Grade B, self-declared", deliveryTerms: `To ${DC}, ${formatDateRange(d(1), d(5))}`, buyerConfirmedAt: yesterday[2].scheduled + HOUR, supplierConfirmedAt: yesterday[2].scheduled + 2 * HOUR, status: "PENDING_TERM_SHEET", createdAt: yesterday[2].scheduled + 2 * HOUR },
];
