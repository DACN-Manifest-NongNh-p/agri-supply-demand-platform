import { LogOut, ShoppingCart } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import { getKeycloakUsername, isKeycloakAuthenticated, logoutFromKeycloak } from "@/lib/keycloak";
import type { BuyerAlert } from "../data/alerts";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAnnouncementNotices } from "@/components/notifications/announcements";

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
  const authenticated = isKeycloakAuthenticated();
  const username = authenticated ? getKeycloakUsername() : "Demo buyer";
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
        <span className="ph-user">{username}</span>
        {authenticated && (
          <button type="button" className="ph-logout" onClick={() => void logoutFromKeycloak()} aria-label="Log out">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
