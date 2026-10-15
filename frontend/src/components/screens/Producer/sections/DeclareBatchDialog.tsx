import { useEffect, useRef, useState } from "react";
import { PhotoPicker } from "./BatchPhotos";
import { CircleCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { demands, producer, type Batch } from "../data/mockProducer";
import { matchDemand } from "../data/matching";
import { dateFromToday } from "../data/format";

type Draft = Omit<Batch, "code" | "allocatedKg" | "status">;

const GRADES: Batch["grade"][] = ["A", "B", "C"];

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

/** Demands the new batch would be eligible for, so the producer sees the payoff right away. */
function matchesFor(draft: Draft) {
  const candidate: Batch = { ...draft, code: "new", allocatedKg: 0, status: draft.readyDay <= 0 ? "ready" : "expected" };
  return demands.filter((demand) => matchDemand(demand, [candidate]).best).length;
}

type Props = {
  onClose: () => void;
  onDeclare: (draft: Draft) => string;
  onView: (code: string) => void;
};

export function DeclareBatchDialog({ onClose, onDeclare, onView }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [declared, setDeclared] = useState<{ code: string; matches: number } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState("");
  // Photos of a batch that was never declared are released when the dialog goes away.
  const kept = useRef({ photos: [] as string[], declared: false });
  useEffect(() => {
    kept.current.photos = photos;
  }, [photos]);

  // See MarketInsights: no close() in cleanup, because StrictMode re-runs effects.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    const state = kept.current;
    return () => {
      if (!state.declared) state.photos.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const submit = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    const quantityKg = Number(text("quantity"));
    const harvestDay = toOffset(text("harvest"));
    const readyDay = toOffset(text("ready"));
    const sellByDay = toOffset(text("sellBy"));

    const problems: string[] = [];
    if (!Number.isFinite(quantityKg) || quantityKg <= 0) problems.push("Enter a quantity above 0 kg.");
    if (!text("variety")) problems.push("Enter the variety.");
    if (readyDay < harvestDay) problems.push("The ready date cannot be before the harvest date.");
    if (sellByDay <= readyDay) problems.push("The sell-by date must be after the ready date.");
    if (photos.length === 0) problems.push("Add at least one photo of the batch.");
    setErrors(problems);
    if (problems.length > 0) return;

    const draft: Draft = {
      product: text("product"),
      variety: text("variety"),
      plot: text("plot") || "Unassigned plot",
      quantityKg,
      grade: text("grade") as Batch["grade"],
      harvestDay,
      readyDay,
      sellByDay,
      photos,
    };
    kept.current.declared = true;
    setDeclared({ code: onDeclare(draft), matches: matchesFor(draft) });
  };

  return (
    <dialog
      ref={dialogRef}
      className="ph-form-dialog"
      aria-labelledby="declare-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className="ph-form-dialog-head">
        <div>
          <p className="ph-eyebrow">New supply</p>
          <h2 id="declare-title">Declare a batch</h2>
        </div>
        <button type="button" className="ph-btn ph-btn--icon" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </header>

      {declared ? (
        <div className="ph-declared">
          <CircleCheck size={36} />
          <h3>{declared.code} is declared</h3>
          <p>
            Farmora matched it against open demand:{" "}
            <strong>
              {declared.matches === 0
                ? "no buyer matches it yet"
                : `${declared.matches} ${declared.matches === 1 ? "buyer demand matches" : "buyer demands match"}`}
            </strong>
            . New demand is checked against it automatically.
          </p>
          <div className="ph-declared-actions">
            <button type="button" className="ph-btn ph-btn--primary" onClick={() => onView(declared.code)}>
              View {declared.code}
            </button>
            {declared.matches > 0 && (
              <Link to="/producer/demand" className="ph-btn">See matches</Link>
            )}
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
              <select name="product" defaultValue={producer.products[0]}>
                {producer.products.map((product) => (
                  <option key={product}>{product}</option>
                ))}
              </select>
            </label>
            <label className="ph-field">
              <span>Variety</span>
              <input name="variety" placeholder="e.g. White flesh" />
            </label>
          </div>

          <div className="ph-field-row">
            <label className="ph-field">
              <span>Quantity (kg)</span>
              <input name="quantity" type="number" min="1" inputMode="numeric" placeholder="e.g. 2,000" />
            </label>
            <label className="ph-field">
              <span>Plot</span>
              <input name="plot" placeholder="e.g. Plot 6" />
            </label>
          </div>

          <fieldset className="ph-field">
            <legend>Grade</legend>
            <div className="ph-grade-options">
              {GRADES.map((grade, index) => (
                <label key={grade}>
                  <input type="radio" name="grade" value={grade} defaultChecked={index === 0} />
                  <span>Grade {grade}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="ph-field-row ph-field-row--3">
            <label className="ph-field">
              <span>Expected harvest</span>
              <input name="harvest" type="date" defaultValue={toInputDate(3)} />
            </label>
            <label className="ph-field">
              <span>Ready to sell</span>
              <input name="ready" type="date" defaultValue={toInputDate(4)} />
            </label>
            <label className="ph-field">
              <span>Sell by</span>
              <input name="sellBy" type="date" defaultValue={toInputDate(10)} />
            </label>
          </div>

          <div className="ph-field">
            <span id="photos-label">Photos of the batch</span>
            <p className="ph-field-hint" id="photos-hint">
              1 to 4 photos: the crates as packed and a close-up of the fruit. Buyers see them before they reserve.
            </p>
            <div role="group" aria-labelledby="photos-label" aria-describedby="photos-hint">
              <PhotoPicker
                photos={photos}
                onChange={(next) => {
                  setPhotos(next);
                  setPhotoError("");
                }}
                onError={setPhotoError}
              />
            </div>
            {photoError && <p className="ph-field-error">{photoError}</p>}
          </div>

          {errors.length > 0 && (
            <ul className="ph-form-errors" role="alert">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}

          <div className="ph-form-actions">
            <button type="button" className="ph-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="ph-btn ph-btn--primary">Declare batch</button>
          </div>
        </form>
      )}
    </dialog>
  );
}
