import { Building2, ShoppingCart } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import type { BuyerAlert } from "../data/alerts";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAnnouncementNotices } from "@/components/notifications/announcements";
import { ProfileMenu } from "@/components/profile/ProfileMenu";

const pages = [
  { label: "Home", to: "/buyer", end: true },
  { label: "My demands", to: "/buyer/demands", end: false },
  // Find supply also covers the pre-harvest auctions (a tab inside it).
  { label: "Find supply", to: "/buyer/supply", end: false, also: "/buyer/auctions" },
];

type Props = {
  alerts: BuyerAlert[];
  onDismiss: (id: string) => void;
  /** Orders still being settled (on hold or offered), shown on the cart. */
  cartCount: number;
  /** Some of them are offers waiting for your answer. */
  cartNeedsYou: boolean;
};

export function BuyerTopBar({ alerts, onDismiss, cartCount, cartNeedsYou }: Props) {
  // Admin announcements come first under the bell, then the buyer's own alerts.
  const announcements = useAnnouncementNotices("BUYER");
  const { pathname } = useLocation();

  return (
    <header className="ph-topbar">
      <Link to="/buyer" className="ph-brand">
        <img src={logoImage} alt="" />
        <span>Farmora</span>
        <em>Buyer</em>
      </Link>

      <nav className="ph-nav" aria-label="Buyer pages">
        {pages.map((page) => (
          <NavLink
            key={page.to}
            to={page.to}
            end={page.end}
            className={"also" in page && page.also && pathname.startsWith(page.also) ? "is-active" : undefined}
          >
            {page.label}
          </NavLink>
        ))}
      </nav>

      <div className="ph-account">
        <NotificationBell
          items={[...announcements.notices, ...alerts]}
          onDismiss={(id) => {
            if (!announcements.dismiss(id)) onDismiss(id);
          }}
        />
        <NavLink to="/buyer/orders" className="bu-cart" aria-label={`Cart, ${cartCount} orders being settled`} title="Cart">
          <ShoppingCart size={18} />
          {cartCount > 0 && <span className={cartNeedsYou ? "nb-count is-urgent" : "nb-count"}>{cartCount}</span>}
        </NavLink>
        <ProfileMenu area="buyer" roleLabel="Buyer" links={[{ label: "Company & delivery points", to: "/buyer/company", icon: Building2 }]} />
      </div>
    </header>
  );
}
