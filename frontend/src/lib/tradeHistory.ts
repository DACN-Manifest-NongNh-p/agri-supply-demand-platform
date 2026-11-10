// Who has sold what to whom on Farmora. Built from delivered orders and reviews in the demo data,
// plus older trades below. The coordinator uses it to close gaps: a demand with no supply goes first
// to producers who supplied that buyer or that product before, and unsold supply to past buyers.
import { getParties, partyId, type Party } from "./parties";

export type Trade = {
  producer: string;
  buyer: string;
  product: string;
  grade: "A" | "B" | "C";
  kg: number;
  /** Days from today; negative is in the past. */
  day: number;
  batchCode?: string;
  /** The buyer's rating of the delivery, out of 5. */
  rating?: number;
};

export const TRADES: Trade[] = [
  // Delivered orders in the producer and buyer demos.
  { producer: "Hoa Phat Dragon Fruit Cooperative", buyer: "GreenBasket Supermarkets", product: "Dragon fruit", grade: "A", kg: 2400, day: -1, batchCode: "B-095", rating: 5 },
  { producer: "Hoa Phat Dragon Fruit Cooperative", buyer: "Saigon Fresh Kitchen", product: "Mango", grade: "A", kg: 900, day: -5, batchCode: "B-091", rating: 5 },
  // Behind the producer reviews.
  { producer: "Hoa Phat Dragon Fruit Cooperative", buyer: "FreshWay Markets", product: "Dragon fruit", grade: "A", kg: 3000, day: -6, rating: 5 },
  { producer: "Hoa Phat Dragon Fruit Cooperative", buyer: "Saigon Fresh DC", product: "Dragon fruit", grade: "A", kg: 1800, day: -19, rating: 5 },
  { producer: "Thuan Nam Mango Growers", buyer: "Mekong Mart", product: "Mango", grade: "A", kg: 1200, day: -4, rating: 5 },
  { producer: "Thuan Nam Mango Growers", buyer: "FreshWay Markets", product: "Mango", grade: "A", kg: 1500, day: -23, rating: 4 },
  { producer: "Ham Kiem Green Farm", buyer: "Saigon Fresh DC", product: "Dragon fruit", grade: "B", kg: 1400, day: -12, rating: 4 },
  { producer: "Green Hills Farm", buyer: "Mekong Mart", product: "Mango", grade: "C", kg: 800, day: -30, rating: 4 },
  { producer: "Muong Man Pomelo Cooperative", buyer: "FreshWay Markets", product: "Pomelo", grade: "A", kg: 2000, day: -9, rating: 5 },
  { producer: "Muong Man Pomelo Cooperative", buyer: "Saigon Fresh DC", product: "Pomelo", grade: "A", kg: 1600, day: -27, rating: 4 },
  { producer: "Bac Binh Citrus Farm", buyer: "Mekong Mart", product: "Pomelo", grade: "B", kg: 2200, day: -15, rating: 4 },
  { producer: "Lam Ha Avocado Cooperative", buyer: "Saigon Fresh DC", product: "Avocado", grade: "A", kg: 700, day: -3, rating: 5 },
  // Older trades.
  { producer: "Lam Ha Avocado Cooperative", buyer: "Saigon Fresh Kitchen", product: "Avocado", grade: "A", kg: 300, day: -21, rating: 5 },
  { producer: "Krong Pac Highland Farm", buyer: "Saigon Fresh Kitchen", product: "Avocado", grade: "A", kg: 250, day: -48, rating: 4 },
  { producer: "Krong Pac Highland Farm", buyer: "Mekong Export Co.", product: "Durian", grade: "A", kg: 4000, day: -60, rating: 4 },
  { producer: "Thuan Nam Mango Growers", buyer: "GreenBasket Supermarkets", product: "Mango", grade: "A", kg: 1000, day: -14, rating: 5 },
  { producer: "Muong Man Pomelo Cooperative", buyer: "GreenBasket Supermarkets", product: "Pomelo", grade: "A", kg: 1500, day: -18, rating: 4 },
  { producer: "Ham Kiem Green Farm", buyer: "GreenBasket Supermarkets", product: "Dragon fruit", grade: "A", kg: 1500, day: -25, rating: 4 },
  { producer: "Bac Binh Citrus Farm", buyer: "Binh Duong School Meals", product: "Pomelo", grade: "B", kg: 1200, day: -33, rating: 4 },
  { producer: "Cao Lanh Mango Cooperative", buyer: "Saigon Fresh Kitchen", product: "Mango", grade: "A", kg: 500, day: -40, rating: 4 },
  { producer: "Cho Gao Dragon Fruit Co-op", buyer: "Phu Tho Wholesale Market", product: "Dragon fruit", grade: "B", kg: 2500, day: -11, rating: 4 },
  { producer: "Hoa Phat Dragon Fruit Cooperative", buyer: "Phu Tho Wholesale Market", product: "Dragon fruit", grade: "A", kg: 2800, day: -35, rating: 4 },
  { producer: "Hoa Phat Dragon Fruit Cooperative", buyer: "Mekong Export Co.", product: "Dragon fruit", grade: "A", kg: 4200, day: -44, rating: 5 },
  { producer: "Cai Lay Pomelo Farm", buyer: "Mekong Mart", product: "Pomelo", grade: "A", kg: 1800, day: -20, rating: 4 },
];

/**
 * How well a party is known for this need:
 *   partner  — already traded this product with the other side;
 *   returning — traded this product on Farmora, with someone else;
 *   new      — lists the product but has never traded it here.
 */
export type Relation = "partner" | "returning" | "new";

export const RELATION_LABEL: Record<Relation, string> = {
  partner: "Traded with them",
  returning: "Sold here before",
  new: "New on this product",
};

export type Counterpart = {
  party: Party;
  relation: Relation;
  /** Trades in this product, newest first. */
  trades: Trade[];
  totalKg: number;
  lastDay?: number;
  averageRating?: number;
};

function summarise(party: Party, trades: Trade[], relation: Relation): Counterpart {
  const sorted = [...trades].sort((a, b) => b.day - a.day);
  const rated = sorted.filter((trade) => trade.rating !== undefined);
  return {
    party,
    relation,
    trades: sorted,
    totalKg: sorted.reduce((sum, trade) => sum + trade.kg, 0),
    lastDay: sorted[0]?.day,
    averageRating: rated.length ? rated.reduce((sum, trade) => sum + (trade.rating ?? 0), 0) / rated.length : undefined,
  };
}

const ORDER: Record<Relation, number> = { partner: 0, returning: 1, new: 2 };

function rank(list: Counterpart[]) {
  return list.sort((a, b) => ORDER[a.relation] - ORDER[b.relation] || (b.lastDay ?? -999) - (a.lastDay ?? -999) || b.totalKg - a.totalKg);
}

/** Producers who could supply `product`, best known first; `buyer` marks those who already supplied them. */
export function suppliersFor(product: string, buyer?: string, trades = TRADES): Counterpart[] {
  const buyerId = buyer ? partyId(buyer) : undefined;
  return rank(
    getParties()
      .filter((party) => party.role === "producer")
      .flatMap((party) => {
        const own = trades.filter((trade) => partyId(trade.producer) === party.id && trade.product === product);
        if (own.length === 0 && !party.products.includes(product)) return [];
        const withBuyer = buyerId ? own.filter((trade) => partyId(trade.buyer) === buyerId) : [];
        const relation: Relation = withBuyer.length ? "partner" : own.length ? "returning" : "new";
        return [summarise(party, own, relation)];
      }),
  );
}

/** Buyers who could take `product`, best known first; `producer` marks those who already bought from them. */
export function buyersFor(product: string, producer?: string, trades = TRADES): Counterpart[] {
  const producerId = producer ? partyId(producer) : undefined;
  return rank(
    getParties()
      .filter((party) => party.role === "buyer")
      .flatMap((party) => {
        const own = trades.filter((trade) => partyId(trade.buyer) === party.id && trade.product === product);
        if (own.length === 0 && !party.products.includes(product)) return [];
        const withProducer = producerId ? own.filter((trade) => partyId(trade.producer) === producerId) : [];
        const relation: Relation = withProducer.length ? "partner" : own.length ? "returning" : "new";
        return [summarise(party, own, relation)];
      }),
  );
}

/** Every trade between two parties, newest first (the "your history together" list). */
export function tradesBetween(producer: string, buyer: string, trades = TRADES) {
  const p = partyId(producer);
  const b = partyId(buyer);
  return trades.filter((trade) => partyId(trade.producer) === p && partyId(trade.buyer) === b).sort((x, y) => y.day - x.day);
}
