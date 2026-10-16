import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-harvest.jpg";
import "../styles/Hero.css";
import { useContent } from "@/lib/siteContent";
import { Lines } from "./ContentText";

export function Hero() {
  const c = useContent();
  return (
    <section className="hero-section">
      <img
        src={heroImage}
        alt="Farmers harvesting fresh vegetables at sunrise"
        width={1920}
        height={1280}
        className="hero-bg"
      />
      <div className="hero-overlay-1" />
      <div className="hero-overlay-2" />

      <div className="hero-content">
        <div>
          <div className="hero-content-text">
            <p className="hero-eyebrow">{c("landing.hero.eyebrow")}</p>
            <h1>
              <Lines text={c("landing.hero.title")} />
            </h1>
            <p className="hero-description">{c("landing.hero.description")}</p>
            <div className="hero-buttons">
              <a href="#coordination" className="hero-button hero-button-primary">
                {c("landing.hero.primaryCta")}
                <ArrowRight size={16} />
              </a>
              <a href="#how-it-works" className="hero-button hero-button-secondary">{c("landing.hero.secondaryCta")}</a>
            </div>
          </div>

          <aside className="hero-aside">
            <p className="hero-aside-title">{c("landing.hero.asideTitle")}</p>
            <p className="hero-aside-text">{c("landing.hero.asideText")}</p>
            <a href="#time-aware" className="hero-aside-link">
              Learn More <ArrowRight size={14} />
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}
