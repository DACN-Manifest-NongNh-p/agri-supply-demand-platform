import { LogOut, Moon, Sun, type LucideIcon } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import { getKeycloakUsername, isKeycloakAuthenticated, logoutFromKeycloak } from "@/lib/keycloak";
import type { Theme } from "../data/theme";
import { NotificationBell, type Notice } from "@/components/notifications/NotificationBell";

export type SidebarPage = { label: string; to: string; end?: boolean; icon: LucideIcon; count?: number };

type Props = {
  home: string;
  pages: SidebarPage[];
  /** Shown under the name, e.g. "Coordinator". */
  roleLabel: string;
  /** Name shown when nobody is signed in (demo). */
  fallbackName: string;
  theme: Theme;
  onToggleTheme: () => void;
  /** What needs this user; shown under the bell next to the brand. */
  notifications: Notice[];
};

/** Left navigation for the sidebar areas; becomes a top bar on narrow screens. */
export function AreaSidebar({ home, pages, roleLabel, fallbackName, theme, onToggleTheme, notifications }: Props) {
  const authenticated = isKeycloakAuthenticated();
  const username = authenticated ? getKeycloakUsername() : fallbackName;

  return (
    <header className="co-sidebar">
      <div className="co-sidebar-top">
        <Link to={home} className="co-brand">
          <img src={logoImage} alt="" />
          <span>Farmora</span>
        </Link>
        <NotificationBell items={notifications} align="left" />
      </div>

      <nav className="co-nav" aria-label={`${roleLabel} pages`}>
        {pages.map(({ label, to, end, icon: Icon, count = 0 }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>{label}</span>
            {count > 0 && <em aria-label={`${count} open`}>{count}</em>}
          </NavLink>
        ))}
      </nav>

      <div className="co-account">
        <span className="co-account-name">
          {username}
          <small>{roleLabel}</small>
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
