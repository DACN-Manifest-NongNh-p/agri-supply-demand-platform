import { useEffect, useRef, useState } from "react";
import { CircleCheck, X } from "lucide-react";
import { dateFromToday } from "../../Producer/data/format";
import { rankSupply } from "../data/demands";
import { useBuyer } from "../data/buyerContext";
import { buyer, GRADE_OPTIONS, type BuyerDemand } from "../data/mockBuyer";

function toInputDate(offset: number) {
  const date = dateFromToday(offset);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function toOffset(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const picked = new Date(year, month - 1, day);
  return Math.round((picked.getTime() - dateFromToday(0).getTime()) / 86_400_000);
}

type Props = {
  onClose: () => void;
  onView: (id: string) => void;
};

/** Posting a demand runs matching straight away, so the buyer sees how much supply already fits. */
export function CreateDemandDialog({ onClose, onView }: Props) {
  const { addDemand, supply } = useBuyer();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [posted, setPosted] = useState<{ id: string; options: number } | null>(null);

  // No close() in cleanup: StrictMode re-runs effects and would close the dialog right away.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const submit = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    const quantityKg = Number(text("quantity"));
    const neededByDay = toOffset(text("neededBy"));

    const problems: string[] = [];
    if (!Number.isFinite(quantityKg) || quantityKg <= 0) problems.push("Enter a quantity above 0 kg.");
    if (!Number.isFinite(neededByDay) || neededByDay < 1) problems.push("The needed-by date must be tomorrow or later.");
    setErrors(problems);
    if (problems.length > 0) return;

    const draft: Omit<BuyerDemand, "id" | "createdDay" | "destination"> = {
      product: text("product"),
      quantityKg,
      gradeWanted: text("grade"),
      neededByDay,
      note: text("note") || undefined,
    };
    const preview: BuyerDemand = { ...draft, id: "new", createdDay: 0, destination: buyer.destination };
    setPosted({ id: addDemand(draft), options: rankSupply(preview, supply, quantityKg).candidates.length });
  };

  return (
    <dialog
      ref={dialogRef}
      className="ph-form-dialog"
      aria-labelledby="demand-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className="ph-form-dialog-head">
        <div>
          <p className="ph-eyebrow">New demand</p>
          <h2 id="demand-title">What do you need?</h2>
        </div>
        <button type="button" className="ph-btn ph-btn--icon" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </header>

      {posted ? (
        <div className="ph-declared">
          <CircleCheck size={36} />
          <h3>{posted.id} is posted</h3>
          <p>
            Farmora checked it against declared supply:{" "}
            <strong>
              {posted.options === 0
                ? "no batch fits yet"
                : `${posted.options} ${posted.options === 1 ? "batch fits" : "batches fit"}`}
            </strong>
            . New batches are matched against it automatically.
          </p>
          <div className="ph-declared-actions">
            <button type="button" className="ph-btn ph-btn--primary" onClick={() => onView(posted.id)}>
              {posted.options > 0 ? "See suggested supply" : `View ${posted.id}`}
            </button>
            <button type="button" className="ph-btn" onClick={onClose}>Done</button>
          </div>
        </div>
      ) : (
        <form
          className="ph-declare-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submit(event.currentTarget);
          }}
        >
          <div className="ph-field-row">
            <label className="ph-field">
              <span>Product</span>
              <select name="product" defaultValue={buyer.products[0]}>
                {buyer.products.map((product) => (
                  <option key={product}>{product}</option>
                ))}
              </select>
            </label>
            <label className="ph-field">
              <span>Quantity (kg)</span>
              <input name="quantity" type="number" min="1" inputMode="numeric" placeholder="e.g. 1,500" />
            </label>
          </div>

          <fieldset className="ph-field">
            <legend>Quality</legend>
            <div className="ph-grade-options">
              {GRADE_OPTIONS.map((grade, index) => (
                <label key={grade}>
                  <input type="radio" name="grade" value={grade} defaultChecked={index === 0} />
                  <span>{grade}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="ph-field-row">
            <label className="ph-field">
              <span>Needed by</span>
              <input name="neededBy" type="date" defaultValue={toInputDate(5)} min={toInputDate(1)} />
            </label>
            <label className="ph-field">
              <span>Deliver to</span>
              <input value={buyer.destination} readOnly />
            </label>
          </div>

          <label className="ph-field">
            <span>Notes for producers (optional)</span>
            <input name="note" placeholder="e.g. Red flesh preferred, export packing" />
          </label>

          {errors.length > 0 && (
            <ul className="ph-form-errors" role="alert">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}

          <div className="ph-form-actions">
            <button type="button" className="ph-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="ph-btn ph-btn--primary">Post demand</button>
          </div>
        </form>
      )}
    </dialog>
  );
}
