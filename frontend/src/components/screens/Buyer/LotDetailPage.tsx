// One published supply lot: origin, quality evidence, what is still available, and the ways to buy
// from it. The buyer never takes kilograms off a lot directly (no reserve, no lock): quantity is only
// held once a mechanism produces a result (B3 §9.1).
import { ArrowLeft, Gavel, ListPlus, Megaphone } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PartyLink } from "@/components/parties/PartyLink";
import { AUCTION_LABEL, GRADE_LABEL, zoneLabel } from "./model/catalog";
import { useBuyerData } from "./model/store";
import { formatDateRange, formatDateTime } from "./model/time";
import { LotEvidence } from "./MarketPage";
import { PriceTable } from "./sections/PriceBoard";
import { Facts, PageHead, Pill } from "./ui/parts";
import { kg, perKg } from "./ui/format";
import { AUCTION_TONE } from "./ui/tones";

const LOT_STATUS = {
  PUBLISHED: "Open",
  PARTIALLY_RESERVED: "Partly reserved",
  FULLY_RESERVED: "Fully reserved",
  IN_TRANSACTION: "In transaction",
  EXPIRED: "Expired",
} as const;

export default function LotDetailPage() {
  const { code } = useParams();
  const data = useBuyerData();
  const lot = data.lots.find((item) => item.code === code);
  if (!lot) {
    return (
      <main className="ph-main">
        <Link to="/buyer/market" className="ph-back">
          <ArrowLeft size={16} /> Market
        </Link>
        <p className="ph-empty">Lot {code} was not found.</p>
      </main>
    );
  }
  const auctions = data.auctions.filter((item) => item.lotCode === lot.code);
  const reserved = lot.quantity - lot.available;
  const prefill = new URLSearchParams({ crop: lot.crop, variety: lot.variety }).toString();

  return (
    <main className="ph-main bf-page">
      <Link to={`/buyer/market?crop=${encodeURIComponent(lot.crop)}`} className="ph-back">
        <ArrowLeft size={16} /> Market
      </Link>
      <PageHead
        eyebrow={`Supply lot ${lot.code}`}
        title={`${lot.crop} · ${lot.variety}`}
        summary={
          <>
            <PartyLink name={lot.supplier} role="producer" /> · {lot.region}
          </>
        }
        actions={<Pill tone={lot.status === "FULLY_RESERVED" || lot.status === "EXPIRED" ? "muted" : "info"}>{LOT_STATUS[lot.status]}</Pill>}
      />

      <div className="bf-columns">
        <div className="bf-col-main">
          <section className="ph-card bf-section">
            <h2>About this lot</h2>
            <LotEvidence lot={lot} />
            <Facts
              items={[
                ["Grade", GRADE_LABEL[lot.grade]],
                ["Quality evidence", lot.qualityEvidence === "DOCUMENT_VERIFIED" ? "Checked against documents by Farmora" : "Declared by the supplier, not yet checked"],
                ["Production unit", lot.puc ?? "Not registered"],
                ["Supply window", formatDateRange(lot.availableFrom, lot.availableUntil)],
                ["Ships from", zoneLabel(lot.zone)],
              ]}
            />
            <div className="bf-meter" aria-label={`${kg(lot.available)} of ${kg(lot.quantity)} available`}>
              <span style={{ width: `${(reserved / lot.quantity) * 100}%` }} />
            </div>
            <p className="ph-muted">
              <strong>{kg(lot.available)}</strong> available of {kg(lot.quantity)}. {kg(reserved)} is held by auctions, sell orders or results waiting for confirmation.
            </p>
          </section>

          <section className="ph-card bf-section">
            <h2>Auctions on this lot</h2>
            {auctions.length === 0 ? (
              <p className="ph-muted">The supplier has not put this lot up for auction.</p>
            ) : (
              <ul className="bf-rows">
                {auctions.map((auction) => (
                  <li key={auction.code}>
                    <Link to={`/buyer/auctions/${auction.code}`} className="bf-row">
                      <span>
                        <strong>{auction.name}</strong>
                        <small>
                          {kg(auction.quantity)} · starting {perKg(auction.startingPrice)} · ends {formatDateTime(auction.endedAt ?? auction.endTime)}
                        </small>
                      </span>
                      <Pill tone={AUCTION_TONE[auction.status]}>{AUCTION_LABEL[auction.status]}</Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ph-card bf-section">
            <h2>Recent clearing prices for {lot.crop.toLowerCase()}</h2>
            <PriceTable prices={data.prices.filter((price) => price.crop === lot.crop)} />
          </section>
        </div>

        <aside className="bf-col-side">
          <div className="ph-card bf-sticky">
            <h2>Buy from this supply</h2>
            <p className="ph-muted">Choose how you want to trade. The lot's quantity is only held for you once a result is agreed.</p>
            <div className="bf-stack">
              <Link to={`/buyer/orders/new?${prefill}&grade=${lot.grade}`} className="ph-btn ph-btn--primary">
                <ListPlus size={16} /> Place a buy order
              </Link>
              <small className="ph-muted">Matched in the next session at one market price, with this lot or any other that fits.</small>
              <Link to={`/buyer/demands/new?${prefill}`} className="ph-btn">
                <Megaphone size={16} /> Post a demand
              </Link>
              <small className="ph-muted">Suppliers send proposals by your deadline; you choose and negotiate.</small>
              {auctions.some((item) => item.status === "ACTIVE") && (
                <Link to={`/buyer/auctions/${auctions.find((item) => item.status === "ACTIVE")!.code}`} className="ph-btn">
                  <Gavel size={16} /> Bid in the auction
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
