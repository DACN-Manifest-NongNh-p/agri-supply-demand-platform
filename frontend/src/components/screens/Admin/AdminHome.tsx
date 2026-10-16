import { useEffect, useState } from "react";
import { ArrowRight, Boxes, ExternalLink, FileText, Megaphone, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { getPublic } from "@/lib/api";
import { useSite } from "@/lib/site";
import { CONTENT_FIELDS } from "@/lib/siteContent";
import { deliveries, demands, market, requests } from "../Coordinator/data/mockCoordinator";
import { openOf } from "../Buyer/data/demands";
import { KEYCLOAK_CONSOLE } from "./data/adminApi";

type Tile = { icon: LucideIcon; label: string; value: string; note: string; to: string };

/** What the admin manages, how far it is from the defaults, and the platform at a glance. */
export default function AdminHome() {
  const site = useSite();
  const [health, setHealth] = useState<"checking" | "up" | "down">("checking");

  useEffect(() => {
    let cancelled = false;
    getPublic<{ status: string }>("api/health")
      .then((result) => !cancelled && setHealth(result.status === "UP" ? "up" : "down"))
      .catch(() => !cancelled && setHealth("down"));
    return () => {
      cancelled = true;
    };
  }, []);

  const changedTexts = CONTENT_FIELDS.filter((field) => site.content[field.key] !== undefined).length;
  const changedRules = site.rules.filter((rule) => rule.value !== rule.defaultValue).length;
  const tiles: Tile[] = [
    { icon: FileText, label: "Site content", value: `${changedTexts}/${CONTENT_FIELDS.length}`, note: "texts changed from the default", to: "/admin/content" },
    { icon: Megaphone, label: "Announcements", value: String(site.announcements.length), note: "showing right now", to: "/admin/announcements" },
    { icon: SlidersHorizontal, label: "Operating rules", value: `${changedRules}/${site.rules.length}`, note: "rules changed from the default", to: "/admin/rules" },
    { icon: Boxes, label: "Products", value: String(site.products.length), note: "in the catalog", to: "/admin/products" },
  ];

  // The platform at a glance, from the demo data the role areas run on.
  const platform = [
    { label: "Open demands", value: demands.filter((demand) => demand.neededByDay >= 0).length },
    { label: "Batches with open kilograms", value: market.filter((batch) => openOf(batch) > 0).length },
    { label: "Shipments on the road", value: deliveries.filter((delivery) => delivery.step < 3).length },
    { label: "Requests for coordinators", value: requests.length },
  ];

  return (
    <main className="ph-main lg-page ad-page">
      <header className="lg-head">
        <h1>Administration</h1>
        <p>Change what Farmora says and how it behaves, without a release.</p>
      </header>

      <div className={`ad-status ad-status--${health}`} role="status">
        <span className="ad-status-dot" aria-hidden="true" />
        {health === "checking"
          ? "Checking the Farmora API…"
          : health === "up"
            ? site.source === "api"
              ? "API connected. Changes are saved for everyone."
              : "API is up, but the site loaded before it. Reload to edit."
            : "The Farmora API is not reachable. The site shows its built-in defaults; nothing can be saved until it is back."}
      </div>

      <ul className="ad-tiles">
        {tiles.map(({ icon: Icon, label, value, note, to }) => (
          <li key={label}>
            <Link to={to} className="ph-card ad-tile">
              <span className="ad-tile-top">
                <small>{label}</small>
                <span className="lg-kpi-icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={1.75} />
                </span>
              </span>
              <strong>{value}</strong>
              <span className="ad-tile-note">
                {note} <ArrowRight size={13} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="ad-columns">
        <section className="ph-card ad-panel" aria-labelledby="platform-title">
          <h2 id="platform-title">Platform today</h2>
          <dl className="ad-figures">
            {platform.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className="ad-muted">From the demo data the role areas run on until they use the API.</p>
        </section>

        <section className="ph-card ad-panel" aria-labelledby="users-title">
          <h2 id="users-title">Users and roles</h2>
          <p className="ad-muted">
            Accounts, passwords and roles (producer, buyer, coordinator, logistics, admin) are managed in Keycloak. Coordinator and admin roles can only be
            granted there.
          </p>
          <a href={KEYCLOAK_CONSOLE} target="_blank" rel="noreferrer" className="ph-btn">
            Open the Keycloak console <ExternalLink size={14} />
          </a>
        </section>
      </div>
    </main>
  );
}
