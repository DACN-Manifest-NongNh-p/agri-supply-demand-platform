import { Link, NavLink, useLocation } from "react-router-dom";
import { NotificationBell, type Notice } from "@/components/notifications/NotificationBell";
import logoImage from "@/assets/logo.png";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { useUnreadCount } from "@/lib/messageStore";
import { producer } from "../data/mockProducer";

const pages = [
  { label: "Home", to: "/producer", end: true },
  { label: "Matches", to: "/producer/demand", end: false },
  { label: "Orders", to: "/producer/orders", end: false },
  { label: "Messages", to: "/producer/messages", end: false },
  // Batches also covers the pre-harvest auctions (a tab inside it).
  { label: "Batches", to: "/producer/batches", end: false, also: "/producer/auctions" },
];

type Props = {
  ordersToConfirm: number;
  /** Everything under the bell, already filtered by the notification settings. */
  notices: Notice[];
  onDismiss: (id: string) => void;
};

export function TopBar({ ordersToConfirm, notices, onDismiss }: Props) {
  const { pathname } = useLocation();
  const unread = useUnreadCount(producer.name);

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
            {page.to === "/producer/messages" && unread > 0 && (
              <span className="ph-nav-count" aria-label={`${unread} unread`}>
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="ph-account">
        <NotificationBell items={notices} onDismiss={onDismiss} />
        <ProfileMenu area="producer" roleLabel="Producer" />
      </div>
    </header>
  );
}
