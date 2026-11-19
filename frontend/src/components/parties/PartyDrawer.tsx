import { useEffect, type ReactNode } from "react";
import { BadgeCheck, Building2, Lock, Mail, MapPin, MessageCircle, Phone, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { findParty, partyId, publicView, useParties, type Party } from "@/lib/parties";
import { tradesBetween } from "@/lib/tradeHistory";
import { OFFER_STATUS_LABEL, useOffers } from "@/lib/offerStore";
import { openConversation } from "@/lib/messageStore";
import { PROFILE_FIELD_LABEL } from "@/components/profile/profileStore";
import { producerProfile } from "@/components/screens/Buyer/data/producers";
import { formatDay, formatKg, formatVnd } from "@/components/screens/Producer/data/format";
import { usePartyParam } from "./usePartyParam";
import "@/components/offers/offers.css";

type Viewer = { area: "producer" | "buyer" | "coordinator"; /** The viewer's own business name (not for the coordinator). */ self?: string };

/**
 * Who a buyer or producer is, as the viewer may see them: what they chose to publish, the trades and
 * offers between the two, and ways to start a deal. Private details open up once the two have a
 * confirmed order; the coordinator always sees everything. Opened by ?party=role:id (PartyLink).
 */
export function PartyDrawer({ viewer: asViewer, extra }: { viewer: Viewer; extra?: (party: Party) => ReactNode }) {
  const { id, close } = usePartyParam();
  const parties = useParties();
  const offers = useOffers();
  const navigate = useNavigate();
  const party = id ? findParty(id, parties) : undefined;

  useEffect(() => {
    if (!party) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [party, close]);

  if (!party) return null;

  // Opened from your own profile ("Preview my card"): show exactly what others see, nothing else.
  const preview = Boolean(asViewer.self && partyId(asViewer.self) === party.id);
  const viewer: Viewer = preview ? { area: asViewer.area } : asViewer;

  const producerName = party.role === "producer" ? party.name : viewer.self;
  const buyerName = party.role === "buyer" ? party.name : viewer.self;
  const history = producerName && buyerName && viewer.area !== "coordinator" ? tradesBetween(producerName, buyerName) : [];
  const between = viewer.self
    ? offers.filter((offer) => (party.role === "buyer" ? offer.buyer === party.name && offer.producer === viewer.self : offer.producer === party.name && offer.buyer === viewer.self))
    : [];
  // Contact details open up once there is a confirmed order between the two.
  const partners = between.some((offer) => offer.status === "accepted");
  const shown = !preview && (viewer.area === "coordinator" || partners) ? { ...party, hidden: [] } : publicView(party);
  const track = party.role === "producer" ? producerProfile(party.name) : undefined;

  const message = () => {
    if (!producerName || !buyerName) return;
    const conversation = openConversation(producerName, buyerName);
    close();
    navigate(`/${viewer.area}/messages?c=${conversation}`);
  };

  return (
    <div className="pt-drawer-layer">
      <button type="button" className="pt-backdrop" aria-label="Close" onClick={close} />
      <aside className="pt-drawer" role="dialog" aria-modal="true" aria-labelledby="pt-title">
        <header className="pt-head">
          <div>
            <p className="pt-kicker">{party.role === "buyer" ? "Buyer" : "Producer"} · {shown.type}</p>
            <h2 id="pt-title">
              {shown.name} {party.verified && <BadgeCheck size={18} className="pt-verified" aria-label="Verified by Farmora" />}
            </h2>
            {shown.region && (
              <p className="ph-muted">
                <MapPin size={14} /> {shown.region}
              </p>
            )}
          </div>
          <button type="button" className="ord-notice-close" aria-label="Close" onClick={close}>
            <X size={18} />
          </button>
        </header>

        {preview && <p className="pt-private">This is how buyers and producers see your card. Private details are listed but not shown.</p>}

        <dl className="pt-stats">
          <div>
            <dt>On Farmora since</dt>
            <dd>{party.memberSince}</dd>
          </div>
          <div>
            <dt>Completed orders</dt>
            <dd>{party.completedOrders}</dd>
          </div>
          <div>
            <dt>Rating</dt>
            <dd>
              {party.rating ? (
                <>
                  <Star size={14} className="pt-star" /> {party.rating.toFixed(1)} <small>({party.ratingCount})</small>
                </>
              ) : (
                "New"
              )}
            </dd>
          </div>
          {track && (
            <div>
              <dt>On time</dt>
              <dd>{track.onTimeRate}%</dd>
            </div>
          )}
        </dl>

        {viewer.area !== "coordinator" && producerName && buyerName && (
          <div className="pt-actions">
            <button type="button" className="ph-btn ph-btn--primary" onClick={message}>
              <MessageCircle size={16} /> Message
            </button>
            {extra?.(party)}
          </div>
        )}
        {viewer.area === "coordinator" && !preview && extra && <div className="pt-actions">{extra(party)}</div>}

        <section className="pt-section" aria-labelledby="pt-contact">
          <h3 id="pt-contact">Contact</h3>
          <ul className="pt-facts">
            {shown.contactName && (
              <li>
                <Building2 size={14} /> {shown.contactName}
                {shown.title && <span className="ph-muted"> · {shown.title}</span>}
              </li>
            )}
            {shown.email && (
              <li>
                <Mail size={14} /> {shown.email}
              </li>
            )}
            {shown.phone && (
              <li>
                <Phone size={14} /> {shown.phone}
              </li>
            )}
            {shown.address && (
              <li>
                <MapPin size={14} /> {shown.address}
              </li>
            )}
            {shown.website && <li>🌐 {shown.website}</li>}
            {shown.taxId && <li>Tax no. {shown.taxId}</li>}
          </ul>
          {shown.hidden.length > 0 && (
            <p className="pt-private">
              <Lock size={13} /> Kept private: {shown.hidden.map((field) => PROFILE_FIELD_LABEL[field].toLowerCase()).join(", ")}. Shared once you have a
              confirmed order together; until then, use Messages.
            </p>
          )}
        </section>

        {(shown.about || shown.products.length > 0 || shown.volume || shown.certifications.length > 0 || shown.hectares !== null) && (
          <section className="pt-section" aria-labelledby="pt-about">
            <h3 id="pt-about">About</h3>
            {shown.about && <p>{shown.about}</p>}
            <ul className="pt-facts">
              {shown.products.length > 0 && <li>{party.role === "buyer" ? "Buys" : "Grows"}: {shown.products.join(", ")}</li>}
              {shown.volume && <li>Typical volume: {shown.volume}</li>}
              {shown.hectares !== null && <li>Growing area: {shown.hectares} ha</li>}
              {shown.certifications.length > 0 && <li>Certifications: {shown.certifications.join(", ")}</li>}
            </ul>
          </section>
        )}

        {between.length > 0 && (
          <section className="pt-section" aria-labelledby="pt-offers">
            <h3 id="pt-offers">Offers between you</h3>
            <ul className="pt-history">
              {[...between].reverse().map((offer) => (
                <li key={offer.id}>
                  <span>
                    {offer.batchCode} · {formatKg(offer.kg)} {offer.product.toLowerCase()} at {formatVnd(offer.pricePerKg)}/kg
                  </span>
                  <span className={`of-status of-status--${offer.status}`}>{OFFER_STATUS_LABEL[offer.status]}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {viewer.area !== "coordinator" && !preview && (
          <section className="pt-section" aria-labelledby="pt-history">
            <h3 id="pt-history">Your history together</h3>
            {history.length === 0 ? (
              <p className="ph-muted">No completed orders together yet.</p>
            ) : (
              <ul className="pt-history">
                {history.map((trade, index) => (
                  <li key={`${trade.day}-${index}`}>
                    <span>
                      {formatKg(trade.kg)} {trade.product.toLowerCase()}, grade {trade.grade}
                      {trade.batchCode && ` · ${trade.batchCode}`}
                    </span>
                    <span className="ph-muted">
                      {formatDay(trade.day)}
                      {trade.rating && ` · ${"★".repeat(trade.rating)}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {track && track.reviews.length > 0 && (
          <section className="pt-section" aria-labelledby="pt-reviews">
            <h3 id="pt-reviews">What buyers say</h3>
            <ul className="pt-reviews">
              {track.reviews.map((review) => (
                <li key={review.buyer + review.daysAgo}>
                  <p>“{review.text}”</p>
                  <small className="ph-muted">
                    {review.buyer} · {"★".repeat(review.rating)} · {review.daysAgo} days ago
                  </small>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
