// Starting price against the latest market price for the same product and grade.
import { TrendingDown, TrendingUp } from "lucide-react";
import { latestPrices } from "../model/prices";
import { useBuyerData } from "../model/store";
import type { Auction } from "../model/types";

// eslint-disable-next-line react-refresh/only-export-components
export function useMarketPrice() {
  const data = useBuyerData();
  const prices = latestPrices(data.prices);
  return (auction: Pick<Auction, "crop" | "grade">) => prices.find((price) => price.crop === auction.crop && price.grade === auction.grade)?.price;
}

export function Deal({ start, market }: { start: number; market?: number }) {
  if (!market) return null;
  const diff = Math.round(((start - market) / market) * 100);
  if (diff === 0) return <span className="at-deal is-even">At market price</span>;
  return (
    <span className={`at-deal ${diff < 0 ? "is-below" : "is-above"}`}>
      {diff < 0 ? <TrendingDown size={12} aria-hidden="true" /> : <TrendingUp size={12} aria-hidden="true" />}
      {Math.abs(diff)}% {diff < 0 ? "below" : "above"} market
    </span>
  );
}
