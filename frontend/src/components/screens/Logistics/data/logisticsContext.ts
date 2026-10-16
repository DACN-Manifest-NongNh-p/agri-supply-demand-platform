import { useOutletContext } from "react-router-dom";
import type { MarketDelivery } from "../../Coordinator/data/mockCoordinator";
import type { OperatingRoute, OperatingSchedule, ProviderProfile, TeamMember, TeamRole, TransportOrder, Vehicle } from "./mockLogistics";

/** A problem the provider reported on a trip; it goes to the Farmora coordinator. */
export type Incident = { type: string; note: string; time: string; newEta?: string; cleared?: boolean };

export type Receipt = { receivedBy: string; receivedKg: number; note?: string };

/** State shared by every /logistics page, owned by LogisticsLayout. */
export type LogisticsState = {
  profile: ProviderProfile;
  saveProfile: (profile: ProviderProfile) => void;

  team: TeamMember[];
  inviteMember: (member: { name: string; email: string; role: TeamRole }) => void;
  changeRole: (memberId: string, role: TeamRole) => void;
  removeMember: (memberId: string) => void;

  fleet: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, "bookedDays" | "offDays">) => void;
  removeVehicle: (plate: string) => void;
  /** Marks a free day unavailable, or an unavailable day free again. Booked days stay booked. */
  toggleOffDay: (plate: string, day: number) => void;
  /** Replaces the days a vehicle is marked unavailable (saving the fleet page). Booked days are kept out. */
  setOffDays: (plate: string, days: number[]) => void;
  serviceAreas: string[];
  setServiceAreas: (areas: string[]) => void;
  operatingRoutes: OperatingRoute[];
  setOperatingRoutes: (routes: OperatingRoute[]) => void;
  schedule: OperatingSchedule;
  setSchedule: (schedule: OperatingSchedule) => void;

  orders: TransportOrder[];
  /** Takes the order with a vehicle; returns the new trip's delivery id. */
  acceptOrder: (orderId: string, plate: string, driver: string) => string;
  /** Hands the order back; Farmora offers it to the next suitable carrier. */
  declineOrder: (orderId: string, reason: string) => void;

  trips: MarketDelivery[];
  /** Moves a trip to its next step (picked up, on the road). */
  advanceTrip: (tripId: string, note?: string) => void;
  completeTrip: (tripId: string, receipt: Receipt) => void;
  incidents: Record<string, Incident[]>;
  reportIncident: (tripId: string, incident: Omit<Incident, "time">) => void;
  /** The trip is back on schedule; the coordinator is told. */
  clearIncident: (tripId: string) => void;
};

export function useLogistics() {
  return useOutletContext<LogisticsState>();
}
