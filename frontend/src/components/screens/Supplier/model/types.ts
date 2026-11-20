// Supplier domain, named after the Farmora BRDs (farmora_docs/analysis):
//   B0   0    onboarding and verification   → SupplierProfile, ProductionArea
//   B1   1    production planning           → ProductionPlan
//   B2   2    supply lot creation           → SupplyLot (+ quality, evidence, terms, versions)
//   B3.1 3.1  buyer-led procurement         → OpenDemand, MyProposal, AwardResult
//   B3.2 3.2  supplier-led auction          → MyAuction, BuyerBid, Allocation
//   B3.3 3.3  order matching                → SellOrder, SupplierMatch
// Farmora records trades; it never takes or moves money (BR-B3-07).
import type { HistoryEntry, QualityGrade, Mechanism, TransactionStatus, SessionType, TimeInForce, OrderStatus, MatchStatus, PartyConfirmation, NegotiationStatus, CriteriaType } from "../../Buyer/model/types";

export type { HistoryEntry, QualityGrade, Mechanism, TransactionStatus, SessionType, TimeInForce, OrderStatus, MatchStatus, PartyConfirmation, NegotiationStatus, CriteriaType };

// ── B0 ──────────────────────────────────────────────────────────────────────

/** Identity and each production area are verified separately (BR-B0-10). */
export type VerifyStatus = "NOT_SUBMITTED" | "PENDING_VERIFICATION" | "NEEDS_ADDITIONAL_INFORMATION" | "VERIFIED" | "REJECTED";

export type SupplierType = "INDIVIDUAL" | "HOUSEHOLD_BUSINESS" | "COOPERATIVE" | "ENTERPRISE";

export type SupplierDoc = { id: string; type: string; name: string; uploadedAt: number };

export type SupplierProfile = {
  type: SupplierType;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  representative?: string;
  idNumber?: string;
  taxCode?: string;
  registrationNumber?: string;
  documents: SupplierDoc[];
  status: VerifyStatus;
  coordinatorNote?: string;
  history: HistoryEntry[];
};

export type AreaCrop = {
  id: string;
  crop: string;
  variety: string;
  hectares: number;
  method: string;
  season: string;
  plantingFrom: string;
  harvestFrom: string;
  expectedYield: number;
};

export type ProductionArea = {
  code: string;
  name: string;
  province: string;
  commune: string;
  address: string;
  lat: number;
  lng: number;
  hectares: number;
  ownership: string;
  crops: AreaCrop[];
  puc?: string;
  /** Shown as verified only once the coordinator checked it (FR-B0-28). */
  pucVerified: boolean;
  documents: SupplierDoc[];
  status: VerifyStatus;
  coordinatorNote?: string;
  fieldCheck?: boolean;
  zone: string;
  createdAt: number;
  history: HistoryEntry[];
};

// ── B1 ──────────────────────────────────────────────────────────────────────

export type ProductionPlan = {
  code: string;
  areaCode: string;
  crop: string;
  variety: string;
  year: number;
  season: string;
  productionStart: string;
  productionEnd: string;
  plantingDate: string;
  hectares: number;
  method: string;
  productionType: string;
  harvestStart: string;
  harvestEnd: string;
  expectedQuantity: number;
  unit: "kg" | "ta" | "tan";
  notes?: string;
  risks?: string;
  status: "DRAFT";
  createdAt: number;
};

// ── B2 ──────────────────────────────────────────────────────────────────────

export type LotStatus = "DRAFT" | "PUBLISHED" | "PARTIALLY_RESERVED" | "FULLY_RESERVED" | "IN_TRANSACTION" | "COMPLETED" | "CANCELLED" | "EXPIRED";

export type DeliveryMethod = "SUPPLIER_DELIVERS" | "BUYER_PICKS_UP" | "AGREED_CARRIER";

export type Evidence = { id: string; type: "PRODUCE_PHOTO" | "HARVEST_VIDEO" | "LAB_RESULT" | "CERTIFICATE" | "OTHER"; name: string; uploadedAt: number };

export type LotVersion = { number: number; at: number; reason: string; snapshot: string };

export type SupplyLot = {
  code: string;
  planCode: string;
  areaCode: string;
  crop: string;
  variety: string;
  name?: string;
  description: string;
  grade: QualityGrade;
  harvestDate?: string;
  expectedHarvestDate?: string;
  availableFrom: string;
  availableUntil: string;
  total: number;
  /** Held for auctions, sell orders and results waiting for confirmation. */
  reserved: number;
  /** Part of confirmed transactions. available = total − reserved − inTransaction. */
  inTransaction: number;
  moq?: number;
  partial: boolean;
  quality: Record<string, string>;
  standards: string[];
  packaging: string;
  packSize: string;
  storage: string;
  storageTemp?: string;
  evidence: Evidence[];
  accuracyConfirmedAt?: number;
  askingPrice?: number;
  deliveryLocation: string;
  deliveryMethod?: DeliveryMethod;
  transport?: string;
  termsNote?: string;
  status: LotStatus;
  createdAt: number;
  publishedAt?: number;
  versions: LotVersion[];
  cancelReason?: string;
};

// ── B3.3 ────────────────────────────────────────────────────────────────────

export type SellOrder = {
  code: string;
  lotCode: string;
  crop: string;
  variety: string;
  grade: QualityGrade;
  zone: string;
  offered: number;
  remaining: number;
  minPrice: number;
  availableFrom: string;
  availableUntil: string;
  deliveryTerms?: string;
  timeInForce: TimeInForce;
  validUntil?: string;
  priorityTime: number;
  status: OrderStatus;
  createdAt: number;
  history: HistoryEntry[];
};

export type SupplierMatch = {
  code: string;
  sessionCode: string;
  sellOrderCode: string;
  lotCode: string;
  buyer: string;
  crop: string;
  variety: string;
  grade: QualityGrade;
  quantity: number;
  clearingPrice: number;
  total: number;
  deliveryLocation: string;
  deliveryWindow: string;
  buyerSide: PartyConfirmation;
  supplier: PartyConfirmation;
  status: MatchStatus;
  createdAt: number;
  deadline: number;
  reason?: string;
};

// ── B3.1 ────────────────────────────────────────────────────────────────────

export type OpenDemand = {
  code: string;
  buyer: string;
  title: string;
  crop: string;
  variety?: string;
  grade?: QualityGrade;
  quantity: number;
  deliveryFrom: string;
  deliveryTo: string;
  deliveryLocation: string;
  certifications: string[];
  criteria: { type: CriteriaType; weight: number }[];
  deadline: number;
  status: "PUBLISHED" | "CLOSED" | "UNDER_EVALUATION" | "AWARDED" | "CANCELLED";
  notes?: string;
};

export type ProposalStatus = "SUBMITTED" | "WITHDRAWN" | "UNDER_REVIEW" | "SELECTED" | "NOT_SELECTED" | "INVALID";

export type Round = { round: number; by: "BUYER" | "SUPPLIER"; price?: number; quantity?: number; note?: string; status: NegotiationStatus; at: number };

export type MyProposal = {
  code: string;
  demandCode: string;
  lotCode: string;
  quantity: number;
  price: number;
  deliveryDate: string;
  deliveryMethod: DeliveryMethod;
  terms?: string;
  status: ProposalStatus;
  submittedAt: number;
  rounds: Round[];
  history: HistoryEntry[];
  /** Set when the buyer confirmed an award with this proposal (FR-B3.1-34). */
  award?: { quantity: number; price: number; deadline: number; status: "PENDING_SUPPLIER_CONFIRMATION" | "CONFIRMED" | "DECLINED"; reason?: string };
};

// ── B3.2 ────────────────────────────────────────────────────────────────────

export type AuctionStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "ENDED" | "PENDING_CONFIRMATION" | "COMPLETED" | "NO_WINNER" | "CANCELLED";

export type MyAuction = {
  code: string;
  lotCode: string;
  name: string;
  description?: string;
  crop: string;
  variety: string;
  grade: QualityGrade;
  quantity: number;
  minBid: number;
  startingPrice: number;
  startTime: number;
  endTime: number;
  deliveryLocation: string;
  deliveryTerms?: string;
  conditions?: string;
  status: AuctionStatus;
  endedAt?: number;
  endReason?: string;
  cancelReason?: string;
  history: HistoryEntry[];
};

export type BuyerBid = {
  code: string;
  auctionCode: string;
  buyer: string;
  price: number;
  quantity: number;
  note?: string;
  submittedAt: number;
  status: "SUBMITTED" | "WITHDRAWN" | "ACCEPTED" | "REJECTED" | "CONFIRMED" | "DECLINED" | "EXPIRED";
};

export type Allocation = {
  id: string;
  auctionCode: string;
  bidCode: string;
  buyer: string;
  quantity: number;
  price: number;
  deadline: number;
  status: "PENDING_CONFIRMATION" | "CONFIRMED" | "DECLINED" | "EXPIRED";
  createdAt: number;
};

// ── B3 ──────────────────────────────────────────────────────────────────────

export type SupplierTransaction = {
  code: string;
  mechanism: Mechanism;
  sourceRef: string;
  sourceParent: string;
  buyer: string;
  lotCode: string;
  crop: string;
  variety: string;
  quantity: number;
  price: number;
  total: number;
  deliveryTerms: string;
  status: TransactionStatus;
  createdAt: number;
  deliveryId?: string;
};
