// The system checks of each BRD, one function per form. Each returns field → message, empty when
// valid, so forms can show the error at the field (FR-B3.1-02, FR-B3.3-02, FR-B0B-11).
import { needsRegistrationNumber, varietiesOf } from "./catalog";
import { todayIso } from "./time";
import type { Auction, Bid, BuyerProfile, BuyOrder, Criterion, Demand, SupplierScope } from "./types";

export type Errors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^(\+84|0)\d{9,10}$/;
const blank = (value: string | undefined) => !value || !value.trim();

/** B0B-VAL01 → VAL08 on submit. */
export function validateProfile(profile: BuyerProfile): Errors {
  const errors: Errors = {};
  const required: [keyof BuyerProfile, string][] = [
    ["businessName", "Enter the business name."],
    ["industry", "Enter the industry."],
    ["businessEmail", "Enter the business email."],
    ["businessPhone", "Enter the business phone."],
    ["country", "Enter the country."],
    ["province", "Choose the province."],
    ["ward", "Enter the ward."],
    ["streetAddress", "Enter the street address."],
    ["representativeName", "Enter the representative's name."],
    ["representativePosition", "Enter the representative's position."],
    ["representativeEmail", "Enter the representative's email."],
    ["representativePhone", "Enter the representative's phone."],
  ];
  for (const [field, message] of required) if (blank(profile[field] as string)) errors[field] = message;
  if (needsRegistrationNumber(profile.businessType) && blank(profile.registrationNumber))
    errors.registrationNumber = "This business type needs its registration number.";
  if (!errors.businessEmail && !EMAIL.test(profile.businessEmail)) errors.businessEmail = "This email is not valid.";
  if (!errors.representativeEmail && !EMAIL.test(profile.representativeEmail)) errors.representativeEmail = "This email is not valid.";
  if (!errors.businessPhone && !PHONE.test(profile.businessPhone.replace(/\s/g, ""))) errors.businessPhone = "Use a Vietnamese phone number, e.g. 0903 112 458.";
  if (!errors.representativePhone && !PHONE.test(profile.representativePhone.replace(/\s/g, "")))
    errors.representativePhone = "Use a Vietnamese phone number.";
  if (!blank(profile.taxCode) && !/^\d{10}(-\d{3})?$/.test(profile.taxCode.trim())) errors.taxCode = "A tax code has 10 digits (or 10 + 3).";
  const has = (type: string) => profile.documents.some((doc) => doc.type === type);
  if (!has("BUSINESS_REGISTRATION")) errors.documents = "Upload the business registration certificate.";
  else if (profile.representativeType === "AUTHORIZED_REPRESENTATIVE" && !has("AUTHORIZATION_DOCUMENT"))
    errors.documents = "An authorised representative needs a letter of authorisation.";
  return errors;
}

export type DemandDraft = Omit<Demand, "code" | "status" | "createdAt" | "history" | "criteria"> & { criteria?: Criterion[] };

/** B3.1-VAL01 → VAL04 when saving a demand. */
export function validateDemand(draft: DemandDraft): Errors {
  const errors: Errors = {};
  if (blank(draft.crop)) errors.crop = "Choose the product.";
  if (draft.variety && !varietiesOf(draft.crop).includes(draft.variety)) errors.variety = "This variety is not one of the product's.";
  if (blank(draft.productDescription)) errors.productDescription = "Describe the product you need.";
  if (!(draft.quantity > 0)) errors.quantity = "Quantity must be more than 0.";
  if (blank(draft.deliveryLocation)) errors.deliveryLocation = "Choose where to receive the goods.";
  if (!draft.deliveryFrom) errors.deliveryFrom = "Choose the first delivery day.";
  else if (draft.deliveryFrom <= todayIso()) errors.deliveryFrom = "Delivery must be in the future.";
  if (!draft.deliveryTo) errors.deliveryTo = "Choose the last delivery day.";
  else if (draft.deliveryFrom && draft.deliveryTo < draft.deliveryFrom) errors.deliveryTo = "The window ends before it starts.";
  if (draft.budget !== undefined && !(draft.budget > 0)) errors.budget = "Budget must be more than 0, or leave it empty.";
  return errors;
}

export type PublishDraft = { title: string; description: string; scope: SupplierScope; submissionDeadline: number; criteria: Criterion[] };

/** B3.1-VAL05 → VAL07 when publishing. */
export function validatePublish(demand: Demand, draft: PublishDraft, now: number): Errors {
  const errors: Errors = {};
  if (blank(draft.title)) errors.title = "Give the demand a title suppliers will see.";
  if (blank(draft.description)) errors.description = "Describe the demand for suppliers.";
  if (!Number.isFinite(draft.submissionDeadline)) errors.submissionDeadline = "Set the submission deadline.";
  else if (draft.submissionDeadline <= now) errors.submissionDeadline = "The deadline must be in the future.";
  else if (draft.submissionDeadline >= Date.parse(`${demand.deliveryFrom}T00:00:00+07:00`))
    errors.submissionDeadline = "The deadline must be before the delivery window starts.";
  if (draft.scope.kind === "REGIONS" && draft.scope.regions.length === 0) errors.scope = "Pick at least one region, or open it to all verified suppliers.";
  if (draft.criteria.length > 0) {
    if (draft.criteria.some((item) => !(item.weight > 0))) errors.criteria = "Every criterion needs a weight above 0.";
    else if (draft.criteria.reduce((sum, item) => sum + item.weight, 0) !== 100) errors.criteria = "Weights must add up to 100%.";
  }
  return errors;
}

export type BuyOrderDraft = Omit<BuyOrder, "code" | "remaining" | "priorityTime" | "status" | "createdAt" | "history">;

/** B3.3-VAL02 → VAL10 when placing or changing a buy order (VAL01 is the verification gate). */
export function validateBuyOrder(draft: BuyOrderDraft, filled = 0): Errors {
  const errors: Errors = {};
  if (blank(draft.crop)) errors.crop = "Choose the product.";
  if (draft.variety && !varietiesOf(draft.crop).includes(draft.variety)) errors.variety = "This variety is not one of the product's.";
  if (!(draft.requested > 0)) errors.requested = "Quantity must be more than 0.";
  else if (draft.requested < filled) errors.requested = `Already ${filled.toLocaleString("en-GB")} kg matched; the quantity cannot go below that.`;
  if (!(draft.maxPrice > 0)) errors.maxPrice = "Set the highest price you accept.";
  if (blank(draft.zone)) errors.zone = "Choose the delivery zone.";
  if (blank(draft.deliveryLocation)) errors.deliveryLocation = "Choose where to receive the goods.";
  if (!draft.deliveryStart) errors.deliveryStart = "Choose the first day you can receive.";
  if (!draft.deliveryEnd) errors.deliveryEnd = "Choose the last day you can receive.";
  else if (draft.deliveryEnd < todayIso()) errors.deliveryEnd = "The window must end in the future.";
  else if (draft.deliveryStart && draft.deliveryStart > draft.deliveryEnd) errors.deliveryEnd = "The window ends before it starts.";
  if (draft.timeInForce === "GTC") {
    if (!draft.validUntil) errors.validUntil = "A good-till-cancelled order needs an end date.";
    else if (draft.validUntil <= todayIso()) errors.validUntil = "The end date must be in the future.";
  }
  return errors;
}

export type BidDraft = Pick<Bid, "price" | "quantity" | "deliveryPreference" | "conditions">;

/** B3.2-VAL15 → VAL19 when bidding. */
export function validateBid(auction: Auction, draft: BidDraft, now: number): Errors {
  const errors: Errors = {};
  if (auction.status !== "ACTIVE" || now < auction.startTime || now >= (auction.endedAt ?? auction.endTime))
    errors.form = "This auction is not taking bids.";
  if (!(draft.price >= auction.startingPrice)) errors.price = `The bid must be at least the starting price.`;
  if (!(draft.quantity >= auction.minBidQuantity) || draft.quantity > auction.quantity)
    errors.quantity = `Bid between ${auction.minBidQuantity.toLocaleString("en-GB")} and ${auction.quantity.toLocaleString("en-GB")} kg.`;
  return errors;
}

/** B3.1-VAL18 when proposing new terms. */
export function validateNegotiation(input: { price?: number; quantity?: number; terms?: string }, lotAvailable: number): Errors {
  const errors: Errors = {};
  if (input.price === undefined && input.quantity === undefined && blank(input.terms)) errors.form = "Change the price, the quantity or the terms.";
  if (input.price !== undefined && !(input.price > 0)) errors.price = "Price must be more than 0.";
  if (input.quantity !== undefined && (!(input.quantity > 0) || input.quantity > lotAvailable))
    errors.quantity = `Between 1 and ${lotAvailable.toLocaleString("en-GB")} kg (what the lot has available).`;
  return errors;
}
