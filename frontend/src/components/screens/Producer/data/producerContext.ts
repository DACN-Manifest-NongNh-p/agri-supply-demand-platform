import { useOutletContext } from "react-router-dom";
import type { TaskOutcome } from "../sections/AttentionList";
import type { DeliveryIssue } from "./deliveries";
import type { Batch, BatchStatus, Task } from "./mockProducer";
import type { ProducerOrder } from "./orders";
import type { SpoilageItem } from "@/components/freshness/useSpoilageAlerts";

/** State shared by every /producer page, owned by ProducerLayout. */
export type ProducerState = {
  /** Temperature excursions reported per batch code (they raise the spoilage risk). */
  excursions: Record<string, string>;
  /** The farm's unsold batches, watched for spoilage risk. */
  spoilageItems: SpoilageItem[];
  batches: Batch[];
  setStatus: (code: string, status: BatchStatus) => void;
  /** Declares a new batch; returns its generated code. */
  addBatch: (batch: Omit<Batch, "code" | "allocatedKg" | "status">) => string;
  /** Declares several batches at once (a file import); returns their codes in order. */
  addBatches: (batches: Omit<Batch, "code" | "allocatedKg" | "status">[]) => string[];
  outcomes: Record<string, TaskOutcome>;
  resolveTask: (task: Task, outcome: TaskOutcome) => void;
  /** demandId → batch code for offers sent in this session. */
  offers: Record<string, string>;
  /** Offers a batch to a matched demand; it shows up in Orders as "Offered". */
  offer: (demandId: string, batchCode: string) => void;
  /** The buyer's answer to an offer, by demand id (in the demo the buyer accepts a few seconds later). */
  offerAnswers: Record<string, "confirmed" | "declined">;
  /** Every order on the farm's batches, stages kept in sync with resolved tasks and offers. */
  orders: ProducerOrder[];
  issues: Record<string, string>;
  reportIssue: (code: string, reason: string) => void;
  /** Delivery problems reported by the producer, by delivery id. */
  deliveryIssues: Record<string, DeliveryIssue>;
  reportDeliveryIssue: (deliveryId: string, issue: DeliveryIssue) => void;
  openTasks: number;
};

export function useProducer() {
  return useOutletContext<ProducerState>();
}
