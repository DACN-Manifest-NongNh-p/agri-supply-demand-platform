import { ArrowRight, ArrowDown } from "lucide-react";
import { Reveal, Eyebrow } from "./Reveal";
import { Logo } from "./Nav";
import rescueImage from "@/assets/rescue-produce.jpg";
import "../styles/Rescue.css";

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
  return (
    <section className="rescue-section">
      <div className="rescue-container">
        <div className="rescue-grid">
          <Reveal>
            <Eyebrow className="rescue-eyebrow">Rescue</Eyebrow>
            <h2 className="editorial rescue-title">Rescue before it becomes waste.</h2>
            <p className="rescue-intro">
              When a batch is predicted to have a high risk of remaining unsold or spoiling, the
              system can prioritize it for alternative demand, redistribution, or rescue.
            </p>
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
  return (
    <section id="cta" className="cta-section">
      <div className="cta-container">
        <Reveal>
          <h2 className="editorial cta-title">Turn agricultural data into timely action.</h2>
          <p className="cta-intro">
            Connect supply, demand, time, and transportation in one coordination platform.
          </p>
          <div className="cta-actions">
            <a href="#top" className="cta-primary">
              Get Started
              <ArrowRight className="cta-primary-icon" />
            </a>
            <a href="#coordination" className="cta-secondary">
              Explore the Platform
            </a>
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