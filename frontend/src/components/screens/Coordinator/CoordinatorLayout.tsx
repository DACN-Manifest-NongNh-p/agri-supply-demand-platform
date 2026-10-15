import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CoordinatorSidebar } from "./sections/CoordinatorSidebar";
import { deliveryStatus } from "../Producer/data/deliveries";
import { allocations as initialAllocations, deliveries, demands, market as initialMarket, requests } from "./data/mockCoordinator";
import { addHold, autoMatch, matchBoard, needsDecision, pairKey, type Book, type MatchOptions } from "./data/market";
import { buildQueue } from "./data/queue";
import type { CoordinatorState, DeliveryUpdate, Resolution } from "./data/coordinatorContext";
// Same look as the producer and buyer areas: their styles first, then the coordinator's own.
import "../Producer/styles/ProducerHome.css";
import "../Buyer/styles/Buyer.css";
import "./styles/Coordinator.css";

const THEME_KEY = "coordinator-theme";

export type Theme = "light" | "dark";

// The theme is a per-browser convenience; storage can be unavailable, so it falls back to light.
function storedTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/** Shell for all coordinator pages: sidebar plus the demo state shared between them. */
export default function CoordinatorLayout() {
  const [theme, setTheme] = useState<Theme>(storedTheme);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [verified, setVerified] = useState<string[]>([]);
  // The matching engine has already run over the demo market: clean proposals start out as holds.
  const [book, setBook] = useState<Book>(() => autoMatch(demands, { market: initialMarket, allocations: initialAllocations }));
  const [notified, setNotified] = useState<Record<string, boolean>>({});
  const [resolved, setResolved] = useState<Record<string, Resolution>>({});
  const [deliveryUpdates, setDeliveryUpdates] = useState<Record<string, DeliveryUpdate[]>>({});
  const location = useLocation();
  const { market, allocations } = book;

  // Router navigation does not scroll on its own: jump to #section links, otherwise to the top.
  useEffect(() => {
    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  const options = (blockedPairs = blocked, verifiedProducers = verified): MatchOptions => ({
    blocked: new Set(blockedPairs),
    verified: new Set(verifiedProducers),
  });

  /** Applies a change, then lets the matching engine hold whatever became cleanly matchable. */
  const settle = (next: Book, matchOptions = options()) => setBook(autoMatch(demands, next, matchOptions));

  const approve: CoordinatorState["approve"] = (demandId, batchCode, kg) => {
    const batch = market.find((item) => item.code === batchCode);
    if (!batch || kg <= 0) return;
    settle(addHold(book, { demandId, batchCode, producer: batch.producer, kg, matchedBy: "coordinator" }));
  };

  const release: CoordinatorState["release"] = (allocationId) => {
    const allocation = allocations.find((item) => item.id === allocationId);
    if (!allocation || allocation.stage !== "held") return;
    // A released pair is not proposed again, so the demand moves on to its next batch.
    const nextBlocked = [...blocked, pairKey(allocation.demandId, allocation.batchCode)];
    setBlocked(nextBlocked);
    settle(
      {
        allocations: allocations.filter((item) => item.id !== allocationId),
        market: market.map((batch) => (batch.code === allocation.batchCode ? { ...batch, allocatedKg: Math.max(0, batch.allocatedKg - allocation.kg) } : batch)),
      },
      options(nextBlocked),
    );
  };

  const extendHold: CoordinatorState["extendHold"] = (allocationId, hours) =>
    setBook((current) => ({
      ...current,
      allocations: current.allocations.map((item) => (item.id === allocationId ? { ...item, holdHoursLeft: (item.holdHoursLeft ?? 0) + hours } : item)),
    }));

  const verifyProducer: CoordinatorState["verifyProducer"] = (producer) => {
    const nextVerified = [...verified, producer];
    setVerified(nextVerified);
    settle(book, options(blocked, nextVerified));
  };

  const recordShortfall: CoordinatorState["recordShortfall"] = (allocationId, kg) => {
    const allocation = allocations.find((item) => item.id === allocationId);
    if (!allocation) return;
    const cut = Math.min(kg, allocation.kg);
    // The batch is smaller than declared; the demand gets the missing kilograms back to match.
    settle({
      allocations: allocations.map((item) => (item.id === allocationId ? { ...item, kg: item.kg - cut } : item)),
      market: market.map((batch) =>
        batch.code === allocation.batchCode
          ? { ...batch, quantityKg: batch.quantityKg - cut, allocatedKg: Math.max(0, batch.allocatedKg - cut), issue: undefined }
          : batch,
      ),
    });
  };

  const board = matchBoard(demands, allocations, market, options());
  const queue = buildQueue({ rows: board, demands, allocations, requests, resolved, deliveries, deliveryUpdates });

  const state: CoordinatorState = {
    demands,
    market,
    allocations,
    board,
    approve,
    release,
    extendHold,
    verifiedProducers: verified,
    verifyProducer,
    recordShortfall,
    notified,
    notifyProducers: (demandId) => setNotified((current) => ({ ...current, [demandId]: true })),
    requests,
    resolved,
    resolve: (requestId, note) => setResolved((current) => ({ ...current, [requestId]: { note } })),
    queue,
    deliveryUpdates,
    postDeliveryUpdate: (deliveryId, text) =>
      setDeliveryUpdates((current) => ({
        ...current,
        [deliveryId]: [...(current[deliveryId] ?? []), { text, time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) }],
      })),
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Not remembered, but the switch still applies for this visit.
    }
  };

  return (
    <div className="producer-home coordinator-area" id="top" data-theme={theme}>
      <CoordinatorSidebar
        theme={theme}
        onToggleTheme={toggleTheme}
        counts={{
          matching: needsDecision(board).length,
          requests: requests.filter((request) => !resolved[request.id]).length,
          deliveries: deliveries.filter((delivery) => delivery.step < 3 && deliveryStatus(delivery) === "issue").length,
        }}
      />
      <div className="co-content">
        <Outlet context={state} />
      </div>
    </div>
  );
}
