import { Check, Star } from "lucide-react";
import { producerProfile } from "../data/producers";

function ago(days: number) {
  if (days <= 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  return `${Math.round(days / 7)} weeks ago`;
}

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="bu-stars" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star key={index} size={size} className={index <= rating + 0.25 ? "bu-star" : "bu-star bu-star--off"} aria-hidden="true" />
      ))}
    </span>
  );
}

/** Compact line for a supply card: rating, on-time share, verified tick. */
export function ProducerBadge({ name }: { name: string }) {
  const profile = producerProfile(name);
  if (!profile) return null;
  return (
    <span className="bu-trust-line">
      <Star size={12} className="bu-star" aria-hidden="true" />
      {profile.rating.toFixed(1)} · {profile.onTimeRate}% on time
      {profile.verified && (
        <span className="bu-verified" title="Business registration checked by Farmora">
          <Check size={12} aria-hidden="true" /> verified
        </span>
      )}
    </span>
  );
}

/** Who grows the batch and how they have delivered before. */
export function ProducerCard({ name, region, distanceKm }: { name: string; region: string; distanceKm: number }) {
  const profile = producerProfile(name);

  return (
    <section className="ph-card bu-trust" aria-labelledby="producer-title">
      <div>
        <h2 id="producer-title">
          {name}
          {profile?.verified && (
            <span className="bu-trust-tick" title="Business registration checked by Farmora">
              <Check size={11} strokeWidth={3} aria-label="Verified business" />
            </span>
          )}
        </h2>
        <p className="bu-trust-where">
          {region} · {distanceKm} km away
        </p>
      </div>

      {!profile ? (
        <p className="bu-trust-note">New on Farmora, no completed orders yet.</p>
      ) : (
        <>
          <dl className="bu-trust-row">
            <div>
              <dd>
                {profile.rating.toFixed(1)} <Star size={13} className="bu-star" aria-hidden="true" />
              </dd>
              <dt>{profile.ratingCount} ratings</dt>
            </div>
            <div>
              <dd className={profile.onTimeRate < 90 ? "bu-trust-low" : undefined}>{profile.onTimeRate}%</dd>
              <dt>on time</dt>
            </div>
            <div>
              <dd>{profile.completedOrders}</dd>
              <dt>orders</dt>
            </div>
          </dl>

          <ul className="bu-trust-facts">
            <li>
              <span>Full quantity delivered</span>
              <span className={profile.fulfilmentRate < 95 ? "bu-trust-low" : undefined}>{profile.fulfilmentRate}%</span>
            </li>
            <li>
              <span>Grade matched on arrival</span>
              <span className={profile.gradeAccuracy < 90 ? "bu-trust-low" : undefined}>{profile.gradeAccuracy}%</span>
            </li>
            <li>
              <span>Usually confirms a hold in</span>
              <span>{profile.responseHours} h</span>
            </li>
            <li>
              <span>Problems, last 90 days</span>
              <span className={profile.recentIssues > 0 ? "bu-trust-low" : undefined}>{profile.recentIssues}</span>
            </li>
            <li>
              <span>Certifications</span>
              <span>{profile.certifications.length > 0 ? profile.certifications.join(", ") : "None"}</span>
            </li>
            <li>
              <span>On Farmora since</span>
              <span>{profile.memberSince}</span>
            </li>
          </ul>

          {!profile.verified && <p className="bu-trust-warn">Business registration not checked yet.</p>}

          {profile.reviews.length > 0 && (
            <div className="bu-trust-reviews">
              <h3>Reviews</h3>
              <ul>
                {profile.reviews.map((review) => (
                  <li key={`${review.buyer}-${review.daysAgo}`}>
                    <div className="bu-trust-review-head">
                      <span>{review.buyer}</span>
                      <span className="bu-trust-soft">{ago(review.daysAgo)}</span>
                    </div>
                    <Stars rating={review.rating} size={11} />
                    <p>{review.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
