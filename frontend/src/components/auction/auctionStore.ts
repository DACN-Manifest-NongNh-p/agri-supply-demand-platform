// Pre-harvest auctions: a producer offers a batch that is not ready yet, and buyers compete to secure it.
// Demo state lives in this module so the producer and buyer areas of one browser see the same auctions;
// other buyers are simulated (useAuctionSimulation). On a server every bid would be an atomic update of
// the auction row (or a lock on it), so two bids at the same moment can never both become the highest.
import { useSyncExternalStore } from "react";

export type AuctionStatus = "live" | "closed" | "review";

export type Bid = {
  id: string;
  /** "You" for the signed-in buyer; other buyers stay anonymous ("Buyer A"). */
  bidder: string;
  self: boolean;
  pricePerKg: number;
  at: number;
};

export type Auction = {
  id: string;
  batchCode: string;
  producer: string;
  region: string;
  product: string;
  variety: string;
  grade: "A" | "B" | "C";
  estMinKg: number;
  estMaxKg: number;
  /** Days from today. */
  harvestDay: number;
  startPrice: number;
  /** Smallest raise over the current bid. */
  step: number;
  openedAt: number;
  endsAt: number;
  bids: Bid[];
  /** Bumped by every accepted bid; a bid must name the version it saw (compare-and-set). */
  version: number;
  status: AuctionStatus;
  farming: string[];
  /** Reported by the producer before harvest; puts the auction or commitment under review. */
  risk?: string;
  /** Recorded after harvest. */
  actualKg?: number;
};

export type BidResult =
  | { ok: true }
  | { ok: false; reason: "stale" | "too_low" | "closed"; current: number };

const MINUTE = 60_000;
const start = Date.now();

let auctions: Auction[] = [
  {
    id: "AU-201",
    batchCode: "B-107",
    producer: "Hoa Phat Dragon Fruit Cooperative",
    region: "Ham Thuan Nam, Binh Thuan",
    product: "Dragon fruit",
    variety: "White flesh",
    grade: "A",
    estMinKg: 4200,
    estMaxKg: 4800,
    harvestDay: 3,
    startPrice: 22000,
    step: 500,
    openedAt: start - 60 * MINUTE,
    endsAt: start + 9 * MINUTE,
    bids: [
      { id: "b1", bidder: "Buyer A", self: false, pricePerKg: 22500, at: start - 40 * MINUTE },
      { id: "b2", bidder: "Buyer B", self: false, pricePerKg: 23500, at: start - 22 * MINUTE },
      { id: "b3", bidder: "Buyer A", self: false, pricePerKg: 24500, at: start - 6 * MINUTE },
    ],
    version: 3,
    status: "live",
    farming: ["VietGAP certified", "Drip irrigation", "Bagged fruit on every plant", "Last season: 4,600 kg from this plot"],
  },
  {
    id: "AU-202",
    batchCode: "L-079",
    producer: "Lam Ha Avocado Cooperative",
    region: "Lam Ha, Lam Dong",
    product: "Avocado",
    variety: "034",
    grade: "B",
    estMinKg: 500,
    estMaxKg: 700,
    harvestDay: 5,
    startPrice: 36000,
    step: 1000,
    openedAt: start - 30 * MINUTE,
    endsAt: start + 26 * MINUTE,
    bids: [{ id: "b4", bidder: "Buyer C", self: false, pricePerKg: 37000, at: start - 15 * MINUTE }],
    version: 1,
    status: "live",
    farming: ["Organic fertiliser", "Hill orchard, 900 m", "First harvest from these trees"],
  },
  {
    id: "AU-203",
    batchCode: "B-110",
    producer: "Bac Binh Citrus Farm",
    region: "Bac Binh, Binh Thuan",
    product: "Pomelo",
    variety: "Da xanh",
    grade: "B",
    estMinKg: 2800,
    estMaxKg: 3600,
    harvestDay: 9,
    startPrice: 28000,
    step: 500,
    openedAt: start - 10 * MINUTE,
    endsAt: start + 2 * 60 * MINUTE,
    bids: [],
    version: 0,
    status: "live",
    farming: ["Grafted trees, 6 years old", "Rain-fed"],
  },
];

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const set = (next: Auction[]) => {
  auctions = next;
  emit();
};

export const currentBid = (auction: Auction) => auction.bids.at(-1)?.pricePerKg ?? 0;
export const minNextBid = (auction: Auction) => (auction.bids.length ? currentBid(auction) + auction.step : auction.startPrice);

export function useAuctions() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => auctions,
  );
}

let bidSeq = 100;

/**
 * Places a bid only if the auction is still at `seenVersion` (nobody bid in between), still live, and
 * the price is at least the minimum. One check-and-write, so the state can never hold two leaders.
 */
export function placeBid(auctionId: string, pricePerKg: number, seenVersion: number, bidder = "You", self = true, now = Date.now()): BidResult {
  const auction = auctions.find((item) => item.id === auctionId);
  if (!auction || auction.status !== "live" || now >= auction.endsAt) return { ok: false, reason: "closed", current: auction ? currentBid(auction) : 0 };
  if (auction.version !== seenVersion) return { ok: false, reason: "stale", current: currentBid(auction) };
  if (pricePerKg < minNextBid(auction)) return { ok: false, reason: "too_low", current: currentBid(auction) };
  bidSeq += 1;
  const bid: Bid = { id: `b${bidSeq}`, bidder, self, pricePerKg, at: now };
  set(auctions.map((item) => (item.id === auctionId ? { ...item, bids: [...item.bids, bid], version: item.version + 1 } : item)));
  return { ok: true };
}

/** Closes every live auction whose time is up. */
export function closeEnded(now: number) {
  if (!auctions.some((item) => item.status === "live" && now >= item.endsAt)) return;
  set(auctions.map((item) => (item.status === "live" && now >= item.endsAt ? { ...item, status: "closed" } : item)));
}

let auctionSeq = 203;

export function openAuction(draft: Omit<Auction, "id" | "bids" | "version" | "status" | "endsAt" | "openedAt"> & { minutes: number }): string {
  auctionSeq += 1;
  const id = `AU-${auctionSeq}`;
  const { minutes, ...rest } = draft;
  const now = Date.now();
  set([...auctions, { ...rest, id, bids: [], version: 0, status: "live", openedAt: now, endsAt: now + minutes * MINUTE }]);
  return id;
}

export function reportRisk(auctionId: string, risk: string) {
  set(auctions.map((item) => (item.id === auctionId ? { ...item, risk, status: item.status === "live" ? "review" : item.status } : item)));
}

export function recordHarvest(auctionId: string, actualKg: number) {
  set(auctions.map((item) => (item.id === auctionId ? { ...item, actualKg } : item)));
}

export function getAuctions() {
  return auctions;
}
