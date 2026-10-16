import { useState } from "react";
import { ArrowRight, Clock, TriangleAlert, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { LifecycleSteps, type OrderTone } from "@/components/orders/LifecycleSteps";
import { Countdown } from "@/components/orders/Countdown";
import { RULES } from "@/lib/site";
import { formatDay, formatKg, formatVnd } from "../../Producer/data/format";
import { DepositDialog } from "./DepositPayment";
import { useBuyer } from "../data/buyerContext";
import { ALLOCATION_STAGE_LABEL, depositFor, type Allocation, type AllocationStage } from "../data/mockBuyer";
import { nextStep, orderStepIndex, orderSteps } from "../data/orders";

const TONE: Record<AllocationStage, OrderTone> = {
  locked: "attention",
  offered: "attention",
  held: "waiting",
  confirmed: "active",
  in_transit: "active",
  delivered: "done",
  declined: "closed",
};

/** Four dots: who started it → both agreed → on the way → delivered. */
export function OrderSteps({ order }: { order: Allocation }) {
  return (
    <LifecycleSteps
      steps={orderSteps(order)}
      reached={orderStepIndex(order.stage)}
      closed={order.stage === "declined"}
      label={`Order status: ${ALLOCATION_STAGE_LABEL[order.stage]}`}
    />
  );
}

type Props = {
  order: Allocation;
  /** Show which demand it is for (in the cart; not on the demand's own page). */
  showDemand?: boolean;
  /** Called after a hold is released, e.g. to show a note. */
  onReleased?: (order: Allocation) => void;
};

/** One order with its lifecycle and the action it needs now. Shared by the cart and the demand detail page. */
export function OrderRow({ order, showDemand = false, onReleased }: Props) {
  const { supply, release, declineOffer } = useBuyer();
  const [paying, setPaying] = useState(false);
  const batch = supply.find((item) => item.code === order.batchCode);
  const pricePerKg = order.pricePerKg ?? batch?.pricePerKg;
  const waiting = order.stage === "offered" || order.stage === "held" || order.stage === "locked";

  return (
    <li id={`order-${order.id}`} className={`ord-card ord-card--${TONE[order.stage]}`}>
      <div className="ord-head">
        <span className="ord-what">
          <strong>
            {formatKg(order.kg)} {batch ? batch.product.toLowerCase() : ""}
          </strong>
          <span>
            {batch ? <Link to={`/buyer/supply/${order.batchCode}`}>{order.batchCode}</Link> : order.batchCode} · {order.producer}
            {batch && <> · {batch.variety}, grade {batch.grade}, sell by {formatDay(batch.sellByDay)}</>}
          </span>
          {showDemand && (
            <small>
              For <Link to={`/buyer/demands/${order.demandId}`}>{order.demandId}</Link>
            </small>
          )}
        </span>
        <span className={`bu-stage bu-stage--${order.stage}`}>{ALLOCATION_STAGE_LABEL[order.stage]}</span>
      </div>

      {order.note && order.stage === "offered" && <p className="ord-note">{order.note}</p>}
      {order.deposit ? (
        <p className="ord-money">
          <Wallet size={14} aria-hidden="true" />
          {order.paidInFull
            ? `Paid in full · ${formatVnd(order.kg * (pricePerKg ?? 0))}`
            : `Deposit ${formatVnd(order.deposit.amount)} paid · ${formatVnd(order.kg * (pricePerKg ?? 0) - order.deposit.amount)} on delivery`}
        </p>
      ) : (
        pricePerKg !== undefined &&
        (order.stage === "locked" || order.stage === "offered") && (
          <p className="ord-money">
            <Wallet size={14} aria-hidden="true" />
            {formatVnd(order.kg * pricePerKg)} · deposit {formatVnd(depositFor(order.kg, pricePerKg, RULES.depositPercent).deposit)} to confirm
          </p>
        )
      )}
      {batch?.issue && (order.stage === "held" || order.stage === "confirmed") && (
        <p className="ph-delivery-problem">
          <TriangleAlert size={14} /> {batch.issue}
        </p>
      )}

      <div className="ord-foot">
        <OrderSteps order={order} />
        <div className="ord-action">
          {order.stage === "locked" && order.lockExpiresAt ? (
            <span className="ord-next is-waiting">
              <Clock size={13} /> Lock ends in <Countdown expiresAt={order.lockExpiresAt} />
            </span>
          ) : (
            <span className={waiting ? "ord-next is-waiting" : "ord-next"}>
              {waiting && <Clock size={13} />} {nextStep(order)}
            </span>
          )}
          {order.stage === "locked" && (
            <>
              <button
                type="button"
                className="ph-text-btn"
                onClick={() => {
                  release(order.id);
                  onReleased?.(order);
                }}
              >
                Release
              </button>
              <button type="button" className="ph-btn ph-btn--primary" onClick={() => setPaying(true)}>
                Pay deposit
              </button>
            </>
          )}
          {order.stage === "offered" && (
            <>
              <button type="button" className="ph-btn" onClick={() => declineOffer(order.id)}>
                Decline
              </button>
              <button type="button" className="ph-btn ph-btn--primary" onClick={() => setPaying(true)}>
                Accept & pay deposit
              </button>
            </>
          )}
          {order.stage === "held" && (
            <button
              type="button"
              className="ph-text-btn"
              onClick={() => {
                release(order.id);
                onReleased?.(order);
              }}
            >
              Release
            </button>
          )}
          {order.deliveryId && (
            <Link to={`/buyer/deliveries/${order.deliveryId}`} className="ph-link-btn">
              {order.stage === "delivered" ? "Proof of delivery" : `Track ${order.deliveryId}`} <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
      {paying && <DepositDialog order={order} onClose={() => setPaying(false)} />}
    </li>
  );
}
