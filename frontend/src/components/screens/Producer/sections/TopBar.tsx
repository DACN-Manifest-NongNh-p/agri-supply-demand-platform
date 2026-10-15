import { Bell, LogOut } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import { getKeycloakUsername, isKeycloakAuthenticated, logoutFromKeycloak } from "@/lib/keycloak";

const pages = [
  { label: "Home", to: "/producer", end: true },
  { label: "Market demand", to: "/producer/demand", end: false },
  { label: "Batches", to: "/producer/batches", end: false },
  { label: "Deliveries", to: "/producer/deliveries", end: false },
];

export function TopBar({ openTasks }: { openTasks: number }) {
  const authenticated = isKeycloakAuthenticated();
  const username = authenticated ? getKeycloakUsername() : "Demo producer";

  return (
    <header className="ph-topbar">
      <Link to="/producer" className="ph-brand">
        <img src={logoImage} alt="" />
        <span>Farmora</span>
        <em>Producer</em>
      </Link>

      <nav className="ph-nav" aria-label="Producer pages">
        {pages.map((page) => (
          <NavLink key={page.to} to={page.to} end={page.end}>
            {page.label}
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
