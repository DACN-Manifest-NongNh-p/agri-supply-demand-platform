import { formatKg, formatVnd } from "../../Producer/data/format";
import { useBuyerData, verificationBlock } from "../model/store";

export const kg = (value: number) => formatKg(value);
export const vnd = (value: number) => formatVnd(value);
export const perKg = (value: number) => `${value.toLocaleString("en-GB")} ₫/kg`;

/** True when the buyer may make trading commitments right now. */
export function useVerified() {
  useBuyerData();
  return verificationBlock() === null;
}
