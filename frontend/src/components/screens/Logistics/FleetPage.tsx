import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, Snowflake, Trash2, X } from "lucide-react";
import { formatDay, formatKg } from "../Producer/data/format";
import { dayState } from "./data/capacity";
import { PROVINCES, VEHICLE_TYPES, WEEKDAYS, isRefrigerated, type Vehicle, type VehicleType } from "./data/mockLogistics";
import { useLogistics } from "./data/logisticsContext";

const WEEK = [0, 1, 2, 3, 4, 5, 6];
const PLATE = /^\d{2}[A-Z]{1,2}-\d{3}\.\d{2}$/;

function AddVehicleDialog({ onClose }: { onClose: () => void }) {
  const { fleet, team, addVehicle } = useLogistics();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const drivers = team.filter((member) => member.role === "Driver");

  // No close() in cleanup, because StrictMode re-runs effects.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const plate = String(data.get("plate") ?? "").trim().toUpperCase();
    const capacityKg = Number(data.get("capacity"));
    const problems: string[] = [];
    if (!PLATE.test(plate)) problems.push("Enter the plate as on the registration, e.g. 51C-482.19.");
    else if (fleet.some((vehicle) => vehicle.plate === plate)) problems.push(`${plate} is already in your fleet.`);
    if (!Number.isFinite(capacityKg) || capacityKg < 100) problems.push("Enter the payload in kilograms (at least 100 kg).");
    setErrors(problems);
    if (problems.length > 0) return;
    addVehicle({
      plate,
      type: String(data.get("type")) as VehicleType,
      capacityKg,
      base: String(data.get("base") ?? "").trim() || "Not set",
      driver: String(data.get("driver") ?? "") || undefined,
    });
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="ph-form-dialog"
      aria-labelledby="vehicle-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className="ph-form-dialog-head">
        <div>
          <p className="ph-eyebrow">Capacity</p>
          <h2 id="vehicle-title">Add a vehicle</h2>
        </div>
        <button type="button" className="ph-btn ph-btn--icon" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </header>
      <form className="ph-declare-form" onSubmit={submit} noValidate>
        <div className="ph-field-row">
          <label className="ph-field">
            <span>Plate</span>
            <input name="plate" placeholder="51C-482.19" autoComplete="off" />
          </label>
          <label className="ph-field">
            <span>Type</span>
            <select name="type" defaultValue={VEHICLE_TYPES[0]}>
              {VEHICLE_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="ph-field-row">
          <label className="ph-field">
            <span>Payload (kg)</span>
            <input name="capacity" type="number" min="100" step="100" inputMode="numeric" placeholder="e.g. 3,500" />
          </label>
          <label className="ph-field">
            <span>Default driver</span>
            <select name="driver" defaultValue="">
              <option value="">None yet</option>
              {drivers.map((member) => (
                <option key={member.id}>{member.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="ph-field">
          <span>Based at</span>
          <input name="base" placeholder="e.g. District 7, Ho Chi Minh City" />
        </label>
        {errors.length > 0 && (
          <ul className="ph-form-errors" role="alert">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
        <div className="ph-form-actions">
          <button type="button" className="ph-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="ph-btn ph-btn--primary">
            Add vehicle
          </button>
        </div>
      </form>
    </dialog>
  );
}

function DayCell({ vehicle, day }: { vehicle: Vehicle; day: number }) {
  const { toggleOffDay } = useLogistics();
  const state = dayState(vehicle, day);
  const label = `${vehicle.plate} ${formatDay(day)}: ${state === "free" ? "free" : state === "booked" ? "on a Farmora trip" : "unavailable"}`;
  return (
    <td className="lg-day-cell">
      <button
        type="button"
        className={`lg-day lg-day--${state}`}
        aria-label={label}
        title={state === "booked" ? label : `${label}. Click to mark ${state === "free" ? "unavailable" : "free"}.`}
        disabled={state === "booked"}
        aria-pressed={state === "off"}
        onClick={() => toggleOffDay(vehicle.plate, day)}
      />
    </td>
  );
}

/** Provinces served and the corridors run between them. */
function WhereSection() {
  const { serviceAreas, setServiceAreas, operatingRoutes, setOperatingRoutes } = useLogistics();
  const [area, setArea] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const remaining = PROVINCES.filter((province) => !serviceAreas.includes(province));
  const duplicate = operatingRoutes.some((route) => (route.from === from && route.to === to) || (route.from === to && route.to === from));
  const canAddRoute = from && to && from !== to && !duplicate;

  return (
    <section className="ph-card" aria-labelledby="where-title">
      <div className="ph-section-head">
        <h2 id="where-title">Where you operate</h2>
      </div>

      <h3 className="lg-sub">Areas</h3>
      <ul className="lg-chips">
        {serviceAreas.map((province) => (
          <li key={province}>
            {province}
            <button
              type="button"
              aria-label={`Remove ${province}`}
              disabled={serviceAreas.length === 1}
              onClick={() => {
                setServiceAreas(serviceAreas.filter((item) => item !== province));
                // A route needs both ends inside the areas.
                setOperatingRoutes(operatingRoutes.filter((route) => route.from !== province && route.to !== province));
              }}
            >
              <X size={13} />
            </button>
          </li>
        ))}
      </ul>
      {remaining.length > 0 && (
        <form
          className="lg-area-add"
          onSubmit={(event) => {
            event.preventDefault();
            if (!area) return;
            setServiceAreas([...serviceAreas, area]);
            setArea("");
          }}
        >
          <select aria-label="Province to add" value={area} onChange={(event) => setArea(event.target.value)}>
            <option value="">Add a province…</option>
            {remaining.map((province) => (
              <option key={province}>{province}</option>
            ))}
          </select>
          <button type="submit" className="ph-btn" disabled={!area}>
            Add
          </button>
        </form>
      )}

      <h3 className="lg-sub">Routes (both directions)</h3>
      {operatingRoutes.length === 0 ? (
        <p className="lg-empty">No routes yet.</p>
      ) : (
        <ul className="lg-chips">
          {operatingRoutes.map((route) => (
            <li key={`${route.from}-${route.to}`}>
              {route.from} ⇄ {route.to}
              <button
                type="button"
                aria-label={`Remove ${route.from} to ${route.to}`}
                onClick={() => setOperatingRoutes(operatingRoutes.filter((item) => item !== route))}
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="lg-area-add"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canAddRoute) return;
          setOperatingRoutes([...operatingRoutes, { from, to }]);
          setFrom("");
          setTo("");
        }}
      >
        <select aria-label="Route from" value={from} onChange={(event) => setFrom(event.target.value)}>
          <option value="">From…</option>
          {serviceAreas.map((province) => (
            <option key={province}>{province}</option>
          ))}
        </select>
        <select aria-label="Route to" value={to} onChange={(event) => setTo(event.target.value)}>
          <option value="">To…</option>
          {serviceAreas
            .filter((province) => province !== from)
            .map((province) => (
              <option key={province}>{province}</option>
            ))}
        </select>
        <button type="submit" className="ph-btn" disabled={!canAddRoute}>
          Add route
        </button>
      </form>
    </section>
  );
}

/** Days of the week and hours the company takes pickups and drop-offs. */
function WhenSection() {
  const { schedule, setSchedule } = useLogistics();
  // Monday first, the way Vietnamese calendars read.
  const order = [1, 2, 3, 4, 5, 6, 0];
  const badHours = schedule.from >= schedule.to;

  return (
    <section className="ph-card" aria-labelledby="when-title">
      <div className="ph-section-head">
        <h2 id="when-title">When you operate</h2>
      </div>

      <h3 className="lg-sub">Days</h3>
      <div className="lg-weekdays" role="group" aria-label="Operating days">
        {order.map((day) => {
          const on = schedule.days.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={on}
              className={on ? "lg-weekday lg-weekday--on" : "lg-weekday"}
              // At least one day stays on.
              disabled={on && schedule.days.length === 1}
              onClick={() => setSchedule({ ...schedule, days: on ? schedule.days.filter((item) => item !== day) : [...schedule.days, day] })}
            >
              {WEEKDAYS[day]}
            </button>
          );
        })}
      </div>

      <h3 className="lg-sub">Hours</h3>
      <div className="lg-hours">
        <label>
          <span className="ph-sr-only">From</span>
          <input type="time" value={schedule.from} onChange={(event) => setSchedule({ ...schedule, from: event.target.value })} />
        </label>
        <span className="ph-muted">to</span>
        <label>
          <span className="ph-sr-only">To</span>
          <input type="time" value={schedule.to} onChange={(event) => setSchedule({ ...schedule, to: event.target.value })} />
        </label>
      </div>
      {badHours && <p className="ph-field-error">The closing time must be after the opening time.</p>}
      <p className="lg-note lg-when-note">Single vehicles can still be marked unavailable on a day in the table above.</p>
    </section>
  );
}

/** What the provider declares to Farmora: vehicles (type, payload, availability), where and when it operates. */
export default function FleetPage() {
  const { fleet, removeVehicle } = useLogistics();
  const [adding, setAdding] = useState(false);

  const total = fleet.reduce((sum, vehicle) => sum + vehicle.capacityKg, 0);
  const cold = fleet.filter((vehicle) => isRefrigerated(vehicle.type)).length;
  const freeToday = fleet.filter((vehicle) => dayState(vehicle, 0) === "free").length;

  return (
    <main className="ph-main lg-page">
      <header className="lg-head lg-head--action">
        <div>
          <h1>Fleet</h1>
          <p>
            {fleet.length} vehicles ({cold} refrigerated, {fleet.length - cold} regular) · {formatKg(total)} · {freeToday} free today
          </p>
        </div>
        <button type="button" className="ph-btn ph-btn--primary" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add vehicle
        </button>
      </header>

      <section className="ph-card" aria-labelledby="vehicles-title">
        <div className="ph-section-head">
          <h2 id="vehicles-title">Next 7 days</h2>
          <ul className="lg-legend" aria-hidden="true">
            <li><span className="lg-day lg-day--free" /> Free</li>
            <li><span className="lg-day lg-day--booked" /> On a trip</li>
            <li><span className="lg-day lg-day--off" /> Unavailable (click a day)</li>
          </ul>
        </div>

        <div className="ph-table-scroll">
          <table className="co-table lg-fleet-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th className="co-num">Payload</th>
                <th>Driver</th>
                {WEEK.map((day) => (
                  <th key={day} className="lg-day-head">
                    {day === 0 ? "Today" : formatDay(day).split(" ")[0]}
                  </th>
                ))}
                <th>
                  <span className="ph-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {fleet.map((vehicle) => (
                <tr key={vehicle.plate}>
                  <td>
                    <strong className="lg-plate">{vehicle.plate}</strong>
                    <span className="ph-muted lg-vehicle-type">
                      {isRefrigerated(vehicle.type) && <Snowflake size={12} aria-hidden="true" />} {vehicle.type} · {vehicle.base}
                    </span>
                  </td>
                  <td className="co-num">{formatKg(vehicle.capacityKg)}</td>
                  <td>{vehicle.driver ?? <span className="ph-muted">None</span>}</td>
                  {WEEK.map((day) => (
                    <DayCell key={day} vehicle={vehicle} day={day} />
                  ))}
                  <td className="co-row-actions">
                    <button
                      type="button"
                      className="ph-btn ph-btn--icon"
                      aria-label={`Remove ${vehicle.plate}`}
                      title={vehicle.bookedDays.some((day) => day >= 0) ? "Has upcoming trips" : `Remove ${vehicle.plate}`}
                      disabled={vehicle.bookedDays.some((day) => day >= 0)}
                      onClick={() => removeVehicle(vehicle.plate)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="lg-operate">
        <WhereSection />
        <WhenSection />
      </div>

      {adding && <AddVehicleDialog onClose={() => setAdding(false)} />}
    </main>
  );
}
