import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logoImage from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import {
  getKeycloakUsername,
  isKeycloakAuthenticated,
  loginWithKeycloak,
  logoutFromKeycloak,
  registerWithKeycloak,
} from "@/lib/keycloak";
import "../styles/Nav.css";

const links = [
  { label: "Home", href: "#top" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Platform", href: "#time-aware" },
  { label: "About", href: "#about" },
];

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("logo", className)}>
      <img
        src={logoImage}
        alt="Farmora"
        className="logo-image"
      />
      Farmora
    </span> 
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const authenticated = isKeycloakAuthenticated();
  const username = getKeycloakUsername();
  const logIn = () => void loginWithKeycloak().catch(console.error);
  const signUp = () => void registerWithKeycloak().catch(console.error);
  const logOut = () => void logoutFromKeycloak().catch(console.error);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("nav-header", scrolled ? "nav-header--scrolled" : "nav-header--transparent")}>
      <nav className="nav-bar">
        <a href="#top" className="nav-logo-link">
          <Logo />
        </a>

        <div className="nav-links-wrap">
          <ul className="nav-links">
            {links.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="nav-link">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="nav-actions">
          {authenticated ? (
            <>
              <span className="nav-user">{username}</span>
              <button type="button" onClick={logOut} className="nav-login">Log out</button>
            </>
          ) : (
            <>
              <button type="button" onClick={logIn} className="nav-login">Log in</button>
              <button type="button" onClick={signUp} className="nav-signup">Sign Up</button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="nav-menu-btn"
        >
          {open ? <X className="nav-menu-icon" /> : <Menu className="nav-menu-icon" />}
        </button>
      </nav>

      {open && (
        <div className="nav-mobile-panel">
          <ul className="nav-mobile-links">
            {links.map((l) => (
              <li key={l.label}>
                <a href={l.href} onClick={() => setOpen(false)} className="nav-mobile-link">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className={`nav-mobile-actions${authenticated ? " nav-mobile-actions--authenticated" : ""}`}>
            {authenticated ? (
              <>
                <span className="nav-mobile-user">{username}</span>
                <button type="button" onClick={() => { setOpen(false); logOut(); }} className="nav-mobile-login">
                  Log out
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => { setOpen(false); logIn(); }} className="nav-mobile-login">
                  Log in
                </button>
                <button type="button" onClick={() => { setOpen(false); signUp(); }} className="nav-mobile-signup">
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}