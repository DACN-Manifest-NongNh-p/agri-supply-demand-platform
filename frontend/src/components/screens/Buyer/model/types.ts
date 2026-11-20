// Buyer domain, named after the Farmora BRDs (farmora_docs/analysis):
//   B0-Buyer  0.1  registration and verification  → BuyerProfile
//   B3        3    shared trading rules            → Transaction
//   B3.1      3.1  buyer-led procurement           → Demand, SupplierProposal, Award
//   B3.2      3.2  supplier-led auction            → Auction, Bid, AuctionAllocation
//   B3.3      3.3  agricultural order matching     → BuyOrder, MatchingSession, MatchResult
// Farmora records trades and their state; it never takes or moves money (BR-B3-07).

/** Who did something, for the audit trail every entity keeps (FR-B3-06). */
export type Actor = "BUYER" | "SUPPLIER" | "SYSTEM" | "COORDINATOR";

export type HistoryEntry = {
  at: number;
  by: Actor;
  action: string;
  note?: string;
};

// ── B0-Buyer ────────────────────────────────────────────────────────────────

export type VerificationStatus =
  | "NOT_SUBMITTED"
  | "PENDING_VERIFICATION"
  | "UNDER_REVIEW"
  | "NEEDS_ADDITIONAL_INFORMATION"
  | "VERIFIED"
  | "REJECTED";

export type BusinessType =
  | "PROCESSING_COMPANY"
  | "DISTRIBUTOR"
  | "WHOLESALER"
  | "RETAILER"
  | "FOOD_SERVICE"
  | "EXPORTER"
  | "COOPERATIVE"
  | "HOUSEHOLD_BUSINESS"
  | "OTHER";

export type RepresentativeType = "LEGAL_REPRESENTATIVE" | "AUTHORIZED_REPRESENTATIVE";

export type DocumentType = "BUSINESS_REGISTRATION" | "TAX_DOCUMENT" | "REPRESENTATIVE_DOCUMENT" | "AUTHORIZATION_DOCUMENT" | "OTHER";

export type VerificationDocument = {
  id: string;
  type: DocumentType;
  fileName: string;
  uploadedAt: number;
  /** Coordinator's result for this one document (FR-B0B-15). */
  review?: { status: "ACCEPTED" | "NEEDS_FIX" | "REJECTED"; note?: string };
};

export type BuyerProfile = {
  // A. Business
  businessName: string;
  businessType: BusinessType;
  registrationNumber: string;
  taxCode: string;
  industry: string;
  description: string;
  website: string;
  businessEmail: string;
  businessPhone: string;
  // B. Registered address (delivery points are declared per demand / order)
  country: string;
  province: string;
  ward: string;
  streetAddress: string;
  // C. Representative
  representativeName: string;
  representativePosition: string;
  representativeEmail: string;
  representativePhone: string;
  representativeType: RepresentativeType;
  // D. Procurement (optional)
  procurementCategories: string[];
  preferredRegions: string[];
  expectedVolume: string;
  procurementFrequency: string;
  // E. Documents
  documents: VerificationDocument[];

  status: VerificationStatus;
  verifiedAt?: number;
  /** What the coordinator asked for, or why the profile was rejected. */
  reviewNote?: string;
  history: HistoryEntry[];
};

// ── Market (B2 output the buyer can read) ──────────────────────────────────

export type QualityGrade = "A" | "B" | "C";

/** How the lot's quality claim is backed (B2); shown apart everywhere (FR-B3.1-26). */
export type QualityEvidence = "SELF_DECLARED" | "DOCUMENT_VERIFIED";

export type SupplyLotStatus = "PUBLISHED" | "PARTIALLY_RESERVED" | "FULLY_RESERVED" | "IN_TRANSACTION" | "EXPIRED";

export type SupplyLot = {
  code: string;
  supplier: string;
  region: string;
  /** Standardised shipping zone (B3.3 7.5.1: no free-text matching). */
  zone: string;
  crop: string;
  variety: string;
  grade: QualityGrade;
  qualityEvidence: QualityEvidence;
  certifications: string[];
  /** Production unit code, when the production area is verified. */
  puc?: string;
  quantity: number;
  available: number;
  unit: "kg";
  availableFrom: string;
  availableUntil: string;
  status: SupplyLotStatus;
  photo?: string;
};

// ── B3 Transaction ─────────────────────────────────────────────────────────

export type Mechanism = "BUYER_LED_PROCUREMENT" | "SUPPLIER_LED_AUCTION" | "ORDER_MATCHING";

export type TransactionStatus = "CONFIRMED" | "PENDING_TERM_SHEET" | "PENDING_CONTRACT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type Transaction = {
  code: string;
  mechanism: Mechanism;
  /** AwardAllocation, AuctionAllocation or MatchResult it came from. */
  sourceRef: string;
  /** Demand, auction or buy order the source belongs to, for linking back. */
  sourceParent: string;
  supplier: string;
  lotCode: string;
  crop: string;
  variety: string;
  quantity: number;
  unit: "kg";
  price: number;
  total: number;
  qualityTerms: string;
  deliveryTerms: string;
  additionalTerms?: string;
  buyerConfirmedAt: number;
  supplierConfirmedAt: number;
  status: TransactionStatus;
  createdAt: number;
  /** Shipment once the contract is being carried out (Fulfillment, outside B3). */
  deliveryId?: string;
};

// ── B3.1 Buyer-led procurement ─────────────────────────────────────────────

export type DemandStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "UNDER_EVALUATION" | "AWARDED" | "CANCELLED" | "NO_PROPOSAL";

export type CriteriaType = "PRICE" | "QUALITY" | "CAPACITY" | "DELIVERY_TIME";

export type Criterion = { type: CriteriaType; weight: number };

export type SupplierScope = { kind: "ALL" } | { kind: "REGIONS"; regions: string[] };

export type Demand = {
  code: string;
  // Product
  crop: string;
  variety?: string;
  productDescription: string;
  // Quantity
  quantity: number;
  unit: "kg";
  // Quality (optional)
  qualityStandard?: QualityGrade;
  qualityNotes?: string;
  // Delivery
  deliveryFrom: string;
  deliveryTo: string;
  deliveryLocation: string;
  // Commercial (optional)
  budget?: number;
  commercialTerms?: string;
  // Additional (optional)
  requiredCertifications: string[];
  additionalRequirements?: string;

  // Set when publishing (B3.1.2)
  title?: string;
  description?: string;
  scope?: SupplierScope;
  submissionDeadline?: number;
  criteria: Criterion[];

  status: DemandStatus;
  createdAt: number;
  publishedAt?: number;
  closedAt?: number;
  closeReason?: string;
  cancelReason?: string;
  history: HistoryEntry[];
};

export type ProposalStatus = "SUBMITTED" | "UNDER_REVIEW" | "SELECTED" | "NOT_SELECTED" | "WITHDRAWN" | "INVALID";

export type NegotiationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED" | "WITHDRAWN";

export type Negotiation = {
  round: number;
  by: "BUYER" | "SUPPLIER";
  price?: number;
  quantity?: number;
  terms?: string;
  note?: string;
  status: NegotiationStatus;
  at: number;
  respondedAt?: number;
};

export type Proposal = {
  code: string;
  demandCode: string;
  supplier: string;
  lotCode: string;
  quantity: number;
  unitPrice: number;
  qualityDescription: string;
  qualityEvidence: QualityEvidence;
  deliveryDate: string;
  deliveryLocation: string;
  deliveryMethod: string;
  evidence: { type: string; name: string }[];
  additionalTerms?: string;
  status: ProposalStatus;
  submittedAt: number;
  invalidReason?: string;
  negotiations: Negotiation[];
  /** Terms after an accepted negotiation round; the original ones otherwise. */
  agreed: { price: number; quantity: number; terms?: string };
};

export type AwardAllocationStatus = "PENDING_SUPPLIER_CONFIRMATION" | "CONFIRMED" | "DECLINED";

export type AwardAllocation = {
  id: string;
  demandCode: string;
  proposalCode: string;
  supplier: string;
  lotCode: string;
  quantity: number;
  price: number;
  terms?: string;
  negotiated: boolean;
  status: AwardAllocationStatus;
  createdAt: number;
  deadline: number;
  respondedAt?: number;
  declineReason?: string;
};

// ── B3.2 Supplier-led auction ──────────────────────────────────────────────

export type AuctionStatus = "SCHEDULED" | "ACTIVE" | "ENDED" | "PENDING_CONFIRMATION" | "COMPLETED" | "NO_WINNER" | "CANCELLED";

export type Auction = {
  code: string;
  name: string;
  description?: string;
  supplier: string;
  lotCode: string;
  crop: string;
  variety: string;
  grade: QualityGrade;
  zone: string;
  quantity: number;
  minBidQuantity: number;
  startingPrice: number;
  startTime: number;
  endTime: number;
  endedAt?: number;
  endReason?: string;
  deliveryLocation: string;
  deliveryTerms?: string;
  additionalConditions?: string;
  status: AuctionStatus;
  cancelReason?: string;
};

export type BidStatus = "SUBMITTED" | "WITHDRAWN" | "ACCEPTED" | "REJECTED" | "CONFIRMED" | "DECLINED" | "EXPIRED";

export type Bid = {
  code: string;
  auctionCode: string;
  price: number;
  quantity: number;
  deliveryPreference?: string;
  conditions?: string;
  status: BidStatus;
  submittedAt: number;
  history: HistoryEntry[];
};

export type AuctionAllocationStatus = "PENDING_CONFIRMATION" | "CONFIRMED" | "DECLINED" | "EXPIRED" | "RELEASED";

export type AuctionAllocation = {
  id: string;
  auctionCode: string;
  bidCode: string;
  quantity: number;
  acceptedPrice: number;
  deadline: number;
  status: AuctionAllocationStatus;
  createdAt: number;
  respondedAt?: number;
  declineReason?: string;
};

// ── B3.3 Order matching ────────────────────────────────────────────────────

export type TimeInForce = "DAY" | "GTC";

export type OrderStatus = "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "EXPIRED";

export type BuyOrder = {
  code: string;
  crop: string;
  variety?: string;
  grade: QualityGrade;
  requested: number;
  remaining: number;
  unit: "kg";
  maxPrice: number;
  qualityRequirements?: string;
  certifications: string[];
  deliveryLocation: string;
  zone: string;
  deliveryStart: string;
  deliveryEnd: string;
  deliveryConditions?: string;
  additionalConditions?: string;
  timeInForce: TimeInForce;
  /** GTC only; DAY orders end with the trading day. */
  validUntil?: string;
  priorityTime: number;
  status: OrderStatus;
  createdAt: number;
  history: HistoryEntry[];
};

/** Another party's order in the book. Its limit price is never shown to this buyer (NFR-B3-04). */
export type BookOrder = {
  code: string;
  side: "BUY" | "SELL";
  owner: string;
  crop: string;
  variety?: string;
  grade: QualityGrade;
  zone: string;
  remaining: number;
  limitPrice: number;
  certifications: string[];
  from: string;
  until: string;
  priorityTime: number;
  lotCode?: string;
};

export type SessionType = "MORNING" | "MIDDAY" | "AFTERNOON";

export type SessionStatus = "SCHEDULED" | "COLLECTING" | "CLOSED" | "PROCESSING" | "COMPLETED" | "FAILED";

/** Published after a session: one clearing price per compatibility group (FR-B3.3-22). */
export type ClearingPrice = {
  sessionCode: string;
  crop: string;
  variety?: string;
  grade: QualityGrade;
  zone: string;
  price: number;
  volume: number;
  at: number;
};

export type MatchingSession = {
  code: string;
  date: string;
  type: SessionType;
  cutoff: number;
  scheduled: number;
  status: SessionStatus;
  buyOrders?: number;
  sellOrders?: number;
  matchedQuantity?: number;
};

export type MatchStatus = "PENDING_CONFIRMATION" | "PARTIALLY_CONFIRMED" | "CONFIRMED" | "REJECTED" | "EXPIRED" | "CANCELLED";

export type PartyConfirmation = "PENDING" | "CONFIRMED" | "REJECTED";

export type MatchResult = {
  code: string;
  sessionCode: string;
  buyOrderCode: string;
  sellOrderCode: string;
  supplier: string;
  lotCode: string;
  crop: string;
  variety: string;
  grade: QualityGrade;
  quantity: number;
  clearingPrice: number;
  total: number;
  buyer: PartyConfirmation;
  supplierSide: PartyConfirmation;
  status: MatchStatus;
  deadline: number;
  matchedAt: number;
  confirmedAt?: number;
  reason?: string;
};
