import { useState, type FormEvent } from "react";
import { PROVINCES, type DeliveryAddress } from "../data/mockBuyer";

const PHONE = /^0\d{9,10}$/;

type Draft = Omit<DeliveryAddress, "id" | "receivingHours"> & { from: string; to: string };

function toDraft(address?: DeliveryAddress): Draft {
  const [from = "06:00", to = "10:00"] = address?.receivingHours.split("–") ?? [];
  return {
    label: address?.label ?? "",
    street: address?.street ?? "",
    ward: address?.ward ?? "",
    district: address?.district ?? "",
    province: address?.province ?? PROVINCES[0],
    contactName: address?.contactName ?? "",
    phone: address?.phone ?? "",
    note: address?.note ?? "",
    from,
    to,
  };
}

type Props = {
  /** The address being edited; empty for a new one. */
  address?: DeliveryAddress;
  submitLabel: string;
  onSave: (address: Omit<DeliveryAddress, "id">) => void;
  onCancel: () => void;
};

/** Everything a carrier needs to deliver: where, who signs, when the dock is open, how to get in. */
export function AddressForm({ address, submitLabel, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(address));
  const [errors, setErrors] = useState<string[]>([]);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problems: string[] = [];
    if (!draft.label.trim()) problems.push("Name the delivery point, e.g. Thu Duc store.");
    if (!draft.street.trim() || !draft.district.trim()) problems.push("Enter the street and district.");
    if (!draft.contactName.trim()) problems.push("Enter who receives the goods.");
    if (!PHONE.test(draft.phone.replace(/[\s.-]/g, ""))) problems.push("Enter a valid phone number, e.g. 0903 112 458.");
    if (draft.from >= draft.to) problems.push("Receiving hours must end after they start.");
    setErrors(problems);
    if (problems.length > 0) return;

    const { from, to, ...rest } = draft;
    onSave({
      label: rest.label.trim(),
      street: rest.street.trim(),
      ward: rest.ward?.trim() || undefined,
      district: rest.district.trim(),
      province: rest.province,
      contactName: rest.contactName.trim(),
      phone: rest.phone.trim(),
      note: rest.note?.trim() || undefined,
      receivingHours: `${from}–${to}`,
    });
  };

  return (
    <form className="bu-address-form" onSubmit={submit} noValidate>
      <div className="ph-field-row">
        <label className="ph-field">
          <span>Name of the place</span>
          <input placeholder="e.g. Thu Duc store" value={draft.label} autoFocus onChange={(event) => set("label", event.target.value)} />
        </label>
        <label className="ph-field">
          <span>Province / city</span>
          <select value={draft.province} onChange={(event) => set("province", event.target.value)}>
            {PROVINCES.map((province) => (
              <option key={province}>{province}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="ph-field-row">
        <label className="ph-field">
          <span>District</span>
          <input placeholder="e.g. Thu Duc" value={draft.district} onChange={(event) => set("district", event.target.value)} />
        </label>
        <label className="ph-field">
          <span>Ward (optional)</span>
          <input placeholder="e.g. Binh Tho" value={draft.ward} onChange={(event) => set("ward", event.target.value)} />
        </label>
      </div>
      <label className="ph-field">
        <span>Street and number</span>
        <input placeholder="e.g. 216 Vo Van Ngan" autoComplete="street-address" value={draft.street} onChange={(event) => set("street", event.target.value)} />
      </label>
      <div className="ph-field-row">
        <label className="ph-field">
          <span>Received by</span>
          <input placeholder="Who signs for the goods" value={draft.contactName} onChange={(event) => set("contactName", event.target.value)} />
        </label>
        <label className="ph-field">
          <span>Phone</span>
          <input type="tel" inputMode="tel" placeholder="0903 112 458" value={draft.phone} onChange={(event) => set("phone", event.target.value)} />
        </label>
      </div>
      <div className="ph-field-row">
        <div className="ph-field">
          <span id="address-hours">Receiving hours</span>
          <div className="bu-hours" role="group" aria-labelledby="address-hours">
            <input type="time" aria-label="From" value={draft.from} onChange={(event) => set("from", event.target.value)} />
            <span className="ph-muted">to</span>
            <input type="time" aria-label="To" value={draft.to} onChange={(event) => set("to", event.target.value)} />
          </div>
        </div>
        <label className="ph-field">
          <span>Instructions for the driver (optional)</span>
          <input placeholder="e.g. Dock 2, enter from the side street" value={draft.note} onChange={(event) => set("note", event.target.value)} />
        </label>
      </div>

      {errors.length > 0 && (
        <ul className="ph-form-errors" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div className="ph-form-actions">
        <button type="button" className="ph-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="ph-btn ph-btn--primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
