import { Reveal, Eyebrow } from "./Reveal";
import "../styles/HowItWorks.css";
const steps = [
  {
    n: "01",
    title: "Supply",
    body: "Farmers register available produce and its freshness details.",
    items: [
      "Product type",
      "Quantity",
      "Harvest date",
      "Quality",
      "Location",
      "Shelf life",
    ],
  },
  {
    n: "02",
    title: "Demand",
    body: "Buyers submit their needs, including quantity, location, and timing.",
    items: [
      "Product",
      "Quantity",
      "Destination",
      "Required time",
    ],
  },
  {
    n: "03",
    title: "Forecast",
    body: "Historical and current data help anticipate future supply, demand, and surplus.",
    items: [
      "Future demand",
      "Future supply",
      "Potential surplus",
    ],
  },
  {
    n: "04",
    title: "Match",
    body: "The system identifies suitable supply-demand pairs based on key constraints.",
    items: [
      "Product",
      "Quantity",
      "Location",
      "Shelf life",
      "Demand timing",
    ],
  },
  {
    n: "05",
    title: "Reserve & Deliver",
    body: "Orders reserve available produce while transportation is planned around freshness.",
    items: [],
  },
  {
    n: "06",
    title: "Rescue",
    body: "At-risk produce is prioritized for alternative buyers or redistribution before it spoils.",
    items: [],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="how-it-works-container">

        <Reveal>
          <Eyebrow className="how-it-works-eyebrow">
            How it works
          </Eyebrow>

          <h2 className="editorial how-it-works-title">
            From harvest to destination,
            <span>every decision is connected.</span>
          </h2>
        </Reveal>

        <ol className="steps-list">
          {steps.map((s, i) => (
            <Reveal
              as="li"
              key={s.n}
              delay={i * 70}
              className="step-item"
            >
              <div className="step-head">
                <span className="step-number">{s.n}</span>
                <span className="step-rule" />
              </div>

              <h3 className="editorial step-title">
                {s.title}
              </h3>

              <p className="step-body">
                {s.body}
              </p>
            </Reveal>
          ))}
        </ol>

      </div>
    </section>
  );
}