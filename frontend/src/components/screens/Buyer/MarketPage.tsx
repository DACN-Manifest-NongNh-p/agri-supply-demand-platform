// Market view: published supply lots (B2) and the clearing prices published after each session
// (FR-B3.3-22). Browsing needs no verification. Nothing is bought from here directly: the buyer
// picks a mechanism (buy order, demand, or a bid on an auction), as BR-B3-01 requires.
import { useState } from "react";
import { OverviewDemo } from "../LandingPage/sections/Overview";
import { ArrowRight, Gavel, ListPlus, Megaphone } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { PartyLink } from "@/components/parties/PartyLink";
import { GRADE_LABEL, zoneLabel } from "./model/catalog";
import { tradable, useBuyerData } from "./model/store";
import { formatDateRange, formatDateTime } from "./model/time";
import type { SupplyLot } from "./model/types";
import { priceZoneNote } from "./model/prices";
import { PriceTable } from "./sections/PriceBoard";
import { PageHead, Pill } from "./ui/parts";
import { kg } from "./ui/format";

export function LotEvidence({ lot }: { lot: Pick<SupplyLot, "qualityEvidence" | "certifications" | "puc"> }) {
  return (
    <span className="bf-evidence">
      <Pill tone={lot.qualityEvidence === "DOCUMENT_VERIFIED" ? "good" : "neutral"}>{lot.qualityEvidence === "DOCUMENT_VERIFIED" ? "Quality document-verified" : "Quality self-declared"}</Pill>
      {lot.certifications.map((cert) => (
        <Pill key={cert} tone="info">
          {cert}
        </Pill>
      ))}
      {lot.puc && <Pill tone="muted">{lot.puc}</Pill>}
    </span>
  );
}

export function LotCard({ lot }: { lot: SupplyLot }) {
  const data = useBuyerData();
  const auction = data.auctions.find((item) => item.lotCode === lot.code && (item.status === "ACTIVE" || item.status === "SCHEDULED"));
  return (
    <li className="ph-card bf-lot">
      <div className="bf-lot-top">
        <Link to={`/buyer/market/${lot.code}`} className="bf-lot-title">
          {lot.crop} · {lot.variety}
        </Link>
        <Pill tone="neutral">{GRADE_LABEL[lot.grade]}</Pill>
      </div>
      <p className="bf-lot-meta">
        <PartyLink name={lot.supplier} role="producer" />
      </p>
      <p className="bf-lot-qty">
        <strong>{kg(lot.available)}</strong> <span>available of {kg(lot.quantity)}</span>
      </p>
      <p className="bf-lot-line">
        {formatDateRange(lot.availableFrom, lot.availableUntil)} · from {zoneLabel(lot.zone)}
      </p>
      <p className="bf-lot-marks">
        {lot.qualityEvidence === "DOCUMENT_VERIFIED" && <span className="is-verified">✓ Quality verified</span>}
        {lot.certifications.map((cert) => (
          <span key={cert}>{cert}</span>
        ))}
      </p>
      <div className="bf-lot-foot">
        {auction ? (
          <Link to={`/buyer/auctions/${auction.code}`} className="ph-link-btn">
            <Gavel size={14} /> {auction.status === "ACTIVE" ? "Auction open" : `Auction from ${formatDateTime(auction.startTime)}`}
          </Link>
        ) : (
          <span />
        )}
        <Link to={`/buyer/market/${lot.code}`} className="ph-link-btn">
          Details <ArrowRight size={14} />
        </Link>
      </div>
    </li>
  );
}

export default function MarketPage() {
  const data = useBuyerData();
  const [params, setParams] = useSearchParams();
  const crop = params.get("crop") ?? "";
  const [showAll, setShowAll] = useState(false);
  const lots = data.lots.filter((lot) => (showAll || tradable(lot)) && (!crop || lot.crop === crop));

  return (
    <main className="ph-main bf-page">
      <PageHead
        eyebrow="Market"
        title="Supply on Farmora"
        summary="What suppliers have, and today's prices."
        demo={<OverviewDemo />}
        help="These are supply lots suppliers have published, with how much is still available, and the prices the last matching sessions cleared at. You do not buy a lot directly: place a buy order, post a demand, or bid on an auction."
        actions={
          <>
            <Link to={`/buyer/orders/new${crop ? `?crop=${encodeURIComponent(crop)}` : ""}`} className="ph-btn ph-btn--primary">
              <ListPlus size={16} /> Place a buy order
            </Link>
            <Link to={`/buyer/demands/new${crop ? `?crop=${encodeURIComponent(crop)}` : ""}`} className="ph-btn">
              <Megaphone size={16} /> Post a demand
            </Link>
          </>
        }
      />

      <section className="ph-card bf-section" aria-labelledby="prices-title">
        <div className="ph-section-head">
          <div>
            <h2 id="prices-title">Market prices</h2>
            <p className="ph-section-sub">Set in each matching session · {priceZoneNote(data.prices)}</p>
          </div>
        </div>
        <PriceTable prices={crop ? data.prices.filter((price) => price.crop === crop) : data.prices} limit={8} />
      </section>

      <div className="bf-toolbar">
        <div className="bf-chips" role="group" aria-label="Product">
          <button type="button" className={!crop ? "ph-chip ph-chip--active" : "ph-chip"} onClick={() => setParams({})}>
            All products
          </button>
          {[...new Set(data.lots.map((lot) => lot.crop))].map((name) => (
            <button key={name} type="button" className={crop === name ? "ph-chip ph-chip--active" : "ph-chip"} onClick={() => setParams({ crop: name })}>
              {name}
            </button>
          ))}
        </div>
        <label className="bf-inline-check">
          <input type="checkbox" checked={showAll} onChange={(event) => setShowAll(event.target.checked)} /> Include fully reserved lots
        </label>
      </div>

      {lots.length === 0 ? (
        <p className="ph-card ph-empty">No lot of this product is open right now. Place a buy order: it waits in the book and matches when supply arrives.</p>
      ) : (
        <ul className="bf-lots">
          {lots.map((lot) => (
            <LotCard key={lot.code} lot={lot} />
          ))}
        </ul>
      )}
    </main>
  );
}
