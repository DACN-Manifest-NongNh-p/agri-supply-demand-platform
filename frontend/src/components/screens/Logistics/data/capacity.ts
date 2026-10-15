// Which declared vehicle can carry which transport order. Farmora uses the same rules to pick
// the carrier it offers an order to, so what the provider declares here decides what it is offered.
import { dateFromToday, formatDay, formatKg } from "../../Producer/data/format";
import { WEEKDAYS, isRefrigerated, type OperatingRoute, type OperatingSchedule, type TransportOrder, type Vehicle } from "./mockLogistics";

/** Every day an order keeps a vehicle busy, from pickup to drop-off. */
export function orderDays(order: TransportOrder) {
  const days: number[] = [];
  for (let day = order.pickup.day; day <= order.dropoff.day; day += 1) days.push(day);
  return days;
}

export type VehicleFit = { vehicle: Vehicle; fits: boolean; problems: string[] };

export function vehicleFit(order: TransportOrder, vehicle: Vehicle): VehicleFit {
  const problems: string[] = [];
  if (vehicle.capacityKg < order.quantityKg) problems.push(`carries ${formatKg(vehicle.capacityKg)}, the order is ${formatKg(order.quantityKg)}`);
  if (order.needsCold && !isRefrigerated(vehicle.type)) problems.push("not refrigerated");
  const days = orderDays(order);
  const booked = days.find((day) => vehicle.bookedDays.includes(day));
  const off = days.find((day) => vehicle.offDays.includes(day));
  if (booked !== undefined) problems.push(`on another trip ${formatDay(booked).toLowerCase()}`);
  else if (off !== undefined) problems.push(`marked unavailable ${formatDay(off).toLowerCase()}`);
  return { vehicle, fits: problems.length === 0, problems };
}

/** Vehicles that can take the order first, smallest that fits first, so big trucks stay free. */
export function fitsFor(order: TransportOrder, fleet: Vehicle[]): VehicleFit[] {
  return fleet
    .map((vehicle) => vehicleFit(order, vehicle))
    .sort((a, b) => Number(b.fits) - Number(a.fits) || a.vehicle.capacityKg - b.vehicle.capacityKg);
}

export type Declared = { areas: string[]; routes: OperatingRoute[]; schedule: OperatingSchedule };

export type OrderWarning = { kind: "area" | "route" | "schedule"; text: string };

const runs = (routes: OperatingRoute[], a: string, b: string) =>
  a === b || routes.some((route) => (route.from === a && route.to === b) || (route.from === b && route.to === a));

/**
 * Where an order falls outside what the provider declared: areas, routes, operating days.
 * Warnings, not blocks: Farmora may still offer it when no better carrier is free.
 */
export function orderWarnings(order: TransportOrder, declared: Declared): OrderWarning[] {
  const warnings: OrderWarning[] = [];
  const outside = [order.pickup.province, order.dropoff.province].filter(
    (province, index, list) => !declared.areas.includes(province) && list.indexOf(province) === index,
  );
  if (outside.length > 0) {
    warnings.push({ kind: "area", text: `${outside.join(" and ")} ${outside.length === 1 ? "is" : "are"} outside your service areas` });
  } else if (!runs(declared.routes, order.pickup.province, order.dropoff.province)) {
    warnings.push({ kind: "route", text: `${order.pickup.province} → ${order.dropoff.province} is not one of your routes` });
  }
  const closed = [order.pickup.day, order.dropoff.day].filter(
    (day, index, list) => list.indexOf(day) === index && !declared.schedule.days.includes(dateFromToday(day).getDay()),
  );
  if (closed.length > 0) {
    warnings.push({ kind: "schedule", text: `you do not operate on ${closed.map((day) => WEEKDAYS[dateFromToday(day).getDay()]).join(" or ")}` });
  }
  return warnings;
}

export type DayState = "free" | "booked" | "off";

export function dayState(vehicle: Vehicle, day: number): DayState {
  if (vehicle.bookedDays.includes(day)) return "booked";
  if (vehicle.offDays.includes(day)) return "off";
  return "free";
}

const vnd = new Intl.NumberFormat("vi-VN");

export function formatVnd(amount: number) {
  return `${vnd.format(amount)} ₫`;
}
