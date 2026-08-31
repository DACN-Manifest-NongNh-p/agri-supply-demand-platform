import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-harvest.jpg";
import "../styles/Hero.css";

export function Hero() {
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
            <p className="hero-eyebrow">Connecting Supply, Demand & Time</p>
            <h1>
              Freshness Has a Deadline
              <br />
              Act in Time.
            </h1>
            <p className="hero-description">
              Connect agricultural supply with real demand while tracking harvest time, shelf life,
              location, and transportation — helping the right produce reach the right destination
              before it becomes waste.
            </p>
            <div className="hero-buttons">
              <a href="#coordination" className="hero-button hero-button-primary">
                Explore the Platform
                <ArrowRight size={16} />
              </a>
              <a href="#how-it-works" className="hero-button hero-button-secondary">
                How It Works
              </a>
            </div>
          </div>

          <aside className="hero-aside">
            <p className="hero-aside-title">Why Timing Matters</p>
            <p className="hero-aside-text">
             Fresh produce has a limited window of value. Farmora considers freshness,
            demand, distance, and transportation to help move each batch where it
            matters most.
            </p>
            <a href="#time-aware" className="hero-aside-link">
              Learn More <ArrowRight size={14} />
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}
