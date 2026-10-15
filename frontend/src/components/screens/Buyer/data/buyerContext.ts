import { useOutletContext } from "react-router-dom";
import type { DeliveryIssue } from "../../Producer/data/deliveries";
import type { BuyerAlert } from "./alerts";
import type { Allocation, BuyerDemand, SupplyBatch } from "./mockBuyer";

/** State shared by every /buyer page, owned by BuyerLayout. */
export type BuyerState = {
  demands: BuyerDemand[];
  /** Posts a new demand; returns its generated id. */
  addDemand: (draft: Omit<BuyerDemand, "id" | "createdDay" | "destination">) => string;
  supply: SupplyBatch[];
  allocations: Allocation[];
  /** Holds `kg` of a batch for a demand until the producer confirms. */
  reserve: (demandId: string, batchCode: string, kg: number) => void;
  /** Gives a hold back to the market. */
  release: (allocationId: string) => void;
  /** Open alerts, dismissed ones removed. */
  alerts: BuyerAlert[];
  dismissAlert: (id: string) => void;
  deliveryIssues: Record<string, DeliveryIssue>;
  reportDeliveryIssue: (deliveryId: string, issue: DeliveryIssue) => void;
};

export function useBuyer() {
  return useOutletContext<BuyerState>();
}
