import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { OrderRow } from "./sections/OrderRow";
import { DeliveriesList } from "./sections/DeliveriesList";
import { useBuyer } from "./data/buyerContext";
import { ORDER_TABS, sortOrders, tabOf, type OrderTab } from "./data/orders";

/** The cart: what you have on hold first, with tabs for offers and for orders further along. */
export default function OrdersPage() {
  const { allocations } = useBuyer();
  const [params, setParams] = useSearchParams();
  const location = useLocation();

  // A link to one order (#order-A-7) opens the tab it is in; otherwise ?tab=, else On hold.
  const linked = location.hash.startsWith("#order-") ? allocations.find((order) => `#order-${order.id}` === location.hash) : undefined;
  const tab: OrderTab = ORDER_TABS.find((item) => item.id === params.get("tab"))?.id ?? (linked ? tabOf(linked.stage) : "held");
  const current = ORDER_TABS.find((item) => item.id === tab)!;
  const countOf = (id: OrderTab) => allocations.filter((order) => ORDER_TABS.find((item) => item.id === id)!.stages.includes(order.stage)).length;
  const visible = sortOrders(allocations.filter((order) => current.stages.includes(order.stage)));

  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [location.hash, tab]);

  return (
    <main className="ph-main">
      <Link to="/buyer" className="ph-back">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Cart</p>
          <h1>Your orders</h1>
          <p className="ph-hello-summary">What you have on hold, offers from producers, and orders on their way. An order is yours once both sides agree.</p>
        </div>
      </section>

      <nav className="ord-tabs" aria-label="Order stages">
        {ORDER_TABS.map((item) => {
          const count = countOf(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => setParams({ tab: item.id }, { replace: true })}
            >
              {item.label}
              {count > 0 && <span className={item.id === "offered" ? "ph-count-badge is-alert" : "ph-count-badge"}>{count}</span>}
            </button>
          );
        })}
      </nav>

      <p className="ord-tab-hint">{current.hint}</p>

      {tab === "deliveries" ? (
        <DeliveriesList />
      ) : visible.length === 0 ? (
        <p className="ph-card ph-empty">{current.empty}</p>
      ) : (
        <ul className="ord-list">
          {visible.map((order) => (
            <OrderRow key={order.id} order={order} showDemand />
          ))}
        </ul>
      )}
    </main>
  );
}
