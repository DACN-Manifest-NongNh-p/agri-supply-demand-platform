// "Farmora in 30 seconds": what the site is, who uses it, and one whole deal shown on both screens.
import { ArrowRight, Check, Handshake, CheckCircle2, Clock, PackagePlus, ShoppingCart, Sprout, Store, Truck } from "lucide-react";
import { DemoPlayer, Typed, type DemoStep } from "./DemoPlayer";
import { Eyebrow, Reveal } from "./Reveal";
import { ACCENT, focus } from "./demoFocus";
import "../styles/Overview.css";

const STEPS: DemoStep[] = [
  { title: "Supplier lists", ms: 2800, caption: "A cooperative publishes what it harvested: 3,000 kg of mango, grade A", cursor: [22, 46], click: true },
  { title: "Buyer orders", ms: 2600, caption: "A supermarket buyer orders 1,500 kg and sets the most it will pay", cursor: [78, 46], click: true },
  { title: "Fair price", ms: 2600, caption: "Farmora matches them at a fair market price", cursor: [50, 40] },
  { title: "Both confirm", ms: 2400, caption: "Both sides confirm: the deal is done", cursor: [78, 78], click: true },
  { title: "Delivered", ms: 3000, caption: "The goods are shipped and tracked to the supermarket's door", cursor: [50, 82] },
];

const on = (step: number, from: number) => step >= from;

export function OverviewDemo() {
  return (
    <DemoPlayer
      name="One deal, start to finish"
      icon={Handshake}
      accent={ACCENT.overview}
      label="Demo: one deal from harvest to delivery"
      url="/"
      steps={STEPS}
      render={(s) => (
        <div className="ov-screen">
          <div className={focus(s === 0, "dm-card ov-side")}>
            <p className="dm-kicker">
              <Sprout size={12} /> Supplier · Thuan Nam Cooperative
            </p>
            <div className="dm-field">
              <small>New supply lot</small>
              <div className="dm-input">
                <Typed text="Mango · 3,000 kg · Grade A" active={s === 0} done={s > 0} />
              </div>
            </div>
            <span className={s === 0 ? "dm-btn dm-btn--primary is-pressed" : "dm-btn dm-btn--primary"}>
              <PackagePlus size={14} /> {on(s, 1) ? "Published" : "Publish lot"}
            </span>
            {on(s, 3) && (
              <span className="dm-pill dm-pill--good dm-pop">
                <CheckCircle2 size={14} /> Sale confirmed
              </span>
            )}
          </div>

          <div className="ov-middle">
            <span className={on(s, 2) ? "ov-hub is-on" : "ov-hub"}>Farmora</span>
            {on(s, 2) && (
              <span className="ov-price dm-pop dm-focus">
                1,500 kg
                <b>31,800 ₫/kg</b>
              </span>
            )}
          </div>

          <div className={focus(s === 1 || s === 3, "dm-card ov-side")}>
            <p className="dm-kicker">
              <Store size={12} /> Buyer · GreenBasket Supermarkets
            </p>
            {on(s, 1) && (
              <div className="ov-lot dm-pop">
                <span>Mango · Grade A</span>
                <b>3,000 kg available</b>
              </div>
            )}
            <div className="dm-field">
              <small>Buy order</small>
              <div className="dm-input">
                <Typed text="1,500 kg · at most 33,000 ₫/kg" active={s === 1} done={s > 1} />
              </div>
            </div>
            {on(s, 3) ? (
              <span className="dm-pill dm-pill--good dm-pop">
                <CheckCircle2 size={14} /> Purchase confirmed
              </span>
            ) : (
              <span className={s === 1 ? "dm-btn dm-btn--primary is-pressed" : "dm-btn dm-btn--primary"}>
                <ShoppingCart size={14} /> {on(s, 2) ? "Confirm" : "Place order"}
              </span>
            )}
          </div>

          <div className={focus(s === 4, "ov-road")}>
            {s === 4 ? (
              <div className="dm-route">
                <span className="dm-route-end">Binh Thuan farm</span>
                <span className="dm-road">
                  <span className="dm-truck">
                    <Truck size={18} />
                  </span>
                </span>
                <span className="dm-route-end">Supermarket, HCMC</span>
              </div>
            ) : (
              <p className="dm-muted ov-wait">
                <Clock size={13} /> {on(s, 3) ? "Shipment being arranged…" : "Delivery starts once both sides confirm"}
              </p>
            )}
          </div>
        </div>
      )}
    />
  );
}

const ROLES = [
  {
    icon: Sprout,
    title: "If you sell",
    who: "Farms, cooperatives, producers",
    items: ["Publish the produce you have, with grade and certificates", "Sell at the market price three times a day", "Answer buyers who post what they need", "Auction a harvest to the best buyers"],
  },
  {
    icon: Store,
    title: "If you buy",
    who: "Supermarkets, wholesalers, processors, exporters",
    items: ["Order at a price you choose; get matched automatically", "Ask suppliers for offers and pick the best", "Bid on a supplier's harvest", "Follow every deal through contract and delivery"],
  },
];

export function Overview() {
  return (
    <section id="what" className="overview-section">
      <div className="overview-grid">
        <Reveal className="overview-copy">
          <Eyebrow>Farmora in 30 seconds</Eyebrow>
          <h2 className="editorial overview-title">An online market where farms sell produce to businesses that buy it.</h2>
          <p className="overview-intro">
            Suppliers list what they harvested. Buyers order what they need. Farmora matches them at a fair price, both sides confirm, and the deal is followed until the goods arrive.
          </p>
          <div className="overview-roles">
            {ROLES.map((role) => (
              <div key={role.title} className="overview-role">
                <p className="overview-role-head">
                  <role.icon size={18} /> <strong>{role.title}</strong>
                </p>
                <small>{role.who}</small>
                <ul>
                  {role.items.map((item) => (
                    <li key={item}>
                      <Check size={14} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <a href="#how-it-works" className="overview-link">
            See the steps <ArrowRight size={14} />
          </a>
        </Reveal>
        <Reveal delay={120} className="overview-demo">
          <OverviewDemo />
        </Reveal>
      </div>
    </section>
  );
}
