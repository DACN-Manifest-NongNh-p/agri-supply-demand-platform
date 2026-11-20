// One buy order: its terms, how much has matched, its match results and its history (FR-B3.3-05).
import { useState } from "react";
import { ArrowLeft, Lock, Pencil } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useNow } from "@/components/orders/useNow";
import { GRADE_LABEL, ORDER_LABEL, SESSION_TYPE_LABEL, zoneLabel } from "./model/catalog";
import { cancelBuyOrder, compatibleLots, orderLocked, upcomingSlot, useBuyerData } from "./model/store";
import { formatDate, formatDateRange, formatDateTime, formatTime, vnDate } from "./model/time";
import type { Errors } from "./model/validation";
import { FillBar } from "./BuyOrdersPage";
import { MatchCard } from "./sections/MatchCard";
import { Facts, FormError, GateNote, History, PageHead, Pill, ReasonDialog } from "./ui/parts";
import { kg, perKg, useVerified } from "./ui/format";
import { ORDER_TONE } from "./ui/tones";

export default function BuyOrderDetailPage() {
  const { code } = useParams();
  const data = useBuyerData();
  const now = useNow(5000);
  const verified = useVerified();
  const [cancelling, setCancelling] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const order = data.buyOrders.find((item) => item.code === code);

  if (!order) {
    return (
      <main className="ph-main">
        <Link to="/buyer/orders" className="ph-back">
          <ArrowLeft size={16} /> Buy orders
        </Link>
        <p className="ph-empty">Buy order {code} was not found.</p>
      </main>
    );
  }

  const live = order.status === "OPEN" || order.status === "PARTIALLY_FILLED";
  const locked = orderLocked(order, now);
  const slot = upcomingSlot(now, data);
  const matches = data.matches.filter((match) => match.buyOrderCode === order.code);
  const pendingKg = matches.filter((match) => match.status === "PENDING_CONFIRMATION" || match.status === "PARTIALLY_CONFIRMED").reduce((sum, match) => sum + match.quantity, 0);
  const confirmedKg = matches.filter((match) => match.status === "CONFIRMED").reduce((sum, match) => sum + match.quantity, 0);
  const lots = live ? compatibleLots(order) : [];

  return (
    <main className="ph-main bf-page">
      <Link to="/buyer/orders" className="ph-back">
        <ArrowLeft size={16} /> Buy orders
      </Link>
      <PageHead
        eyebrow={`Buy order ${order.code}`}
        title={
          <>
            {kg(order.requested)} {order.crop.toLowerCase()}
            {order.variety && ` · ${order.variety}`}
          </>
        }
        summary={`${GRADE_LABEL[order.grade]} or better · at most ${perKg(order.maxPrice)} · ${order.timeInForce === "DAY" ? `day order (${formatDate(vnDate(order.createdAt))})` : `good till ${formatDate(order.validUntil!)}`}`}
        actions={<Pill tone={ORDER_TONE[order.status]}>{ORDER_LABEL[order.status]}</Pill>}
      />

      <div className="bf-columns">
        <div className="bf-col-main">
          <section className="ph-card bf-section">
            <h2>Progress</h2>
            <FillBar order={order} />
            <Facts
              items={[
                ["Still waiting to match", kg(order.remaining)],
                ["Matched, waiting for confirmation", pendingKg ? kg(pendingKg) : undefined],
                ["Confirmed into transactions", confirmedKg ? kg(confirmedKg) : undefined],
                ["Time priority since", formatDateTime(order.priorityTime)],
              ]}
            />
            {live && (
              <p className={locked ? "bf-callout bf-callout--warn" : "bf-callout"}>
                {locked ? (
                  <>
                    <Lock size={14} aria-hidden="true" /> In the {SESSION_TYPE_LABEL[slot.type].toLowerCase()} session's snapshot: it cannot be changed or cancelled until matching at {formatTime(slot.scheduled)} is done.
                  </>
                ) : (
                  <>
                    Joins the {SESSION_TYPE_LABEL[slot.type].toLowerCase()} session at {formatTime(slot.scheduled)}
                    {slot.date !== vnDate(now) && ` on ${formatDate(slot.date)}`}. {lots.length} published lot{lots.length === 1 ? "" : "s"} fit its conditions.
                  </>
                )}
              </p>
            )}
          </section>

          <section className="bf-section" aria-labelledby="matches-title">
            <h2 id="matches-title" className="bf-h2">
              Match results
            </h2>
            {matches.length === 0 ? (
              <p className="ph-card ph-empty">No match yet. Each session that fills part of this order adds a result here, with its own supplier and the session's clearing price.</p>
            ) : (
              <ul className="bf-list">
                {matches.map((match) => (
                  <MatchCard key={match.code} match={match} showOrder={false} />
                ))}
              </ul>
            )}
          </section>

          <History entries={order.history} title="Order history" />
        </div>

        <aside className="bf-col-side">
          <section className="ph-card bf-sticky">
            <h2>Terms</h2>
            <Facts
              items={[
                ["Product", `${order.crop}${order.variety ? ` · ${order.variety}` : " · any variety"}`],
                ["Grade", `${GRADE_LABEL[order.grade]} or better`],
                ["Certifications", order.certifications.join(", ") || "None required"],
                ["Quality", order.qualityRequirements],
                ["Maximum price", perKg(order.maxPrice)],
                ["Deliver to", order.deliveryLocation],
                ["Zone", zoneLabel(order.zone)],
                ["Window", formatDateRange(order.deliveryStart, order.deliveryEnd)],
                ["Delivery conditions", order.deliveryConditions],
                ["Other conditions", order.additionalConditions],
              ]}
            />
            {live && (
              <>
                <GateNote />
                <FormError errors={errors} />
                <div className="bf-stack">
                  {verified && !locked ? (
                    <Link to={`/buyer/orders/${order.code}/edit`} className="ph-btn">
                      <Pencil size={15} /> Change order
                    </Link>
                  ) : (
                    <button type="button" className="ph-btn" disabled>
                      <Pencil size={15} /> Change order
                    </button>
                  )}
                  <button type="button" className="ph-btn ph-btn--warn" disabled={!verified || locked} onClick={() => setCancelling(true)}>
                    Cancel remaining {kg(order.remaining)}
                  </button>
                </div>
              </>
            )}
          </section>
        </aside>
      </div>

      <ReasonDialog
        open={cancelling}
        title={`Cancel ${order.code}?`}
        text={`The ${kg(order.remaining)} not yet matched leaves the book. Results already matched are not affected.`}
        confirmLabel="Cancel order"
        danger
        noReason
        onClose={() => setCancelling(false)}
        onConfirm={() => {
          const result = cancelBuyOrder(order.code);
          setErrors(result.ok ? {} : result.errors);
          return null;
        }}
      />
    </main>
  );
}
