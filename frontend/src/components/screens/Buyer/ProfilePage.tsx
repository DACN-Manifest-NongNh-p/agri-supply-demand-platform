import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { useBuyer } from "./data/buyerContext";

function DeliveryPointsCard() {
  const { addresses } = useBuyer();
  const main = addresses[0];
  return (
    <section className="ph-card pf-section" aria-labelledby="pf-points">
      <Link to="/buyer/company" className="pf-aside-link">
        <span>
          <h2 id="pf-points">Delivery points</h2>
          <p>
            <MapPin size={12} /> {addresses.length} {addresses.length === 1 ? "point" : "points"}
            {main && ` · default ${main.label}`}
          </p>
        </span>
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}

export default function BuyerProfilePage() {
  return <ProfilePage area="buyer" roleLabel="Buyer" orgLabel="Company" aside={<DeliveryPointsCard />} />;
}
