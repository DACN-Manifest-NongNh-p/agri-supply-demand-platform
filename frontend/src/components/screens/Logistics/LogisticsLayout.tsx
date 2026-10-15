import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ClipboardList, LayoutGrid, Truck, UserCog, Warehouse } from "lucide-react";
import { AreaSidebar } from "../Coordinator/sections/AreaSidebar";
import { useStoredTheme } from "../Coordinator/data/theme";
import { formatDay } from "../Producer/data/format";
import type { MarketDelivery } from "../Coordinator/data/mockCoordinator";
import { deliveries as marketDeliveries } from "../Coordinator/data/mockCoordinator";
import {
  fleet as initialFleet,
  operatingRoutes as initialRoutes,
  orders as initialOrders,
  provider,
  schedule as initialSchedule,
  serviceAreas as initialAreas,
  team as initialTeam,
  trips as initialTrips,
} from "./data/mockLogistics";
import { orderDays } from "./data/capacity";
import type { Incident, LogisticsState } from "./data/logisticsContext";
// Same shell as the coordinator area (sidebar, glass cards), then the provider's own styles.
import "../Producer/styles/ProducerHome.css";
import "../Buyer/styles/Buyer.css";
import "../Coordinator/styles/Coordinator.css";
import "./styles/Logistics.css";

const clock = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** Shell for all logistics provider pages: sidebar plus the demo state shared between them. */
export default function LogisticsLayout() {
  const { theme, toggleTheme } = useStoredTheme("logistics-theme");
  const [profile, setProfile] = useState(provider);
  const [team, setTeam] = useState(initialTeam);
  const [fleet, setFleet] = useState(initialFleet);
  const [serviceAreas, setServiceAreas] = useState(initialAreas);
  const [operatingRoutes, setOperatingRoutes] = useState(initialRoutes);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [orders, setOrders] = useState(initialOrders);
  const [trips, setTrips] = useState(initialTrips);
  const [incidents, setIncidents] = useState<Record<string, Incident[]>>({});
  const location = useLocation();

  // Router navigation does not scroll on its own: jump to #section links, otherwise to the top.
  useEffect(() => {
    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  const updateTrip = (tripId: string, change: (trip: MarketDelivery) => MarketDelivery) =>
    setTrips((current) => current.map((trip) => (trip.id === tripId ? change(trip) : trip)));

  const acceptOrder: LogisticsState["acceptOrder"] = (orderId, plate, driver) => {
    const order = orders.find((item) => item.id === orderId)!;
    // Trip ids continue the platform's shipment numbers (S-307 → S-308).
    const highest = Math.max(...[...marketDeliveries, ...trips].map((trip) => Number(trip.id.replace(/\D/g, "")) || 0));
    const id = `S-${highest + 1}`;
    const trip: MarketDelivery = {
      id,
      batch: order.batch,
      product: order.product,
      buyer: order.buyer,
      producer: order.producer,
      quantityKg: order.quantityKg,
      carrier: profile.name,
      driver: { name: driver },
      vehiclePlate: plate,
      origin: order.pickup.place,
      destination: order.dropoff.place,
      fromShort: order.pickup.short,
      toShort: order.dropoff.short,
      routeKey: order.routeKey,
      progress: 0,
      lastSeen: `Pickup ${formatDay(order.pickup.day).toLowerCase()}, ${order.pickup.window}`,
      step: 0,
      eta: `${formatDay(order.dropoff.day)}, ${order.dropoff.window.replace(/^by /, "")}`,
      events: [],
      temperatures: [],
    };
    setTrips((current) => [trip, ...current]);
    setOrders((current) => current.map((item) => (item.id === orderId ? { ...item, status: "accepted", vehiclePlate: plate, driver, deliveryId: id } : item)));
    setFleet((current) =>
      current.map((vehicle) => (vehicle.plate === plate ? { ...vehicle, bookedDays: [...new Set([...vehicle.bookedDays, ...orderDays(order)])] } : vehicle)),
    );
    return id;
  };

  const advanceTrip: LogisticsState["advanceTrip"] = (tripId, note) =>
    updateTrip(tripId, (trip) => {
      if (trip.step >= 2) return trip;
      const step = (trip.step + 1) as 1 | 2;
      const place = step === 1 ? trip.origin : trip.fromShort;
      const time = clock();
      return {
        ...trip,
        step,
        progress: Math.max(trip.progress, step === 1 ? 0.03 : 0.08),
        lastSeen: `${place} · ${time}`,
        events: [...trip.events, { step, time: `Today, ${time}`, place, note: note || undefined }],
      };
    });

  const completeTrip: LogisticsState["completeTrip"] = (tripId, receipt) => {
    const time = clock();
    updateTrip(tripId, (trip) => ({
      ...trip,
      step: 3,
      progress: 1,
      issue: undefined,
      lastSeen: `Delivered · today ${time}`,
      eta: `Delivered today, ${time}`,
      receipt,
      events: [...trip.events, { step: 3, time: `Today, ${time}`, place: trip.destination, note: `Received by ${receipt.receivedBy}` }],
    }));
  };

  const reportIncident: LogisticsState["reportIncident"] = (tripId, incident) => {
    setIncidents((current) => ({ ...current, [tripId]: [...(current[tripId] ?? []), { ...incident, time: `Today, ${clock()}` }] }));
    updateTrip(tripId, (trip) => ({
      ...trip,
      issue: incident.note ? `${incident.type}: ${incident.note}` : incident.type,
      eta: incident.newEta ? `${incident.newEta} (revised)` : trip.eta,
    }));
  };

  const clearIncident: LogisticsState["clearIncident"] = (tripId) => {
    setIncidents((current) => ({ ...current, [tripId]: (current[tripId] ?? []).map((item) => ({ ...item, cleared: true })) }));
    updateTrip(tripId, (trip) => ({ ...trip, issue: undefined }));
  };

  const state: LogisticsState = {
    profile,
    saveProfile: setProfile,
    team,
    inviteMember: (member) => setTeam((current) => [...current, { ...member, id: `U-${Date.now()}`, status: "invited" }]),
    changeRole: (memberId, role) => setTeam((current) => current.map((member) => (member.id === memberId ? { ...member, role } : member))),
    removeMember: (memberId) => setTeam((current) => current.filter((member) => member.id !== memberId)),
    fleet,
    addVehicle: (vehicle) => setFleet((current) => [...current, { ...vehicle, bookedDays: [], offDays: [] }]),
    removeVehicle: (plate) => setFleet((current) => current.filter((vehicle) => vehicle.plate !== plate)),
    toggleOffDay: (plate, day) =>
      setFleet((current) =>
        current.map((vehicle) => {
          if (vehicle.plate !== plate || vehicle.bookedDays.includes(day)) return vehicle;
          const offDays = vehicle.offDays.includes(day) ? vehicle.offDays.filter((item) => item !== day) : [...vehicle.offDays, day];
          return { ...vehicle, offDays };
        }),
      ),
    serviceAreas,
    setServiceAreas,
    operatingRoutes,
    setOperatingRoutes,
    schedule,
    setSchedule,
    orders,
    acceptOrder,
    declineOrder: (orderId, reason) =>
      setOrders((current) => current.map((item) => (item.id === orderId ? { ...item, status: "declined", declineReason: reason } : item))),
    trips,
    advanceTrip,
    completeTrip,
    incidents,
    reportIncident,
    clearIncident,
  };

  const newOrders = orders.filter((order) => order.status === "new").length;
  const tripIssues = trips.filter((trip) => trip.step < 3 && trip.issue).length;

  return (
    <div className="producer-home coordinator-area logistics-area" id="top" data-theme={theme}>
      <AreaSidebar
        home="/logistics"
        roleLabel="Logistics provider"
        fallbackName={profile.name}
        theme={theme}
        onToggleTheme={toggleTheme}
        pages={[
          { label: "Overview", to: "/logistics", end: true, icon: LayoutGrid },
          { label: "Transport orders", to: "/logistics/orders", icon: ClipboardList, count: newOrders },
          { label: "Trips", to: "/logistics/trips", icon: Truck, count: tripIssues },
          { label: "Fleet & capacity", to: "/logistics/fleet", icon: Warehouse },
          { label: "Account & team", to: "/logistics/account", icon: UserCog },
        ]}
      />
      <div className="co-content">
        <Outlet context={state} />
      </div>
    </div>
  );
}
