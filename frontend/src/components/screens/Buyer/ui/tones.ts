// Colour of each status pill: bad = ended without result, warn = waiting for this buyer,
// info = waiting for someone else, good = done, muted = closed or no longer relevant.
import type {
  AuctionAllocationStatus,
  AuctionStatus,
  AwardAllocationStatus,
  BidStatus,
  DemandStatus,
  MatchStatus,
  OrderStatus,
  ProposalStatus,
  TransactionStatus,
  VerificationStatus,
} from "../model/types";
import type { Tone } from "./parts";

export const DEMAND_TONE: Record<DemandStatus, Tone> = {
  DRAFT: "neutral",
  PUBLISHED: "info",
  CLOSED: "warn",
  UNDER_EVALUATION: "warn",
  AWARDED: "good",
  CANCELLED: "muted",
  NO_PROPOSAL: "bad",
};

export const PROPOSAL_TONE: Record<ProposalStatus, Tone> = {
  SUBMITTED: "info",
  UNDER_REVIEW: "info",
  SELECTED: "good",
  NOT_SELECTED: "muted",
  WITHDRAWN: "muted",
  INVALID: "bad",
};

export const AWARD_TONE: Record<AwardAllocationStatus, Tone> = { PENDING_SUPPLIER_CONFIRMATION: "info", CONFIRMED: "good", DECLINED: "bad" };

export const AUCTION_TONE: Record<AuctionStatus, Tone> = {
  SCHEDULED: "neutral",
  ACTIVE: "info",
  ENDED: "neutral",
  PENDING_CONFIRMATION: "warn",
  COMPLETED: "good",
  NO_WINNER: "muted",
  CANCELLED: "muted",
};

export const BID_TONE: Record<BidStatus, Tone> = {
  SUBMITTED: "info",
  WITHDRAWN: "muted",
  ACCEPTED: "warn",
  REJECTED: "muted",
  CONFIRMED: "good",
  DECLINED: "muted",
  EXPIRED: "bad",
};

export const AUCTION_ALLOCATION_TONE: Record<AuctionAllocationStatus, Tone> = { PENDING_CONFIRMATION: "warn", CONFIRMED: "good", DECLINED: "muted", EXPIRED: "bad", RELEASED: "muted" };

export const ORDER_TONE: Record<OrderStatus, Tone> = { OPEN: "info", PARTIALLY_FILLED: "info", FILLED: "good", CANCELLED: "muted", EXPIRED: "muted" };

export const MATCH_TONE: Record<MatchStatus, Tone> = {
  PENDING_CONFIRMATION: "warn",
  PARTIALLY_CONFIRMED: "warn",
  CONFIRMED: "good",
  REJECTED: "muted",
  EXPIRED: "bad",
  CANCELLED: "muted",
};

export const TRANSACTION_TONE: Record<TransactionStatus, Tone> = {
  CONFIRMED: "info",
  PENDING_TERM_SHEET: "info",
  PENDING_CONTRACT: "info",
  ACTIVE: "good",
  COMPLETED: "good",
  CANCELLED: "muted",
};

export const VERIFICATION_TONE: Record<VerificationStatus, Tone> = {
  NOT_SUBMITTED: "warn",
  PENDING_VERIFICATION: "info",
  UNDER_REVIEW: "info",
  NEEDS_ADDITIONAL_INFORMATION: "warn",
  VERIFIED: "good",
  REJECTED: "bad",
};
