import { useEffect, useRef, useState } from "react";
import { CircleCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { MatchScore } from "../../Producer/sections/MatchScore";
import { formatDay, formatDayInText, formatKg } from "../../Producer/data/format";
import { fulfilmentOf, openOf, scoreSupply } from "../data/demands";
import { useBuyer } from "../data/buyerContext";
import type { SupplyBatch } from "../data/mockBuyer";

/** Reserve part of a market batch for one of your open demands of the same product. */
export function ReserveDialog({ batch, onClose }: { batch: SupplyBatch; onClose: () => void }) {
  const { demands, allocations, reserve } = useBuyer();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [done, setDone] = useState<{ demandId: string; kg: number } | null>(null);

  // No close() in cleanup: StrictMode re-runs effects and would close the dialog right away.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const options = demands
    .filter((demand) => demand.product === batch.product)
    .map((demand) => {
      const fulfilment = fulfilmentOf(demand, allocations);
      return { demand, fulfilment, candidate: scoreSupply(demand, batch, fulfilment.openKg) };
    })
    .filter(({ fulfilment }) => fulfilment.openKg > 0)
    .sort((a, b) => Number(b.candidate.eligible) - Number(a.candidate.eligible) || b.candidate.score - a.candidate.score);

  const firstEligible = options.find((option) => option.candidate.eligible);
  const [demandId, setDemandId] = useState(firstEligible?.demand.id ?? "");
  const chosen = options.find((option) => option.demand.id === demandId);
  const max = chosen ? Math.min(openOf(batch), chosen.fulfilment.openKg) : 0;
  const [kg, setKg] = useState(max);
  const valid = Boolean(chosen?.candidate.eligible) && kg > 0 && kg <= max;

  return (
    <dialog
      ref={dialogRef}
      className="ph-form-dialog"
      aria-labelledby="reserve-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className="ph-form-dialog-head">
        <div>
          <p className="ph-eyebrow">{batch.producer}</p>
          <h2 id="reserve-title">Reserve from {batch.code}</h2>
        </div>
        <button type="button" className="ph-btn ph-btn--icon" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </header>

      {done ? (
        <div className="ph-declared">
          <CircleCheck size={36} />
          <h3>{formatKg(done.kg)} reserved</h3>
          <p>
            {batch.producer} has <strong>24 hours</strong> to confirm. Until then the quantity is held for {done.demandId} and nobody else can take it.
          </p>
          <div className="ph-declared-actions">
            <Link to={`/buyer/demands/${done.demandId}#sources`} className="ph-btn ph-btn--primary">View order</Link>
            <button type="button" className="ph-btn" onClick={onClose}>Keep browsing</button>
          </div>
        </div>
      ) : (
        <form
          className="ph-declare-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid || !chosen) return;
            reserve(chosen.demand.id, batch.code, kg);
            setDone({ demandId: chosen.demand.id, kg });
          }}
        >
          <p className="bu-dialog-batch">
            {formatKg(openOf(batch))} {batch.product.toLowerCase()} available · {batch.variety}, grade {batch.grade} · ready {formatDayInText(batch.readyDay)}, sell by {formatDayInText(batch.sellByDay)}
          </p>

          {options.length === 0 ? (
            <p className="ph-muted">
              You have no open {batch.product.toLowerCase()} demand. <Link to="/buyer/demands/new">Post one</Link> first, then reserve.
            </p>
          ) : (
            <fieldset className="ph-field">
              <legend>For which demand?</legend>
              <ul className="ph-considered">
                {options.map(({ demand, fulfilment, candidate }) => (
                  <li key={demand.id}>
                    <label className={candidate.eligible ? "" : "ph-considered--off"}>
                      <input
                        type="radio"
                        name="demand"
                        value={demand.id}
                        disabled={!candidate.eligible}
                        checked={demand.id === demandId}
                        onChange={() => {
                          setDemandId(demand.id);
                          setKg(Math.min(openOf(batch), fulfilment.openKg));
                        }}
                      />
                      <span>
                        <strong>{demand.id}</strong> · {formatKg(fulfilment.openKg)} open, {demand.gradeWanted}
                        <small>
                          {candidate.eligible
                            ? `Needed by ${formatDay(demand.neededByDay)}`
                            : candidate.criteria.find((criterion) => criterion.state === "fail")?.detail}
                        </small>
                      </span>
                      {candidate.eligible ? <MatchScore score={candidate.score} /> : <span className="ph-match-none">Does not fit</span>}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}

          {chosen?.candidate.eligible && (
            <label className="ph-field">
              <span>Quantity (kg), up to {formatKg(max)}</span>
              <input type="number" min={1} max={max} value={kg} onChange={(event) => setKg(Number(event.target.value))} />
            </label>
          )}

          <div className="ph-form-actions">
            <button type="button" className="ph-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="ph-btn ph-btn--primary" disabled={!valid}>Reserve {valid ? formatKg(kg) : ""}</button>
          </div>
        </form>
      )}
    </dialog>
  );
}
