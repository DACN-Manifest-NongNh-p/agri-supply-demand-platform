// B3 output: every result both sides confirmed becomes a Transaction, whatever the mechanism
// (FR-B3-08). It then goes through term sheet, contract, fulfilment and delivery. Farmora records
// the state of each step; it never takes or moves money (BR-B3-07).
import { ArrowLeft, Truck } from "lucide-react";
import { TransactionDemo } from "../LandingPage/sections/Demos";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { PartyLink } from "@/components/parties/PartyLink";
import { MECHANISM_LABEL, TRANSACTION_LABEL } from "./model/catalog";
import { mechanismPath, useBuyerData } from "./model/store";
import { formatDateTime } from "./model/time";
import type { Mechanism, TransactionStatus } from "./model/types";
import { Facts, PageHead, Pill, Steps, Tabs } from "./ui/parts";
import { kg, perKg, vnd } from "./ui/format";
import { TRANSACTION_TONE } from "./ui/tones";
import { MiniSteps } from "./ui/MiniSteps";

const FLOW = ["Confirmed", "Term sheet", "Contract", "Active", "Completed"];
const FLOW_STEP: Record<TransactionStatus, number> = { CONFIRMED: 0, PENDING_TERM_SHEET: 1, PENDING_CONTRACT: 2, ACTIVE: 3, COMPLETED: 5, CANCELLED: 0 };

export function TransactionsPage() {
  const data = useBuyerData();
  const [params, setParams] = useSearchParams();
  const filter = (params.get("via") ?? "all") as Mechanism | "all";
  const rows = data.transactions.filter((item) => filter === "all" || item.mechanism === filter).sort((a, b) => b.createdAt - a.createdAt);
  const count = (mechanism: Mechanism) => data.transactions.filter((item) => item.mechanism === mechanism).length;
  const open = data.transactions.filter((item) => item.status !== "COMPLETED" && item.status !== "CANCELLED");

  return (
    <main className="ph-main bf-page">
      <PageHead
        eyebrow="Transactions"
        title="Confirmed trades"
        summary={`${open.length} in progress · ${vnd(open.reduce((sum, item) => sum + item.total, 0))}`}
        demo={<TransactionDemo />}
        help="Every result you and the supplier both confirmed becomes a transaction, whatever the channel. It then goes through term sheet, contract and delivery. Payment is agreed in the contract and settled outside Farmora."
      />
      <section className="ph-card bo-panel">
        <Tabs
          panel
          label="Mechanism"
          value={filter}
          onChange={(id) => setParams(id === "all" ? {} : { via: id }, { replace: true })}
          tabs={[
            { id: "all", label: "All", count: data.transactions.length },
            { id: "ORDER_MATCHING", label: MECHANISM_LABEL.ORDER_MATCHING, count: count("ORDER_MATCHING") },
            { id: "BUYER_LED_PROCUREMENT", label: MECHANISM_LABEL.BUYER_LED_PROCUREMENT, count: count("BUYER_LED_PROCUREMENT") },
            { id: "SUPPLIER_LED_AUCTION", label: MECHANISM_LABEL.SUPPLIER_LED_AUCTION, count: count("SUPPLIER_LED_AUCTION") },
          ]}
        />
        {rows.length === 0 ? (
          <p className="ph-empty">No transactions yet. They appear when a match result, an award or an auction result is confirmed by both sides.</p>
        ) : (
          <div className="ph-table-scroll">
            <table className="at-table">
              <thead>
                <tr>
                  <th>Trade</th>
                  <th>Supplier</th>
                  <th className="at-num">Value</th>
                  <th>Progress</th>
                  <th aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const step = FLOW_STEP[item.status];
                  return (
                    <tr key={item.code}>
                      <td>
                        <Link to={`/buyer/transactions/${item.code}`} className="at-product">
                          <strong>
                            {kg(item.quantity)} {item.crop.toLowerCase()}
                          </strong>
                          <span>
                            {item.variety} · {perKg(item.price)} · {MECHANISM_LABEL[item.mechanism]}
                          </span>
                        </Link>
                      </td>
                      <td className="at-plain">{item.supplier}</td>
                      <td className="at-num">
                        <strong>{vnd(item.total)}</strong>
                      </td>
                      <td>
                        <MiniSteps steps={FLOW} current={step} tone={item.status === "CANCELLED" ? "stopped" : item.status === "COMPLETED" ? "done" : "normal"} />
                      </td>
                      <td className="at-action">
                        {item.deliveryId && item.status === "ACTIVE" ? (
                          <Link to={`/buyer/deliveries/${item.deliveryId}`} className="ph-btn ph-btn--primary">
                            <Truck size={14} /> Track
                          </Link>
                        ) : (
                          <Link to={`/buyer/transactions/${item.code}`} className="ph-btn">
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export function TransactionDetailPage() {
  const { code } = useParams();
  const data = useBuyerData();
  const item = data.transactions.find((entry) => entry.code === code);
  if (!item) {
    return (
      <main className="ph-main">
        <Link to="/buyer/transactions" className="ph-back">
          <ArrowLeft size={16} /> Transactions
        </Link>
        <p className="ph-empty">Transaction {code} was not found.</p>
      </main>
    );
  }
  const sourceLabel = item.mechanism === "BUYER_LED_PROCUREMENT" ? "Award allocation" : item.mechanism === "SUPPLIER_LED_AUCTION" ? "Auction allocation" : "Match result";

  return (
    <main className="ph-main bf-page">
      <Link to="/buyer/transactions" className="ph-back">
        <ArrowLeft size={16} /> Transactions
      </Link>
      <PageHead
        eyebrow={`Transaction ${item.code}`}
        title={`${kg(item.quantity)} ${item.crop.toLowerCase()} · ${item.variety}`}
        summary={
          <>
            From <PartyLink name={item.supplier} role="producer" /> via {MECHANISM_LABEL[item.mechanism].toLowerCase()}
          </>
        }
        actions={<Pill tone={TRANSACTION_TONE[item.status]}>{TRANSACTION_LABEL[item.status]}</Pill>}
      />
      <section className="ph-card bf-verify">
        <Steps steps={FLOW} current={FLOW_STEP[item.status]} stopped={item.status === "CANCELLED" ? "Cancelled" : undefined} />
      </section>

      <div className="bf-columns">
        <div className="bf-col-main">
          <section className="ph-card bf-section">
            <h2>Agreed terms</h2>
            <p className="ph-muted">The input for the term sheet. These terms come from the confirmed result and do not change here.</p>
            <Facts
              items={[
                ["Quantity", kg(item.quantity)],
                ["Price", perKg(item.price)],
                ["Total value", vnd(item.total)],
                ["Quality", item.qualityTerms],
                ["Delivery", item.deliveryTerms],
                ["Other terms", item.additionalTerms],
                ["Supply lot", <Link key="lot" to={`/buyer/market/${item.lotCode}`}>{item.lotCode}</Link>],
              ]}
            />
          </section>
          {item.deliveryId && (
            <section className="ph-card bf-section">
              <h2>Delivery</h2>
              <p className="ph-muted">The contract is being carried out. Follow the shipment and report a problem on arrival.</p>
              <Link to={`/buyer/deliveries/${item.deliveryId}`} className="ph-btn">
                <Truck size={15} /> Track shipment {item.deliveryId}
              </Link>
            </section>
          )}
        </div>
        <aside className="bf-col-side">
          <section className="ph-card bf-sticky">
            <h2>Where it came from</h2>
            <Facts
              items={[
                ["Mechanism", MECHANISM_LABEL[item.mechanism]],
                [sourceLabel, item.sourceRef],
                ["From", <Link key="src" to={mechanismPath(item.mechanism, item.sourceParent)}>{item.sourceParent}</Link>],
                ["You confirmed", formatDateTime(item.buyerConfirmedAt)],
                ["Supplier confirmed", formatDateTime(item.supplierConfirmedAt)],
                ["Created", formatDateTime(item.createdAt)],
              ]}
            />
          </section>
        </aside>
      </div>
    </main>
  );
}

export default TransactionsPage;
