import { useEffect, useRef, useState } from "react";
import { KeyRound, LogOut, UserRound, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { isKeycloakAuthenticated, logoutFromKeycloak, openAccountConsole } from "@/lib/keycloak";
import { Avatar } from "./Avatar";
import { useProfile, type ProfileArea } from "./profileStore";
import "./profile.css";

type Props = {
  area: ProfileArea;
  /** Shown under the name, e.g. "Buyer". */
  roleLabel: string;
  /** More pages for this area, listed under "Your profile". */
  links?: { label: string; to: string; icon: LucideIcon }[];
};

/** Avatar in the top bar; opens a menu with the profile, account security and log out. */
export function ProfileMenu({ area, roleLabel, links = [] }: Props) {
  const profile = useProfile(area);
  const authenticated = isKeycloakAuthenticated();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="pf-menu" ref={rootRef}>
      <button
        type="button"
        className="pf-trigger"
        aria-label={`Account menu for ${profile.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={profile.name} photo={profile.photo} />
      </button>

      {open && (
        <div className="pf-panel" role="menu">
          <div className="pf-panel-head">
            <Avatar name={profile.name} photo={profile.photo} size={42} />
            <span>
              <strong>{profile.name}</strong>
              {profile.email && <small>{profile.email}</small>}
              <em>{[roleLabel, profile.org.name].filter(Boolean).join(" · ")}</em>
            </span>
          </div>

          <div className="pf-panel-list">
            <Link to={`/${area}/profile`} role="menuitem" onClick={close}>
              <UserRound size={16} /> Your profile
            </Link>
            {links.map(({ label, to, icon: Icon }) => (
              <Link key={to} to={to} role="menuitem" onClick={close}>
                <Icon size={16} /> {label}
              </Link>
            ))}
            {authenticated && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  void openAccountConsole();
                }}
              >
                <KeyRound size={16} /> Password & security
              </button>
            )}
          </div>

          {authenticated && (
            <div className="pf-panel-list pf-panel-foot">
              <button type="button" role="menuitem" onClick={() => void logoutFromKeycloak()}>
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
