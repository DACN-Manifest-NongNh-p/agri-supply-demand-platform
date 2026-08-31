import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logoImage from "@/assets/logo.png";
import { cn } from "@/lib/utils";
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
          <a href="#cta" className="nav-login">
            Log in
          </a>
          <a href="#cta" className="nav-signup">
            Sign Up
          </a>
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
          <div className="nav-mobile-actions">
            <a href="#cta" onClick={() => setOpen(false)} className="nav-mobile-login">
              Log in
            </a>
            <a href="#cta" onClick={() => setOpen(false)} className="nav-mobile-signup">
              Sign Up
            </a>
          </div>
        </div>
      )}
    </header>
  );
}