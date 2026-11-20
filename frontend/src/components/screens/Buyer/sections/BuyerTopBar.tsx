import { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown, Gavel, ListOrdered, MapPin, Megaphone } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAnnouncementNotices } from "@/components/notifications/announcements";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { useUnreadCount } from "@/lib/messageStore";
import { TRADING_PATHS } from "../model/nav";
import { dismissNotice, pendingActions, SELF, useBuyerData } from "../model/store";

/** "Trading" opens a menu of the three ways to trade, so there is only one navigation bar. */
function TradingMenu({ active, count }: { active: boolean; count: number }) {
  const data = useBuyerData();
  const pending = pendingActions(data);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const items = [
    { label: "Buy orders", hint: "Buy at the market price, matched 3× a day", to: "/buyer/orders", icon: ListOrdered, count: pending.matches.length },
    { label: "Demands", hint: "Ask suppliers for offers, pick the best", to: "/buyer/demands", icon: Megaphone, count: pending.toEvaluate.length + pending.counters.length + pending.declinedAwards.length },
    { label: "Auctions", hint: "Bid on a supplier's harvest", to: "/buyer/auctions", icon: Gavel, count: pending.auctionResults.length },
  ];

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

  return (
    <div className="bf-navmenu" ref={ref}>
      <button type="button" className={active ? "bf-navmenu-btn active is-active" : "bf-navmenu-btn"} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
        Trading
        {count > 0 && (
          <span className="ph-nav-count" aria-label={`${count} need you`}>
            {count}
          </span>
        )}
        <ChevronDown size={15} className={open ? "ph-flip" : undefined} />
      </button>
      {open && (
        <div className="bf-navmenu-panel" role="menu">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              className={pathname.startsWith(item.to) ? "bf-navmenu-item is-current" : "bf-navmenu-item"}
              onClick={() => setOpen(false)}
            >
              <span className="bf-navmenu-icon">
                <item.icon size={18} />
              </span>
              <span className="bf-navmenu-text">
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
              {item.count > 0 && <span className="ph-count-badge is-alert">{item.count}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function BuyerTopBar() {
  const announcements = useAnnouncementNotices("BUYER");
  const unread = useUnreadCount(SELF);
  const data = useBuyerData();
  const { pathname } = useLocation();
  const pending = pendingActions(data);
  const tradingCount =
    pending.matches.length + pending.auctionResults.length + pending.toEvaluate.length + pending.counters.length + pending.declinedAwards.length;
  const inTrading = TRADING_PATHS.some((path) => pathname.startsWith(path));

  return (
    <header className="ph-topbar">
      <Link to="/buyer" className="ph-brand">
        <img src={logoImage} alt="" />
        <span>Farmora</span>
        <em>Buyer</em>
      </Link>

      <nav className="ph-nav" aria-label="Buyer pages">
        <NavLink to="/buyer" end>
          Home
        </NavLink>
        <NavLink to="/buyer/market">Market</NavLink>
        <TradingMenu active={inTrading} count={tradingCount} />
        <NavLink to="/buyer/transactions">Transactions</NavLink>
        <NavLink to="/buyer/messages">
          Messages
          {unread > 0 && (
            <span className="ph-nav-count" aria-label={`${unread} unread`}>
              {unread}
            </span>
          )}
        </NavLink>
      </nav>

      <div className="ph-account">
        <NotificationBell
          items={[...announcements.notices, ...data.notices]}
          onDismiss={(id) => {
            if (!announcements.dismiss(id)) dismissNotice(id);
          }}
        />
        <ProfileMenu
          area="buyer"
          roleLabel="Buyer"
          links={[
            { label: "Business profile & verification", to: "/buyer/company", icon: Building2 },
            { label: "Delivery points", to: "/buyer/delivery-points", icon: MapPin },
          ]}
        />
      </div>
    </header>
  );
}
