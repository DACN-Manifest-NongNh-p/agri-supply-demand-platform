import { Bell } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import { ProfileMenu } from "@/components/profile/ProfileMenu";

const pages = [
  { label: "Home", to: "/producer", end: true },
  { label: "Matches", to: "/producer/demand", end: false },
  { label: "Orders", to: "/producer/orders", end: false },
  // Batches also covers the pre-harvest auctions (a tab inside it).
  { label: "Batches", to: "/producer/batches", end: false, also: "/producer/auctions" },
];

export function TopBar({ openTasks, ordersToConfirm }: { openTasks: number; ordersToConfirm: number }) {
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
        <ProfileMenu area="producer" roleLabel="Producer" />
      </div>
    </header>
  );
}
