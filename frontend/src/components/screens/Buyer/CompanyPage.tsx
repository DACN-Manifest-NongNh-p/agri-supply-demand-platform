import { useState } from "react";
import { ArrowLeft, Clock, MapPin, Pencil, Plus, Star, Trash2, User } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AddressForm } from "./sections/AddressForm";
import { buyer, type DeliveryAddress } from "./data/mockBuyer";
import { useBuyer } from "./data/buyerContext";

/** Only same-app paths are followed after saving. */
function safeReturn(value: string | null) {
  return value && value.startsWith("/buyer") ? value : null;
}

function PointCard({ address, isDefault, onEdit }: { address: DeliveryAddress; isDefault: boolean; onEdit: () => void }) {
  const { addresses, removeAddress, makeDefaultAddress } = useBuyer();
  return (
    <li className="bu-point">
      <div className="bu-point-main">
        <p className="bu-point-title">
          <strong>{address.label}</strong>
          {isDefault && <span className="bu-point-default">Default</span>}
        </p>
        <p className="bu-address-line">
          <MapPin size={13} aria-hidden="true" /> {[address.street, address.ward, address.district, address.province].filter(Boolean).join(", ")}
        </p>
        <p className="bu-address-meta">
          <span>
            <User size={12} aria-hidden="true" /> {address.contactName} · {address.phone}
          </span>
          <span>
            <Clock size={12} aria-hidden="true" /> Receives {address.receivingHours}
          </span>
        </p>
        {address.note && <p className="bu-point-note">{address.note}</p>}
      </div>
      <div className="bu-point-actions">
        <button type="button" className="ph-btn" onClick={onEdit}>
          <Pencil size={14} /> Edit
        </button>
        {!isDefault && (
          <button type="button" className="ph-btn" onClick={() => makeDefaultAddress(address.id)}>
            <Star size={14} /> Make default
          </button>
        )}
        <button
          type="button"
          className="ph-btn ph-btn--icon"
          aria-label={`Remove ${address.label}`}
          title={addresses.length === 1 ? "Keep at least one delivery point" : `Remove ${address.label}`}
          disabled={addresses.length === 1}
          onClick={() => removeAddress(address.id)}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
}

/** The buyer's company and the delivery points demands can be sent to. */
export default function CompanyPage() {
  const { addresses, addAddress, updateAddress } = useBuyer();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = safeReturn(params.get("returnTo"));
  const [adding, setAdding] = useState(params.get("add") === "1");
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <main className="ph-main bu-company">
      <Link to={returnTo ?? "/buyer"} state={returnTo ? { resume: true } : undefined} className="ph-back">
        <ArrowLeft size={16} /> {returnTo ? "Back to your demand" : "Back to home"}
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Your company</p>
          <h1>{buyer.name}</h1>
          <p className="ph-hello-summary">
            {buyer.type} · {buyer.contact}, {buyer.role.toLowerCase()}
          </p>
        </div>
      </section>

      <section className="ph-card" aria-labelledby="points-title">
        <div className="ph-section-head">
          <div>
            <h2 id="points-title">Delivery points</h2>
            <p className="ph-section-sub">Where you receive goods. Each demand goes to one of these; the default is picked first.</p>
          </div>
          {!adding && (
            <button type="button" className="ph-btn ph-btn--primary" onClick={() => setAdding(true)}>
              <Plus size={16} /> Add delivery point
            </button>
          )}
        </div>

        {adding && (
          <div className="bu-point-editor">
            <h3>New delivery point</h3>
            <AddressForm
              submitLabel={returnTo ? "Save and use it" : "Save delivery point"}
              onCancel={() => (returnTo ? navigate(returnTo, { state: { resume: true } }) : setAdding(false))}
              onSave={(address) => {
                const id = addAddress(address);
                setAdding(false);
                // Coming from a demand: go back with the new point selected.
                if (returnTo) navigate(returnTo, { state: { resume: true, addressId: id } });
              }}
            />
          </div>
        )}

        <ul className="bu-points">
          {addresses.map((address, index) =>
            editing === address.id ? (
              <li key={address.id} className="bu-point-editor">
                <h3>Edit {address.label}</h3>
                <AddressForm
                  address={address}
                  submitLabel="Save changes"
                  onCancel={() => setEditing(null)}
                  onSave={(changed) => {
                    updateAddress({ ...changed, id: address.id });
                    setEditing(null);
                  }}
                />
              </li>
            ) : (
              <PointCard key={address.id} address={address} isDefault={index === 0} onEdit={() => setEditing(address.id)} />
            ),
          )}
        </ul>
      </section>
    </main>
  );
}
