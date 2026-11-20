// Buyer home: what waits for you and what is on its way; "+ New" starts any kind of purchase.
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarClock, ChevronDown, ClipboardList, Clock, Gavel, ListOrdered, MapPin, Megaphone, Pencil, Plus, Sprout, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useNow } from "@/components/orders/useNow";
import { useProfile } from "@/components/profile/profileStore";
import { DeliveryCard } from "../Producer/sections/DeliveryCard";
import { deliveryStatus, sortDeliveries } from "../Producer/data/deliveries";
import { greeting } from "../Producer/data/format";
import { deliveries } from "./data/mockBuyer";
import { SESSION_TYPE_LABEL, VERIFICATION_LABEL } from "./model/catalog";
import { answerAuctionAllocation, confirmMatch, pendingActions, tradable, upcomingSlot, useBuyerData } from "./model/store";
import { addDays, formatDate, formatLeft, formatTime, todayIso } from "./model/time";
import type { Errors } from "./model/validation";
import { kg, perKg, vnd } from "./ui/format";
import { ConfirmFacts, FormError, ReasonDialog } from "./ui/parts";

type Decision = {
  id: string;
  title: string;
  meta: string;
  to: string;
  deadline?: number;
  /** Share of something already done, for the small track (order filled, demand covered). */
  progress?: number;
  badge: string;
};

/** Hero: the most urgent result to confirm, and the other things waiting for the buyer. */
function DecisionHero() {
  const data = useBuyerData();
  const now = useNow(30_000);
  const [errors, setErrors] = useState<Errors>({});
  const [confirming, setConfirming] = useState(false);
  const pending = pendingActions(data, now);

  const match = [...pending.matches].sort((a, b) => a.deadline - b.deadline)[0];
  const won = [...pending.auctionResults].sort((a, b) => a.deadline - b.deadline)[0];
  const featured = match && (!won || match.deadline <= won.deadline) ? { kind: "match" as const, match } : won ? { kind: "auction" as const, won } : undefined;

  const others: Decision[] = [
    ...pending.matches
      .filter((item) => item !== match || featured?.kind !== "match")
      .map((item) => ({ id: item.code, title: `Confirm ${kg(item.quantity)} ${item.crop.toLowerCase()}`, meta: `${item.code} · ${perKg(item.clearingPrice)}`, to: `/buyer/orders/${item.buyOrderCode}`, deadline: item.deadline, badge: "Match" })),
    ...pending.auctionResults
      .filter((item) => item !== won || featured?.kind !== "auction")
      .map((item) => ({ id: item.id, title: `Confirm ${kg(item.quantity)} won at auction`, meta: `${item.auctionCode} · ${perKg(item.acceptedPrice)}`, to: `/buyer/auctions/${item.auctionCode}`, deadline: item.deadline, badge: "Auction" })),
    ...pending.counters.map((item) => ({ id: item.code, title: `${item.supplier} countered`, meta: `${item.code} · demand ${item.demandCode}`, to: `/buyer/demands/${item.demandCode}`, badge: "Counter" })),
    ...pending.declinedAwards.map((item) => ({ id: item.id, title: `Replace ${item.supplier}`, meta: `${item.demandCode} · ${kg(item.quantity)} released`, to: `/buyer/demands/${item.demandCode}`, badge: "Declined" })),
    ...pending.toEvaluate.map((item) => {
      const count = data.proposals.filter((proposal) => proposal.demandCode === item.code && ["SUBMITTED", "UNDER_REVIEW"].includes(proposal.status)).length;
      return { id: item.code, title: `Evaluate ${kg(item.quantity)} ${item.crop.toLowerCase()}`, meta: `${item.code} · ${count} proposals`, to: `/buyer/demands/${item.code}`, badge: `${count} proposals` };
    }),
  ];
  const total = others.length + (featured ? 1 : 0);

  return (
    <section className="ph-match-hero" aria-labelledby="decide-title">
      <div className="ph-match-hero-head">
        <div>
          <p className="ph-match-hero-eyebrow">Needs you</p>
          <h2 id="decide-title">{total === 0 ? "Nothing waits for your answer" : `${total} ${total === 1 ? "decision waits" : "decisions wait"} for you`}</h2>
        </div>
        <Link to="/buyer/orders?tab=matches" className="ph-match-hero-link">
          All results <ArrowRight size={16} />
        </Link>
      </div>

      {featured ? (
        <div className="ph-match-hero-body">
          <article className="ph-featured" aria-label="Most urgent">
            <p className="ph-featured-tag">Most urgent</p>
            {(() => {
              const isMatch = featured.kind === "match";
              const auction = !isMatch ? data.auctions.find((item) => item.code === featured.won.auctionCode)! : undefined;
              const quantity = isMatch ? featured.match.quantity : featured.won.quantity;
              const price = isMatch ? featured.match.clearingPrice : featured.won.acceptedPrice;
              const deadline = isMatch ? featured.match.deadline : featured.won.deadline;
              const crop = isMatch ? featured.match.crop : auction!.crop;
              const variety = isMatch ? featured.match.variety : auction!.variety;
              const supplier = isMatch ? featured.match.supplier : auction!.supplier;
              const lotCode = isMatch ? featured.match.lotCode : auction!.lotCode;
              const review = isMatch ? `/buyer/orders/${featured.match.buyOrderCode}` : `/buyer/auctions/${auction!.code}`;
              return (
                <>
                  <div className="bu-featured-head">
                    <p className="bu-featured-title">
                      {kg(quantity)} {crop.toLowerCase()}
                      <small>{isMatch ? `match ${featured.match.code} · buy order ${featured.match.buyOrderCode}` : `won at auction ${auction!.code}`}</small>
                    </p>
                  </div>

                  <div className="ph-featured-pair">
                    <div className="ph-featured-side">
                      <p className="ph-featured-kicker">
                        <ClipboardList size={14} /> {isMatch ? "Clearing price" : "Your bid"}
                      </p>
                      <p className="ph-featured-name">
                        {variety} · {kg(quantity)}
                      </p>
                      <p className="ph-featured-big">{perKg(price)}</p>
                      <p className="ph-featured-meta">{vnd(quantity * price)} in total</p>
                    </div>

                    <div className="ph-featured-link" aria-hidden="true">
                      <span className="ph-featured-line" />
                      <span className="bf-deadline">
                        <Clock size={16} />
                        <strong>{formatLeft(deadline - now)}</strong>
                        <small>to confirm</small>
                      </span>
                      <span className="ph-featured-line" />
                    </div>

                    <div className="ph-featured-side ph-featured-side--batch">
                      <p className="ph-featured-kicker">
                        <Sprout size={14} /> Supplier
                      </p>
                      <p className="ph-featured-name">{supplier}</p>
                      <p className="ph-featured-big bf-featured-state">{isMatch ? (featured.match.supplierSide === "CONFIRMED" ? "Confirmed" : "Not yet") : "Selected you"}</p>
                      <p className="ph-featured-meta">
                        Lot <Link to={`/buyer/market/${lotCode}`}>{lotCode}</Link>
                      </p>
                    </div>
                  </div>

                  <FormError errors={errors} />
                  <div className="ph-featured-actions">
                    <button
                      type="button"
                      className="ph-btn ph-btn--primary ph-btn--large"
                      onClick={() => setConfirming(true)}
                    >
                      {isMatch ? "Confirm match" : "Confirm result"}
                    </button>
                    <ReasonDialog
                      open={confirming}
                      noReason
                      title={`Confirm ${kg(quantity)} ${crop.toLowerCase()}?`}
                      text="Once you confirm, you cannot change your answer."
                      confirmLabel="Yes, confirm"
                      extra={
                        <ConfirmFacts
                          rows={[
                            ["Quantity", kg(quantity)],
                            ["Price", perKg(price)],
                            ["Total value", <strong key="v">{vnd(quantity * price)}</strong>],
                          ]}
                          note={isMatch ? "When the supplier confirms too, a transaction is created." : "A transaction with the supplier is created right away."}
                        />
                      }
                      onClose={() => setConfirming(false)}
                      onConfirm={() => {
                        const result = isMatch ? confirmMatch(featured.match.code) : answerAuctionAllocation(featured.won.id, "CONFIRM");
                        setErrors(result.ok ? {} : result.errors);
                        return result.ok ? null : result.errors;
                      }}
                    />
                    <Link to={review} className="ph-link-btn">
                      {isMatch ? "Review or reject" : "Review or decline"} <ArrowRight size={14} />
                    </Link>
                  </div>
                </>
              );
            })()}
          </article>

          <aside className="ph-match-more" aria-label="Also waiting">
            <p className="ph-match-more-title">Also waiting</p>
            {others.length === 0 ? (
              <p className="ph-match-more-meta">Nothing else.</p>
            ) : (
              <ul>
                {others.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <Link to={item.to} className="bu-more-link">
                      <p className="ph-match-more-buyer">{item.title}</p>
                      <p className="ph-match-more-meta">
                        {item.meta}
                        {item.deadline && ` · ${formatLeft(item.deadline - now)} left`}
                      </p>
                    </Link>
                    <span className="bu-more-count">{item.badge}</span>
                  </li>
                ))}
              </ul>
            )}
            {others.length > 3 && (
              <Link to="/buyer/demands" className="ph-match-more-unmatched">
                {others.length - 3} more <ArrowRight size={14} />
              </Link>
            )}
          </aside>
        </div>
      ) : others.length > 0 ? (
        <div className="ph-match-hero-body">
          <aside className="ph-match-more" aria-label="Waiting">
            <ul>
              {others.map((item) => (
                <li key={item.id}>
                  <Link to={item.to} className="bu-more-link">
                    <p className="ph-match-more-buyer">{item.title}</p>
                    <p className="ph-match-more-meta">{item.meta}</p>
                  </Link>
                  <span className="bu-more-count">{item.badge}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : (
        <p className="ph-match-hero-empty">
          <Link to="/buyer/orders/new">Place a buy order</Link> for the next session, or <Link to="/buyer/market">browse the market</Link>.
        </p>
      )}
    </section>
  );
}

/** Every order of the buyer by where it stands, from placed to received. Each row opens the list. */
function OrderPipeline() {
  const data = useBuyerData();
  const now = useNow(30_000);
  const pending = pendingActions(data, now);
  const live = data.buyOrders.filter((order) => order.status === "OPEN" || order.status === "PARTIALLY_FILLED");
  const openDemands = data.demands.filter((demand) => ["PUBLISHED", "CLOSED", "UNDER_EVALUATION"].includes(demand.status));
  const bids = data.bids.filter((bid) => bid.status === "SUBMITTED");
  const tx = data.transactions.filter((item) => item.status !== "CANCELLED");
  const onRoad = tx.filter((item) => item.deliveryId && deliveries.find((delivery) => delivery.id === item.deliveryId && delivery.step < 3));
  const rows = [
    { label: "Waiting to match", count: live.length + openDemands.length + bids.length, to: "/buyer/orders" },
    { label: "To confirm", count: pending.matches.length + pending.auctionResults.length, to: "/buyer/orders?tab=matches" },
    { label: "Term sheet & contract", count: tx.filter((item) => ["CONFIRMED", "PENDING_TERM_SHEET", "PENDING_CONTRACT"].includes(item.status)).length, to: "/buyer/transactions" },
    { label: "On the road", count: onRoad.length, to: "/buyer/transactions" },
    { label: "Received", count: tx.filter((item) => item.status === "COMPLETED").length, to: "/buyer/transactions" },
  ];
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <section className="ph-card bu-pipeline" aria-labelledby="pipeline-title">
      <div className="ph-section-head">
        <h2 id="pipeline-title">My orders</h2>
        <Link to="/buyer/transactions" className="ph-link-btn">
          All <ArrowRight size={14} />
        </Link>
      </div>
      <ul>
        {rows.map((row) => (
          <li key={row.label}>
            <Link to={row.to}>
              <span className="bu-pipeline-label">{row.label}</span>
              <span className="bu-pipeline-bar" aria-hidden="true">
                <span style={{ width: `${(row.count / max) * 100}%` }} />
              </span>
              <strong>{row.count}</strong>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CompanyCard() {
  const data = useBuyerData();
  const now = useNow(30_000);
  const slot = upcomingSlot(now, data);
  const main = data.addresses[0];
  return (
    <section className="ph-farm" aria-labelledby="company-title">
      <p className="ph-eyebrow">Your company · {VERIFICATION_LABEL[data.profile.status].toLowerCase()}</p>
      <h2 id="company-title">{data.profile.businessName}</h2>
      {main && (
        <p className="ph-farm-meta">
          <MapPin size={14} /> {main.label}, {main.district}
          {data.addresses.length > 1 && ` +${data.addresses.length - 1} more`}
        </p>
      )}
      <ul className="ph-tags">
        {data.profile.procurementCategories.map((product) => (
          <li key={product}>{product}</li>
        ))}
      </ul>
      <p className="ph-farm-contact">
        <CalendarClock size={14} /> Next session {formatTime(slot.scheduled)}
        {slot.date !== todayIso() && " tomorrow"} ({SESSION_TYPE_LABEL[slot.type].toLowerCase()}) · book closes in {formatLeft(slot.cutoff - now)}
      </p>
      <Link to="/buyer/company" className="ph-link-btn">
        <Pencil size={14} /> Business profile
      </Link>
    </section>
  );
}

/** Shipments of confirmed trades on their way, as delivery tickets. */
function OnTheWay() {
  const data = useBuyerData();
  const linked = new Set(data.transactions.map((item) => item.deliveryId).filter(Boolean));
  const active = sortDeliveries(
    deliveries.filter((item) => linked.has(item.id)),
    data.deliveryIssues,
  ).filter((delivery) => deliveryStatus(delivery, data.deliveryIssues[delivery.id]) !== "delivered");
  return (
    <section className="ph-deliveries" aria-labelledby="deliveries-title">
      <div className="ph-section-head">
        <div>
          <h2 id="deliveries-title">On the way to you</h2>
          <p className="ph-section-sub">
            {active.length} {active.length === 1 ? "shipment" : "shipments"} in transit
          </p>
        </div>
        <Link to="/buyer/transactions" className="ph-btn">
          Transactions <ArrowRight size={16} />
        </Link>
      </div>
      {active.length === 0 ? (
        <p className="ph-muted">Nothing on the road right now.</p>
      ) : (
        <ul className="ph-trips">
          {active.slice(0, 2).map((delivery) => (
            <li key={delivery.id}>
              <DeliveryCard delivery={delivery} reported={data.deliveryIssues[delivery.id]} to={`/buyer/deliveries/${delivery.id}`} title={`${delivery.product} from ${delivery.producer}`} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type WeekItem = { id: string; kind: "due" | "arrives"; title: string; detail: string; to: string };

const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

/** The next seven days: delivery windows of orders and demands, and shipments arriving. */
function WeekAhead() {
  const data = useBuyerData();
  const today = todayIso();
  const days = Array.from({ length: 7 }, (_, index) => ({ date: addDays(today, index), items: [] as WeekItem[] }));
  const put = (date: string, item: WeekItem) => days.find((day) => day.date === date)?.items.push(item);

  for (const order of data.buyOrders) {
    if (order.status !== "OPEN" && order.status !== "PARTIALLY_FILLED") continue;
    put(order.deliveryStart >= today ? order.deliveryStart : today, { id: order.code, kind: "due", title: order.code, detail: `${kg(order.remaining)} ${order.crop.toLowerCase()}`, to: `/buyer/orders/${order.code}` });
  }
  for (const demand of data.demands) {
    if (!["PUBLISHED", "CLOSED", "UNDER_EVALUATION", "AWARDED"].includes(demand.status)) continue;
    put(demand.deliveryFrom, { id: demand.code, kind: "due", title: demand.code, detail: `${kg(demand.quantity)} ${demand.crop.toLowerCase()}`, to: `/buyer/demands/${demand.code}` });
  }
  const linked = new Set(data.transactions.map((item) => item.deliveryId).filter(Boolean));
  for (const delivery of deliveries) {
    if (!linked.has(delivery.id) || delivery.step >= 3) continue;
    const offset = /^today/i.test(delivery.eta) ? 0 : /^tomorrow/i.test(delivery.eta) ? 1 : undefined;
    if (offset === undefined) continue;
    put(addDays(today, offset), { id: delivery.id, kind: "arrives", title: `${delivery.id} arrives`, detail: `${kg(delivery.quantityKg)} ${delivery.product.toLowerCase()}`, to: `/buyer/deliveries/${delivery.id}` });
  }

  return (
    <section className="ph-card bu-week" aria-labelledby="week-title">
      <div className="ph-section-head">
        <h2 id="week-title">This week</h2>
        <span className="bu-week-legend" aria-hidden="true">
          <span>
            <CalendarClock size={13} /> delivery window
          </span>
          <span>
            <Truck size={13} /> arriving
          </span>
        </span>
      </div>
      {days.every((day) => day.items.length === 0) ? (
        <p className="ph-muted">Nothing scheduled in the next 7 days.</p>
      ) : (
        <ol className="bf-agenda">
          {days
            .map((day, index) => ({ ...day, index }))
            .filter((day) => day.items.length > 0)
            .map((day) => (
              <li key={day.date} className={day.index === 0 ? "is-today" : undefined}>
                <span className="bf-agenda-date">
                  <small>{day.index === 0 ? "Today" : day.index === 1 ? "Tomorrow" : weekday.format(new Date(`${day.date}T12:00:00Z`))}</small>
                  <strong>{Number(day.date.slice(8))}</strong>
                </span>
                <span className="bf-agenda-items">
                  {day.items.map((item) => (
                    <Link key={item.id} to={item.to} className={`bf-agenda-item bf-agenda-item--${item.kind}`}>
                      {item.kind === "due" ? <CalendarClock size={14} aria-hidden="true" /> : <Truck size={14} aria-hidden="true" />}
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </Link>
                  ))}
                </span>
              </li>
            ))}
        </ol>
      )}
    </section>
  );
}

/** Lots of what the buyer usually buys, with the last clearing price for the same product. */
function OnTheMarket() {
  const data = useBuyerData();
  const usual = data.profile.procurementCategories;
  const lots = data.lots
    .filter((lot) => tradable(lot) && (usual.length === 0 || usual.includes(lot.crop)))
    .sort((a, b) => a.availableFrom.localeCompare(b.availableFrom))
    .slice(0, 4);
  return (
    <section className="ph-card bu-market" aria-labelledby="market-title">
      <div className="ph-section-head">
        <div>
          <h2 id="market-title">On the market</h2>
          <p className="ph-section-sub">What you usually buy, soonest available first.</p>
        </div>
        <Link to="/buyer/market" className="ph-link-btn">
          Market <ArrowRight size={14} />
        </Link>
      </div>
      <ul className="bu-market-grid">
        {lots.map((lot) => {
          const price = [...data.prices].filter((item) => item.crop === lot.crop).sort((a, b) => b.at - a.at)[0];
          return (
            <li key={lot.code}>
              <Link to={`/buyer/market/${lot.code}`} className="bu-market-card">
                <span className="bu-market-top">
                  <strong>
                    {lot.crop} <span>{lot.variety}</span>
                  </strong>
                  <span className="bu-market-grade">Grade {lot.grade}</span>
                </span>
                <span className="bu-market-kg">{kg(lot.available)}</span>
                <span className="bu-market-meta">
                  {lot.availableFrom <= todayIso() ? "Available now" : `From ${formatDate(lot.availableFrom)}`} · {lot.supplier}
                </span>
                <span className={price ? "bu-market-fit bu-market-fit--yes" : "bu-market-fit"}>{price ? `Last cleared at ${perKg(price.price)}` : "No clearing price yet"}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** "+ New" in the greeting: the three ways to start a purchase, in one menu. */
function NewMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  const items = [
    { icon: ListOrdered, label: "Buy order", hint: "Buy at the market price", to: "/buyer/orders/new" },
    { icon: Megaphone, label: "Demand", hint: "Ask suppliers for offers", to: "/buyer/demands/new" },
    { icon: Gavel, label: "Bid in an auction", hint: "Bid on a supplier's harvest", to: "/buyer/auctions" },
  ];
  return (
    <div className="bf-new" ref={ref}>
      <button type="button" className="ph-btn ph-btn--primary ph-btn--large" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
        <Plus size={18} /> New <ChevronDown size={16} className={open ? "ph-flip" : undefined} />
      </button>
      {open && (
        <div className="bf-navmenu-panel bf-new-panel" role="menu">
          {items.map((item) => (
            <Link key={item.to} to={item.to} role="menuitem" className="bf-navmenu-item" onClick={() => setOpen(false)}>
              <span className="bf-navmenu-icon">
                <item.icon size={18} />
              </span>
              <span className="bf-navmenu-text">
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BuyerHome() {
  const data = useBuyerData();
  const profile = useProfile("buyer");
  const pending = pendingActions(data);
  const waiting = pending.matches.length + pending.auctionResults.length;
  return (
    <main className="ph-main bf-home">
      <section className="ph-hello">
        <div>
          <p className="ph-eyebrow">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1>
            {greeting()}, {profile.name.split(" ").at(-1)}.
          </h1>
        </div>
        <NewMenu />
      </section>

      {waiting + pending.counters.length + pending.toEvaluate.length + pending.declinedAwards.length > 0 && <DecisionHero />}

      <div className="ph-columns">
        <div className="ph-col-main">
          <OnTheWay />
          <WeekAhead />
          <OnTheMarket />
        </div>
        <aside className="ph-col-side">
          <OrderPipeline />
          <CompanyCard />
        </aside>
      </div>
    </main>
  );
}
