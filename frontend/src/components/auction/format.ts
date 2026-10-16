import type { Auction } from "./auctionStore";

const VND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

/** 24500 → "24.500 ₫". */
export const vnd = (amount: number) => VND.format(Math.round(amount));

/** "4,200–4,800 kg". */
export const estimate = (auction: Pick<Auction, "estMinKg" | "estMaxKg">) => `${auction.estMinKg.toLocaleString("en-GB")}–${auction.estMaxKg.toLocaleString("en-GB")} kg`;
