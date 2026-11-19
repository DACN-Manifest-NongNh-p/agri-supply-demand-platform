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
  /** demandId → batch code of the latest offer on it (open or accepted). */
  offers: Record<string, string>;
  /** demandId → id of that offer, for links to the order. */
  offerIds: Record<string, string>;
  /** Opens the offer form, pre-filled with a demand, a batch or a buyer; offers land in Orders. */
  offer: (demandId?: string, batchCode?: string, buyer?: string) => void;
  /** The buyer's answer to the latest offer, by demand id. */
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
