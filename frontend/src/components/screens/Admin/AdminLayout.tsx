import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Boxes, FileText, LayoutGrid, Megaphone, SlidersHorizontal } from "lucide-react";
import { AreaSidebar } from "../Coordinator/sections/AreaSidebar";
import { useStoredTheme } from "../Coordinator/data/theme";
import { useSite } from "@/lib/site";
import type { Notice } from "@/components/notifications/NotificationBell";
// Same shell as the coordinator and logistics areas, with flat surfaces like logistics.
import "../Producer/styles/ProducerHome.css";
import "../Buyer/styles/Buyer.css";
import "../Coordinator/styles/Coordinator.css";
import "../Logistics/styles/Logistics.css";
import "./styles/Admin.css";

/** Shell for /admin: where an administrator changes what the site says and how it behaves, without a release. */
export default function AdminLayout() {
  const { theme, toggleTheme } = useStoredTheme("admin-theme");
  const site = useSite();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  // The one thing that needs the admin's attention: the site running on built-in defaults.
  const notifications: Notice[] =
    site.source === "api"
      ? []
      : [
          {
            id: "api-offline",
            tone: "urgent",
            title: "The Farmora API is not reachable",
            detail: "The site is showing its built-in defaults and nothing can be saved. Start the backend and reload.",
            link: { label: "Overview", to: "/admin" },
          },
        ];

  return (
    <div className="producer-home coordinator-area admin-area" id="top" data-theme={theme}>
      <AreaSidebar
        home="/admin"
        roleLabel="Administrator"
        fallbackName="Farmora admin"
        theme={theme}
        onToggleTheme={toggleTheme}
        notifications={notifications}
        pages={[
          { label: "Overview", to: "/admin", end: true, icon: LayoutGrid },
          { label: "Site content", to: "/admin/content", icon: FileText },
          { label: "Announcements", to: "/admin/announcements", icon: Megaphone, count: site.announcements.length },
          { label: "Operating rules", to: "/admin/rules", icon: SlidersHorizontal },
          { label: "Products", to: "/admin/products", icon: Boxes },
        ]}
      />
      <div className="co-content">
        <Outlet />
      </div>
    </div>
  );
}
