import { Reveal, Eyebrow } from "./Reveal";
import transportImage from "@/assets/card-transport.jpg";
import freshImage from "@/assets/fresh.jpg"
import marketImage from "@/assets/market.jpg"
import analyzeImage from "@/assets/analyze.jpg"
import "../styles/Intro.css";
import "../styles/Reveal.css"
const pills = ["About Us", "How It Works", "Intelligence", "Mission"];

export function Intro() {
  return (
    <section id="about" className="intro-section">
      <div className="intro-container">
        <Reveal className="intro-pills">
          {pills.map((p, i) => (
            <span
              key={p}
              className={`intro-pill ${i === 0 ? "intro-pill-active" : ""}`}
            >
              {p}
            </span>
          ))}
        </Reveal>

        <div className="intro-content">
          <Reveal>
            <Eyebrow>Why it matters</Eyebrow>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="intro-heading">
              The challenge isn’t just finding supply.
              <span>
                It&apos;s finding the right demand in time.
              </span>
            </h2>

            <div className="intro-description">
              <p>
               Perishable produce loses value with every passing day. When supply is concentrated and demand is uncertain, delays in finding buyers or arranging transportation can quickly turn fresh produce into surplus or waste.
              </p>

              <p>
                Farmora brings supply, demand, time, and transportation together to help stakeholders coordinate faster, make better decisions, and move produce where it is needed most.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="intro-cards">
  <Reveal delay={0} className="intro-info-card intro-card intro-supply-card">
    <img
      src={freshImage}
      alt="Farmer holding freshly harvested produce"
      loading="lazy"
      className="intro-card-bg"
    />

    <div className="intro-card-content">
      <span className="intro-card-label">01 / Supply</span>

      <div>
        <h3>Supply + Freshness</h3>
        <p>
          Track each agricultural batch by quantity, harvest date,
          quality, location, and remaining shelf life.
        </p>
      </div>
    </div>
  </Reveal>

  <Reveal delay={80} className="intro-info-card intro-card intro-demand-card">
    <img
      src={marketImage}
      alt="Fresh produce being transported"
      loading="lazy"
      className="intro-card-bg"
    />

    <div className="intro-card-content">
      <span className="intro-card-label">02 / Demand</span>

      <div>
        <h3>Market Need</h3>
        <p>
          Track real market demand by quantity, location, and timing to identify where available produce is needed.
        </p>
      </div>
    </div>
  </Reveal>

  <Reveal delay={160} className="intro-info-card intro-card intro-intelligence-card">
    <img
      src={analyzeImage}
      alt="Agricultural transportation"
      loading="lazy"
      className="intro-card-bg"
    />

    <div className="intro-card-content">
      <span className="intro-card-label">03 / Intelligence</span>

      <div>
        <h3>Analyze + Predict</h3>
        <p>
          Analyze supply, demand, shelf life, and transportation
          conditions to identify potential risks early.
        </p>
      </div>
    </div>
  </Reveal>

  <Reveal delay={240} className="intro-info-card intro-card intro-coordination-card">
    <img
      src={transportImage}
      alt="Fresh agricultural produce"
      loading="lazy"
      className="intro-card-bg"
    />

    <div className="intro-card-content">
      <span className="intro-card-label">04 / Coordination</span>

      <div>
        <h3>Match + Distribute</h3>
        <p>
          Connect available produce with the right demand and coordinate how it gets there.
        </p>
      </div>
    </div>
  </Reveal>
</div>
      </div>
    </section>
  );
}