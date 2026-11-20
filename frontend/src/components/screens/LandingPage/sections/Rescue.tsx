import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { Logo } from "./Nav";
import { registerWithKeycloak } from "@/lib/keycloak";
import "../styles/Rescue.css";
import { useContent } from "@/lib/siteContent";

export function FinalCTA() {
  const c = useContent();
  return (
    <section id="cta" className="cta-section">
      <div className="cta-container">
        <Reveal>
          <h2 className="editorial cta-title">{c("landing.cta.title")}</h2>
          <p className="cta-intro">{c("landing.cta.intro")}</p>
          <div className="cta-actions">
            <button type="button" onClick={() => void registerWithKeycloak().catch(console.error)} className="cta-primary">
              {c("landing.cta.primary")}
              <ArrowRight className="cta-primary-icon" />
            </button>
            <a href="#order-matching" className="cta-secondary">{c("landing.cta.secondary")}</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  const links = [
    ["Home", "#top"],
    ["How It Works", "#how-it-works"],
    ["Order matching", "#order-matching"],
    ["Procurement", "#procurement"],
    ["Auctions", "#auction"],
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <Logo />

            <p>
              A market for agricultural produce where verified buyers and
              suppliers trade real supply lots and confirm every deal.
            </p>
          </div>

          <div className="footer-links">

            <nav className="footer-nav">
              {links.map(([label, href]) => (
                <a key={label} href={href}>
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Farmora</span>

          <span>
            Verify · Trade · Confirm · Deliver
          </span>
        </div>
      </div>
    </footer>
  );
}