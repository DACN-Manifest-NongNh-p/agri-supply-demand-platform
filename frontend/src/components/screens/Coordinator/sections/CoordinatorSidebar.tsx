import { GitCompareArrows, Inbox, LayoutGrid, LogOut, Moon, Sun, Truck, type LucideIcon } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import { getKeycloakUsername, isKeycloakAuthenticated, logoutFromKeycloak } from "@/lib/keycloak";
import { coordinator } from "../data/mockCoordinator";
import type { Theme } from "../CoordinatorLayout";

export type SidebarCounts = { matching: number; requests: number; deliveries: number };

type Page = { label: string; to: string; end: boolean; icon: LucideIcon; count?: keyof SidebarCounts };

const pages: Page[] = [
  { label: "Overview", to: "/coordinator", end: true, icon: LayoutGrid },
  { label: "Matching", to: "/coordinator/matching", end: false, icon: GitCompareArrows, count: "matching" },
  { label: "Requests", to: "/coordinator/requests", end: false, icon: Inbox, count: "requests" },
  { label: "Deliveries", to: "/coordinator/deliveries", end: false, icon: Truck, count: "deliveries" },
];

type Props = { counts: SidebarCounts; theme: Theme; onToggleTheme: () => void };

/** Left navigation; becomes a top bar on narrow screens. */
export function CoordinatorSidebar({ counts, theme, onToggleTheme }: Props) {
  const authenticated = isKeycloakAuthenticated();
  const username = authenticated ? getKeycloakUsername() : coordinator.name;

  return (
    <header className="co-sidebar">
      <Link to="/coordinator" className="co-brand">
        <img src={logoImage} alt="" />
        <span>Farmora</span>
      </Link>

      <nav className="co-nav" aria-label="Coordinator pages">
        {pages.map(({ label, to, end, icon: Icon, count }) => {
          const value = count ? counts[count] : 0;
          return (
            <NavLink key={to} to={to} end={end}>
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              <span>{label}</span>
              {value > 0 && <em aria-label={`${value} open`}>{value}</em>}
            </NavLink>
          );
        })}
      </nav>

      <div className="co-account">
        <span className="co-account-name">
          {username}
          <small>Coordinator</small>
        </span>
        <button
          type="button"
          className="co-logout"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {authenticated && (
          <button type="button" className="co-logout" onClick={() => void logoutFromKeycloak()} aria-label="Log out">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
