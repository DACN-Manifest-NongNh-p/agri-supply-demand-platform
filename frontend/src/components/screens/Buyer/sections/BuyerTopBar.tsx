import { Bell, LogOut } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import { getKeycloakUsername, isKeycloakAuthenticated, logoutFromKeycloak } from "@/lib/keycloak";

const pages = [
  { label: "Home", to: "/buyer", end: true },
  { label: "My demands", to: "/buyer/demands", end: false },
  { label: "Find supply", to: "/buyer/supply", end: false },
  { label: "Deliveries", to: "/buyer/deliveries", end: false },
];

export function BuyerTopBar({ alertCount }: { alertCount: number }) {
  const authenticated = isKeycloakAuthenticated();
  const username = authenticated ? getKeycloakUsername() : "Demo buyer";

  return (
    <header className="ph-topbar">
      <Link to="/buyer" className="ph-brand">
        <img src={logoImage} alt="" />
        <span>Farmora</span>
        <em>Buyer</em>
      </Link>

      <nav className="ph-nav" aria-label="Buyer pages">
        {pages.map((page) => (
          <NavLink key={page.to} to={page.to} end={page.end}>
            {page.label}
          </NavLink>
        ))}
      </nav>

      <div className="ph-account">
        <Link to="/buyer#alerts" className="ph-bell" aria-label={`${alertCount} alerts`}>
          <Bell size={18} />
          {alertCount > 0 && <span>{alertCount}</span>}
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
