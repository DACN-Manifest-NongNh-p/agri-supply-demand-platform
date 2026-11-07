// Asking prices for offers. The buyer area's market list has a price per batch; anything else
// starts from a guide price per product, which the producer (or coordinator) can change.
import type { Batch } from "./mockProducer";
import { supply } from "../../Buyer/data/mockBuyer";

/** Price guide per kg when the batch has no asking price yet (VND). */
const GUIDE_PRICE: Record<string, number> = { "Dragon fruit": 25000, Mango: 32000, Pomelo: 32000, Avocado: 42000, Durian: 85000 };

export const suggestedPrice = (batch: Pick<Batch, "code" | "product">) =>
  supply.find((item) => item.code === batch.code)?.pricePerKg ?? GUIDE_PRICE[batch.product] ?? 25000;
