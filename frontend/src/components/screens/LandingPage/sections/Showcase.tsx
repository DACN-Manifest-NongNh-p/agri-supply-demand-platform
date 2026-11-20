// One section per part of the Farmora flow, each with its short demo next to the explanation.
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Eyebrow, Reveal } from "./Reveal";
import { AuctionDemo, MatchingDemo, ProcurementDemo, TransactionDemo, VerifyDemo } from "./Demos";
import "../styles/Showcase.css";

function Showcase({
  id,
  eyebrow,
  badge,
  title,
  intro,
  points,
  demo,
  reverse,
  tone = "light",
}: {
  id: string;
  eyebrow: string;
  badge?: string;
  title: string;
  intro: string;
  points: string[];
  demo: ReactNode;
  reverse?: boolean;
  tone?: "light" | "tint" | "dark";
}) {
  return (
    <section id={id} className={`showcase showcase--${tone}`}>
      <div className={reverse ? "showcase-grid showcase-grid--reverse" : "showcase-grid"}>
        <Reveal className="showcase-copy">
          <Eyebrow>{eyebrow}</Eyebrow>
          {badge && <span className="showcase-badge">{badge}</span>}
          <h2 className="editorial showcase-title">{title}</h2>
          <p className="showcase-intro">{intro}</p>
          <ul className="showcase-points">
            {points.map((point) => (
              <li key={point}>
                <Check size={16} aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={120} className="showcase-demo">
          {demo}
        </Reveal>
      </div>
    </section>
  );
}

export function VerificationSection() {
  return (
    <Showcase
      id="verification"
      eyebrow="Trusted parties"
      title="Only real, verified businesses can trade."
      intro="Buyers and suppliers can look around from day one. Before they commit to anything, Farmora checks the business and the person acting for it."
      points={[
        "Business details, registered address and representative",
        "Registration certificate and, if needed, a letter of authorisation",
        "A coordinator checks the business first, then the representative",
        "Changing legal details sends the profile back for review",
      ]}
      demo={<VerifyDemo />}
    />
  );
}

export function MatchingSection() {
  return (
    <Showcase
      id="order-matching"
      eyebrow="Order matching"
      badge="Main channel"
      title="Buy or sell at the market price, three times a day."
      intro="Buyers place buy orders with a maximum price, suppliers place sell orders from their lots with a minimum price. Three times a day Farmora matches them at one fair price per product group."
      points={[
        "Sessions at 08:00, 11:00 and 14:00; the book closes 10 minutes before",
        "One clearing price per product, grade and zone, set by supply and demand",
        "Price first, then time: partial fills and several suppliers per order",
        "Your limit price stays private; only clearing prices are published",
      ]}
      demo={<MatchingDemo />}
      reverse
      tone="tint"
    />
  );
}

export function ProcurementSection() {
  return (
    <Showcase
      id="procurement"
      eyebrow="Procurement"
      title="Tell suppliers what you need. Pick the best offer."
      intro="A buyer publishes a demand with a deadline. Verified suppliers propose from real supply lots, and the buyer compares, negotiates and awards one or more of them."
      points={[
        "Deadline, supplier scope and weighted criteria set when publishing",
        "Proposals close automatically; suppliers never see each other's offers",
        "Side-by-side comparison, with scores as advice, not a verdict",
        "Negotiate per proposal; each awarded supplier confirms",
      ]}
      demo={<ProcurementDemo />}
    />
  );
}

export function AuctionSection() {
  return (
    <Showcase
      id="auction"
      eyebrow="Auctions"
      title="Bid on a supplier's harvest."
      intro="A supplier opens an auction on a published lot with a starting price. Buyers bid until it ends; the supplier chooses the bids and how much each one gets."
      points={[
        "One bid per buyer, changeable or withdrawable until the end",
        "The quantity is held for the auction, so it is never sold twice",
        "The supplier may split the lot across several bids",
        "The chosen buyer confirms within the deadline",
      ]}
      demo={<AuctionDemo />}
      reverse
      tone="tint"
    />
  );
}

export function TransactionSection() {
  return (
    <Showcase
      id="transactions"
      eyebrow="From deal to delivery"
      title="Follow every deal until the goods arrive."
      intro="Whatever the channel, a result both sides confirmed becomes a transaction with the agreed terms. It moves on to term sheet, contract and delivery, and every step is recorded."
      points={[
        "Quantity, price, quality and delivery terms fixed at confirmation",
        "Term sheet and contract follow from the transaction",
        "Shipments tracked to the buyer's receiving dock, with proof",
        "Farmora records the trade; payment is settled under the contract",
      ]}
      demo={<TransactionDemo />}
      tone="dark"
    />
  );
}
