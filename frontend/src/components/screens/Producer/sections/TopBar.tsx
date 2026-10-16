import { Bell, LogOut } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import { getKeycloakUsername, isKeycloakAuthenticated, logoutFromKeycloak } from "@/lib/keycloak";

const pages = [
  { label: "Home", to: "/producer", end: true },
  { label: "Matches", to: "/producer/demand", end: false },
  { label: "Orders", to: "/producer/orders", end: false },
  // Batches also covers the pre-harvest auctions (a tab inside it).
  { label: "Batches", to: "/producer/batches", end: false, also: "/producer/auctions" },
];

export function TopBar({ openTasks, ordersToConfirm }: { openTasks: number; ordersToConfirm: number }) {
  const authenticated = isKeycloakAuthenticated();
  const username = authenticated ? getKeycloakUsername() : "Demo producer";
  const { pathname } = useLocation();

  return (
    <header className="ph-topbar">
      <Link to="/producer" className="ph-brand">
        <img src={logoImage} alt="" />
        <span>Farmora</span>
        <em>Producer</em>
      </Link>

      <nav className="ph-nav" aria-label="Producer pages">
        {pages.map((page) => (
          <NavLink
            key={page.to}
            to={page.to}
            end={page.end}
            className={"also" in page && page.also && pathname.startsWith(page.also) ? "is-active" : undefined}
          >
            {page.label}
            {page.to === "/producer/orders" && ordersToConfirm > 0 && (
              <span className="ph-nav-count" aria-label={`${ordersToConfirm} to confirm`}>
                {ordersToConfirm}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="ph-account">
        <Link to="/producer#attention" className="ph-bell" aria-label={`${openTasks} items need your attention`}>
          <Bell size={18} />
          {openTasks > 0 && <span>{openTasks}</span>}
        </Link>
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
