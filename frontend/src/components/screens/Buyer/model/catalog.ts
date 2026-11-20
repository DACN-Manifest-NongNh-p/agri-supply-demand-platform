// Farmora catalogs the buyer picks from (crops, varieties, grades, zones, certifications) and the
// labels for every status. Matching compares these codes, never free text (B3.3 §7.5.1).
import type {
  AuctionAllocationStatus,
  AuctionStatus,
  BidStatus,
  BusinessType,
  CriteriaType,
  DemandStatus,
  DocumentType,
  Mechanism,
  MatchStatus,
  NegotiationStatus,
  OrderStatus,
  ProposalStatus,
  QualityGrade,
  RepresentativeType,
  SessionStatus,
  SessionType,
  TransactionStatus,
  VerificationStatus,
  AwardAllocationStatus,
} from "./types";

export const CROPS: { name: string; varieties: string[] }[] = [
  { name: "Dragon fruit", varieties: ["Red flesh", "White flesh"] },
  { name: "Mango", varieties: ["Cat Hoa Loc", "Cat Chu"] },
  { name: "Pomelo", varieties: ["Da xanh", "Nam Roi"] },
  { name: "Avocado", varieties: ["Booth 7", "034"] },
  { name: "Durian", varieties: ["Ri6", "Monthong"] },
  { name: "Rambutan", varieties: ["Java", "Thai"] },
  { name: "Longan", varieties: ["Huong Chi", "Xuong Com Vang"] },
  { name: "Lychee", varieties: ["Thieu Thanh Ha", "Hung Long"] },
  { name: "Mangosteen", varieties: ["Lai Thieu"] },
  { name: "Banana", varieties: ["Cavendish", "Laba"] },
  { name: "Pineapple", varieties: ["Queen", "MD2"] },
];

export const varietiesOf = (crop: string) => CROPS.find((item) => item.name === crop)?.varieties ?? [];

/** A is the best grade; "meets the grade" means equal or better (B3.3 §7.5.1). */
export const GRADES: QualityGrade[] = ["A", "B", "C"];
export const GRADE_LABEL: Record<QualityGrade, string> = { A: "Grade A", B: "Grade B", C: "Grade C" };
export const meetsGrade = (offered: QualityGrade, required: QualityGrade) => GRADES.indexOf(offered) <= GRADES.indexOf(required);

export const CERTIFICATIONS = ["VietGAP", "GlobalG.A.P.", "Organic", "HACCP"];

/** Standardised delivery zones. */
export const ZONES: { code: string; label: string }[] = [
  { code: "SE-HCM", label: "Ho Chi Minh City area" },
  { code: "SE-DNI", label: "Dong Nai – Binh Duong" },
  { code: "SC-BTH", label: "Binh Thuan" },
  { code: "CH-LDG", label: "Lam Dong" },
  { code: "MK-CTO", label: "Can Tho – Mekong" },
  { code: "N-HNI", label: "Ha Noi area" },
];

export const zoneLabel = (code: string) => ZONES.find((zone) => zone.code === code)?.label ?? code;

/** Shipping routes Farmora operates: which supply zones can deliver to which receiving zone (A-04). */
const ROUTES: Record<string, string[]> = {
  "SE-HCM": ["SE-HCM", "SE-DNI", "SC-BTH", "CH-LDG", "MK-CTO"],
  "SE-DNI": ["SE-HCM", "SE-DNI", "SC-BTH", "CH-LDG"],
  "SC-BTH": ["SC-BTH", "SE-HCM", "SE-DNI"],
  "CH-LDG": ["CH-LDG", "SE-HCM"],
  "MK-CTO": ["MK-CTO", "SE-HCM"],
  "N-HNI": ["N-HNI"],
};

export const canDeliver = (supplyZone: string, receivingZone: string) => ROUTES[receivingZone]?.includes(supplyZone) ?? false;

export const PROVINCES = ["Ho Chi Minh City", "Dong Nai", "Binh Duong", "Long An", "Binh Thuan", "Lam Dong", "Can Tho", "Khanh Hoa", "Da Nang", "Ha Noi"];

/** Supplier regions a demand can be limited to (supplier scope). */
export const SUPPLY_REGIONS = ["Binh Thuan", "Lam Dong", "Dong Thap", "Tien Giang", "Ben Tre", "Can Tho", "Dak Lak"];

export const BUSINESS_TYPE_LABEL: Record<BusinessType, string> = {
  PROCESSING_COMPANY: "Processing company",
  DISTRIBUTOR: "Distributor",
  WHOLESALER: "Wholesaler",
  RETAILER: "Retailer",
  FOOD_SERVICE: "Food service (restaurant, hotel, catering)",
  EXPORTER: "Exporter",
  COOPERATIVE: "Cooperative",
  HOUSEHOLD_BUSINESS: "Household business",
  OTHER: "Other",
};

/** A household business has no enterprise registration number (A-04); every other type does. */
export const needsRegistrationNumber = (type: BusinessType) => type !== "HOUSEHOLD_BUSINESS";

export const REPRESENTATIVE_TYPE_LABEL: Record<RepresentativeType, string> = {
  LEGAL_REPRESENTATIVE: "Legal representative",
  AUTHORIZED_REPRESENTATIVE: "Authorised representative",
};

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  BUSINESS_REGISTRATION: "Business registration certificate",
  TAX_DOCUMENT: "Tax document",
  REPRESENTATIVE_DOCUMENT: "Representative ID document",
  AUTHORIZATION_DOCUMENT: "Letter of authorisation",
  OTHER: "Other document",
};

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  NOT_SUBMITTED: "Not submitted",
  PENDING_VERIFICATION: "Waiting for review",
  UNDER_REVIEW: "Under review",
  NEEDS_ADDITIONAL_INFORMATION: "Needs more information",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

export const MECHANISM_LABEL: Record<Mechanism, string> = {
  BUYER_LED_PROCUREMENT: "Procurement",
  SUPPLIER_LED_AUCTION: "Auction",
  ORDER_MATCHING: "Order matching",
};

export const TRANSACTION_LABEL: Record<TransactionStatus, string> = {
  CONFIRMED: "Confirmed",
  PENDING_TERM_SHEET: "Term sheet in progress",
  PENDING_CONTRACT: "Contract in progress",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const DEMAND_LABEL: Record<DemandStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Receiving proposals",
  CLOSED: "Closed, ready to evaluate",
  UNDER_EVALUATION: "Under evaluation",
  AWARDED: "Awarded",
  CANCELLED: "Cancelled",
  NO_PROPOSAL: "No proposals",
};

export const PROPOSAL_LABEL: Record<ProposalStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  SELECTED: "Selected",
  NOT_SELECTED: "Not selected",
  WITHDRAWN: "Withdrawn",
  INVALID: "Invalid",
};

export const NEGOTIATION_LABEL: Record<NegotiationStatus, string> = {
  PENDING: "Waiting for answer",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  COUNTERED: "Countered",
  WITHDRAWN: "Withdrawn",
};

export const AWARD_ALLOCATION_LABEL: Record<AwardAllocationStatus, string> = {
  PENDING_SUPPLIER_CONFIRMATION: "Waiting for supplier",
  CONFIRMED: "Supplier confirmed",
  DECLINED: "Supplier declined",
};

export const CRITERIA_LABEL: Record<CriteriaType, string> = {
  PRICE: "Price",
  QUALITY: "Quality",
  CAPACITY: "Supply capacity",
  DELIVERY_TIME: "Delivery time",
};

export const AUCTION_LABEL: Record<AuctionStatus, string> = {
  SCHEDULED: "Scheduled",
  ACTIVE: "Open for bids",
  ENDED: "Ended, supplier choosing",
  PENDING_CONFIRMATION: "Waiting for buyer confirmation",
  COMPLETED: "Completed",
  NO_WINNER: "No winner",
  CANCELLED: "Cancelled",
};

export const BID_LABEL: Record<BidStatus, string> = {
  SUBMITTED: "Submitted",
  WITHDRAWN: "Withdrawn",
  ACCEPTED: "Selected, confirm it",
  REJECTED: "Not selected",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

export const AUCTION_ALLOCATION_LABEL: Record<AuctionAllocationStatus, string> = {
  PENDING_CONFIRMATION: "Waiting for you",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  RELEASED: "Released",
};

export const ORDER_LABEL: Record<OrderStatus, string> = {
  OPEN: "Open",
  PARTIALLY_FILLED: "Partly filled",
  FILLED: "Filled",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export const SESSION_LABEL: Record<SessionStatus, string> = {
  SCHEDULED: "Scheduled",
  COLLECTING: "Taking orders",
  CLOSED: "Book closed",
  PROCESSING: "Matching",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export const SESSION_TYPE_LABEL: Record<SessionType, string> = { MORNING: "Morning", MIDDAY: "Midday", AFTERNOON: "Afternoon" };

export const MATCH_LABEL: Record<MatchStatus, string> = {
  PENDING_CONFIRMATION: "Waiting for both sides",
  PARTIALLY_CONFIRMED: "One side confirmed",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

/** Default delivery zone for a province, so a saved delivery point fills the zone in. */
export function zoneForProvince(province: string) {
  const map: Record<string, string> = {
    "Ho Chi Minh City": "SE-HCM",
    "Long An": "SE-HCM",
    "Dong Nai": "SE-DNI",
    "Binh Duong": "SE-DNI",
    "Ba Ria - Vung Tau": "SE-DNI",
    "Binh Thuan": "SC-BTH",
    "Lam Dong": "CH-LDG",
    "Can Tho": "MK-CTO",
    "Ha Noi": "N-HNI",
  };
  return map[province] ?? "SE-HCM";
}
