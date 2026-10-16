import { ArrowRight, ArrowDown } from "lucide-react";
import { Reveal, Eyebrow } from "./Reveal";
import { Logo } from "./Nav";
import { registerWithKeycloak } from "@/lib/keycloak";
import rescueImage from "@/assets/rescue-produce.jpg";
import "../styles/Rescue.css";
import { useContent } from "@/lib/siteContent";

function Flow({ steps, tone }: { steps: string[]; tone: "normal" | "risk" }) {
  return (
    <ul className="flow-list">
      {steps.map((s, i) => (
        <li key={s}>
          <div className={tone === "risk" && i === 0 ? "flow-step flow-step--highlight" : "flow-step flow-step--normal"}>
            {s}
          </div>
          {i < steps.length - 1 && <ArrowDown className="flow-arrow" />}
        </li>
      ))}
    </ul>
  );
}

export function Rescue() {
  const c = useContent();
  return (
    <section className="rescue-section">
      <div className="rescue-container">
        <div className="rescue-grid">
          <Reveal>
            <Eyebrow className="rescue-eyebrow">Rescue</Eyebrow>
            <h2 className="editorial rescue-title">{c("landing.rescue.title")}</h2>
            <p className="rescue-intro">{c("landing.rescue.intro")}</p>
            <img
              src={rescueImage}
              alt="Crates of watermelons and dragon fruit at a distribution yard"
              loading="lazy"
              width={1440}
              height={960}
              className="rescue-image"
            />
          </Reveal>

          <Reveal delay={100} className="flow-cards">
            <div className="flow-card flow-card--normal">
              <p className="label-eyebrow flow-card-label flow-card-label--normal">Normal path</p>
              <Flow steps={["Normal demand", "Match", "Delivery"]} tone="normal" />
            </div>
            <div className="flow-card flow-card--risk">
              <p className="label-eyebrow flow-card-label flow-card-label--risk">When risk increases</p>
              <Flow
                steps={["High risk", "Alternative demand", "Redistribution", "Rescue"]}
                tone="risk"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

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
            <a href="#coordination" className="cta-secondary">{c("landing.cta.secondary")}</a>
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
    ["Platform", "#platform"],
    ["About", "#about"],
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <Logo />

            <p>
              Connecting agricultural supply, demand, and logistics
              through timely data and smarter coordination.
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
            Supply · Demand · Time · Coordination
          </span>
        </div>
      </div>
    </footer>
  );
}