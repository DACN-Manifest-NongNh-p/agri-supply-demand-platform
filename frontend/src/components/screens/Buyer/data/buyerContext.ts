import { useOutletContext } from "react-router-dom";
import type { DeliveryIssue } from "../../Producer/data/deliveries";
import type { BuyerAlert } from "./alerts";
import type { Allocation, BuyerDemand, DeliveryAddress, PaymentMethod, SupplyBatch } from "./mockBuyer";

/** State shared by every /buyer page, owned by BuyerLayout. */
export type BuyerState = {
  demands: BuyerDemand[];
  /** Posts a new demand; returns its generated id. */
  addDemand: (draft: Omit<BuyerDemand, "id" | "createdDay">) => string;
  /** Posts several demands at once (a file import); returns their ids in order. */
  addDemands: (drafts: Omit<BuyerDemand, "id" | "createdDay">[]) => string[];
  /** Saved delivery addresses, default first. */
  addresses: DeliveryAddress[];
  /** Saves a new delivery address; returns its id. */
  addAddress: (address: Omit<DeliveryAddress, "id">) => string;
  updateAddress: (address: DeliveryAddress) => void;
  /** Removes a saved address; demands already posted keep their address. */
  removeAddress: (id: string) => void;
  /** Moves an address to the top: the one picked by default for new demands. */
  makeDefaultAddress: (id: string) => void;
  supply: SupplyBatch[];
  allocations: Allocation[];
  /** Locks `kg` of a batch for a demand for a few minutes (RULES.lockMinutes); returns the order id. */
  reserve: (demandId: string, batchCode: string, kg: number) => string | undefined;
  /**
   * Pays the deposit (RULES.depositPercent of the order value). A locked order then goes to the producer,
   * who has RULES.holdHours to confirm; an accepted offer is confirmed straight away.
   */
  payDeposit: (allocationId: string, method: PaymentMethod) => void;
  /** Gives a lock or a hold back to the market. */
  release: (allocationId: string) => void;
  /** Turns a producer's offer down; it stays in Orders as declined. */
  declineOffer: (allocationId: string) => void;
  /** Open alerts, dismissed ones removed. */
  alerts: BuyerAlert[];
  dismissAlert: (id: string) => void;
  deliveryIssues: Record<string, DeliveryIssue>;
  reportDeliveryIssue: (deliveryId: string, issue: DeliveryIssue) => void;
};

export function useBuyer() {
  return useOutletContext<BuyerState>();
}
