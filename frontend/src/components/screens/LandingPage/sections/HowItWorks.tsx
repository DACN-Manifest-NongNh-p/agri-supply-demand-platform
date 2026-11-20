// The flow in four stops, each one a shortcut to the demo that shows it.
import { CheckCircle2, Gavel, ListOrdered, Megaphone, PlayCircle, ShieldCheck, Truck } from "lucide-react";
import { Reveal, Eyebrow } from "./Reveal";
import "../styles/HowItWorks.css";

const STOPS = [
  {
    n: "01",
    icon: ShieldCheck,
    title: "Verify",
    body: "Register and get your business checked.",
    links: [{ label: "Watch", href: "#verification" }],
  },
  {
    n: "02",
    icon: ListOrdered,
    title: "Trade",
    body: "Pick the way that fits the deal.",
    links: [
      { label: "Market orders", href: "#order-matching", icon: ListOrdered },
      { label: "Ask for offers", href: "#procurement", icon: Megaphone },
      { label: "Auctions", href: "#auction", icon: Gavel },
    ],
  },
  {
    n: "03",
    icon: CheckCircle2,
    title: "Confirm",
    body: "Buyer and supplier both say yes. Only then is it a deal.",
    links: [{ label: "Watch", href: "#order-matching" }],
  },
  {
    n: "04",
    icon: Truck,
    title: "Deliver",
    body: "Contract, shipment and proof of delivery, all tracked.",
    links: [{ label: "Watch", href: "#transactions" }],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="how-it-works-container">
        <Reveal>
          <Eyebrow className="how-it-works-eyebrow">How it works</Eyebrow>
          <h2 className="editorial how-it-works-title">
            Four steps. <span>Click one to watch it.</span>
          </h2>
        </Reveal>

        <ol className="hiw-road">
          {STOPS.map((stop, index) => (
            <Reveal as="li" key={stop.n} delay={index * 80} className="hiw-stop">
              <span className="hiw-icon">
                <stop.icon size={22} />
              </span>
              <span className="hiw-n">{stop.n}</span>
              <h3 className="hiw-title">{stop.title}</h3>
              <p className="hiw-body">{stop.body}</p>
              <div className="hiw-links">
                {stop.links.map((link) => {
                  const Icon = "icon" in link && link.icon ? link.icon : PlayCircle;
                  return (
                    <a key={link.label} href={link.href} className="hiw-link">
                      <Icon size={15} /> {link.label}
                    </a>
                  );
                })}
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
