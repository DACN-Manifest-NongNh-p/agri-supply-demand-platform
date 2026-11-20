// B3.1 Buyer-led procurement: the buyer's demands, in progress / awarded / closed.
import { Plus } from "lucide-react";
import { useNow } from "@/components/orders/useNow";
import { ProcurementDemo } from "../LandingPage/sections/Demos";
import { Link, useSearchParams } from "react-router-dom";
import { pendingActions, useBuyerData } from "./model/store";
import { formatDateRange, formatLeft } from "./model/time";
import type { Demand, DemandStatus } from "./model/types";
import { PageHead, Tabs } from "./ui/parts";
import { MiniSteps } from "./ui/MiniSteps";
import { kg } from "./ui/format";

type Tab = "active" | "awarded" | "closed";

/** Three tabs, like buy orders; the exact stage of each demand is on its own pill. */
const TAB_STATUSES: Record<Tab, DemandStatus[]> = {
  active: ["CLOSED", "UNDER_EVALUATION", "PUBLISHED", "DRAFT"],
  awarded: ["AWARDED"],
  closed: ["CANCELLED", "NO_PROPOSAL"],
};

/** Within "In progress": what needs you first, then what is running, drafts last. */
const STAGE_ORDER: Partial<Record<DemandStatus, number>> = { CLOSED: 0, UNDER_EVALUATION: 0, PUBLISHED: 1, DRAFT: 2 };

const STEPS = ["Draft", "Collecting", "Evaluate", "Awarded"];
const STEP_OF: Partial<Record<DemandStatus, number>> = { DRAFT: 0, PUBLISHED: 1, CLOSED: 2, UNDER_EVALUATION: 2, AWARDED: 3, CANCELLED: 1, NO_PROPOSAL: 1 };

function DemandRow({ demand }: { demand: Demand }) {
  const data = useBuyerData();
  const now = useNow(30_000);
  const proposals = data.proposals.filter((item) => item.demandCode === demand.code && item.status !== "WITHDRAWN").length;
  const allocations = data.awardAllocations.filter((item) => item.demandCode === demand.code);
  const declined = allocations.some((item) => item.status === "DECLINED");
  const needsYou = demand.status === "CLOSED" || demand.status === "UNDER_EVALUATION" || declined;
  const ended = demand.status === "CANCELLED" || demand.status === "NO_PROPOSAL";
  const to = `/buyer/demands/${demand.code}`;
  const cta = demand.status === "DRAFT" ? "Publish" : needsYou ? (declined ? "Replace" : "Evaluate") : "View";

  return (
    <tr className={needsYou ? "is-attention" : undefined}>
      <td>
        <Link to={to} className="at-product">
          <strong>{demand.title ?? `${demand.crop}${demand.variety ? ` · ${demand.variety}` : ""}`}</strong>
          <span>
            {kg(demand.quantity)} {demand.crop.toLowerCase()} · {demand.code}
          </span>
        </Link>
      </td>
      <td className="at-plain">{formatDateRange(demand.deliveryFrom, demand.deliveryTo)}</td>
      <td className="at-num">
        {demand.status === "DRAFT" ? <span className="at-none">—</span> : <strong className="at-count">{proposals}</strong>}
      </td>
      <td>
        <MiniSteps steps={STEPS} current={STEP_OF[demand.status] ?? 0} tone={ended ? "stopped" : needsYou ? "attention" : demand.status === "AWARDED" ? "done" : "normal"} />
        {demand.status === "PUBLISHED" && demand.submissionDeadline && <small className="at-sub">closes in {formatLeft(demand.submissionDeadline - now)}</small>}
      </td>
      <td className="at-action">
        <Link to={to} className={cta === "View" ? "ph-btn" : "ph-btn ph-btn--primary"}>
          {cta}
        </Link>
      </td>
    </tr>
  );
}

export default function DemandsPage() {
  const data = useBuyerData();
  const [params, setParams] = useSearchParams();
  const pending = pendingActions(data);
  const counts = Object.fromEntries((Object.keys(TAB_STATUSES) as Tab[]).map((tab) => [tab, data.demands.filter((demand) => TAB_STATUSES[tab].includes(demand.status)).length])) as Record<Tab, number>;
  const requested = params.get("tab") as Tab | null;
  const tab: Tab = requested && requested in TAB_STATUSES ? requested : "active";
  const rows = data.demands
    .filter((demand) => TAB_STATUSES[tab].includes(demand.status))
    .sort((a, b) => (STAGE_ORDER[a.status] ?? 0) - (STAGE_ORDER[b.status] ?? 0) || b.createdAt - a.createdAt);
  const needsYou = data.demands.filter((demand) => demand.status === "CLOSED" || demand.status === "UNDER_EVALUATION").length + pending.counters.length;

  return (
    <main className="ph-main bf-page">
      <PageHead
        eyebrow="Procurement"
        title="Demands"
        summary="Ask suppliers for offers and pick the best."
        demo={<ProcurementDemo />}
        help="Publish what you need with a deadline. Verified suppliers send proposals from their own supply lots. When submissions close you compare them, negotiate if needed, and award one or more suppliers. Each awarded supplier confirms, and each confirmation becomes a transaction."
        actions={
          <Link to="/buyer/demands/new" className="ph-btn ph-btn--primary ph-btn--large">
            <Plus size={18} /> New demand
          </Link>
        }
      />


      <section className="ph-card bo-panel">
        <Tabs
          panel
          label="Stage"
          value={tab}
          onChange={(id) => setParams({ tab: id }, { replace: true })}
          tabs={[
            { id: "active", label: "In progress", count: needsYou || counts.active, alert: needsYou > 0 },
            { id: "awarded", label: "Awarded", count: counts.awarded, alert: pending.declinedAwards.length > 0 },
            { id: "closed", label: "Closed", count: counts.closed },
          ]}
        />
        {rows.length === 0 ? (
          <p className="ph-empty">Nothing here.</p>
        ) : (
          <div className="ph-table-scroll">
            <table className="at-table">
              <thead>
                <tr>
                  <th>Demand</th>
                  <th>Delivery</th>
                  <th className="at-num">Proposals</th>
                  <th>Progress</th>
                  <th aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {rows.map((demand) => (
                  <DemandRow key={demand.code} demand={demand} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
