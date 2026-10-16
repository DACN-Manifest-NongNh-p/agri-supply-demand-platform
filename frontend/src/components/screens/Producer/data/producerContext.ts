import { useOutletContext } from "react-router-dom";
import type { TaskOutcome } from "../sections/AttentionList";
import type { DeliveryIssue } from "./deliveries";
import type { Batch, BatchStatus, Task } from "./mockProducer";
import type { ProducerOrder } from "./orders";

/** State shared by every /producer page, owned by ProducerLayout. */
export type ProducerState = {
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
