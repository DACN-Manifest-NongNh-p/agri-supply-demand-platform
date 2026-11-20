import { Link } from "react-router-dom";
import { formatAddress } from "../data/mockBuyer";
import { useBuyerData } from "../model/store";

/** Delivery location from the saved points; the value is the full address line. */
export function AddressPicker({ value, onChange, disabled }: { value: string; onChange: (address: string, province: string) => void; disabled?: boolean }) {
  const { addresses } = useBuyerData();
  const known = addresses.some((item) => formatAddress(item) === value);
  return (
    <div className="bf-address-picker">
      <select
        value={known ? value : value ? "__custom" : ""}
        disabled={disabled}
        onChange={(event) => {
          const address = addresses.find((item) => formatAddress(item) === event.target.value);
          if (address) onChange(formatAddress(address), address.province);
        }}
      >
        <option value="">Choose a delivery point…</option>
        {!known && value && <option value="__custom">{value}</option>}
        {addresses.map((item) => (
          <option key={item.id} value={formatAddress(item)}>
            {item.label} · {item.district}, {item.province} · receives {item.receivingHours}
          </option>
        ))}
      </select>
      <Link to="/buyer/delivery-points" className="ph-link-btn">
        Manage delivery points
      </Link>
    </div>
  );
}
