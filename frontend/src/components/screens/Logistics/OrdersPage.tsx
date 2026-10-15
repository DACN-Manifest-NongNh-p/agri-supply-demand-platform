import { useSearchParams } from "react-router-dom";
import { OrderCard } from "./sections/OrderCard";
import type { OrderStatus } from "./data/mockLogistics";
import { useLogistics } from "./data/logisticsContext";

const TABS: { id: OrderStatus; label: string; empty: string }[] = [
  { id: "new", label: "To answer", empty: "Nothing to answer." },
  { id: "accepted", label: "Accepted", empty: "No accepted orders yet." },
  { id: "declined", label: "Declined", empty: "Nothing declined." },
];

/** Transport orders Farmora offered this provider: accept with a vehicle, or decline. */
export default function OrdersPage() {
  const { orders } = useLogistics();
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((item) => item.id === params.get("tab")) ?? TABS[0];
  const visible = orders
    .filter((order) => order.status === tab.id)
    .sort((a, b) => a.respondWithinHours - b.respondWithinHours || a.pickup.day - b.pickup.day);

  return (
    <main className="ph-main lg-page">
      <header className="lg-head">
        <h1>Transport orders</h1>
        <p>Unanswered orders go to the next carrier when the time runs out.</p>
      </header>

      <div className="ph-cal-toolbar co-toolbar">
        <div className="ph-segmented" role="group" aria-label="Show">
          {TABS.map((item) => (
            <button key={item.id} type="button" aria-pressed={tab.id === item.id} onClick={() => setParams(item.id === "new" ? {} : { tab: item.id })}>
              {item.label} <span className="ph-count-badge">{orders.filter((order) => order.status === item.id).length}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="ph-empty">{tab.empty}</p>
      ) : (
        <div className="co-stack">
          {visible.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </main>
  );
}
