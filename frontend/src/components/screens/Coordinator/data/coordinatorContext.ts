import { useOutletContext } from "react-router-dom";
import type { SupplyBatch } from "../../Buyer/data/mockBuyer";
import type { BoardRow } from "./market";
import type { HelpRequest, MarketAllocation, MarketDemand } from "./mockCoordinator";
import type { QueueItem } from "./queue";

export type Resolution = { note: string };
export type DeliveryUpdate = { text: string; time: string };

/** State shared by every /coordinator page, owned by CoordinatorLayout. */
export type CoordinatorState = {
  demands: MarketDemand[];
  market: SupplyBatch[];
  /** Includes the holds the matching engine made on its own (`matchedBy: "system"`). */
  allocations: MarketAllocation[];
  /** Open demands left after auto-matching: exceptions waiting on a decision, and gaps. */
  board: BoardRow[];
  /** Approves an exception: a 24-hour hold until the producer confirms. */
  approve: (demandId: string, batchCode: string, kg: number) => void;
  /** Gives a hold back to the market and stops the system proposing that pair again (an override). */
  release: (allocationId: string) => void;
  extendHold: (allocationId: string, hours: number) => void;
  /** Producers verified in this session. */
  verifiedProducers: string[];
  verifyProducer: (producer: string) => void;
  /** The producer will ship `kg` less on an allocation; matching covers the rest. */
  recordShortfall: (allocationId: string, kg: number) => void;
  /** Demand ids for which producers were asked to declare supply. */
  notified: Record<string, boolean>;
  notifyProducers: (demandId: string) => void;
  requests: HelpRequest[];
  resolved: Record<string, Resolution>;
  resolve: (requestId: string, note: string) => void;
  queue: QueueItem[];
  /** Updates the coordinator sent to the buyer and producer, per delivery. */
  deliveryUpdates: Record<string, DeliveryUpdate[]>;
  postDeliveryUpdate: (deliveryId: string, text: string) => void;
};

export function useCoordinator() {
  return useOutletContext<CoordinatorState>();
}
