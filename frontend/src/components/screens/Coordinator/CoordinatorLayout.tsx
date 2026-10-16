import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CoordinatorSidebar } from "./sections/CoordinatorSidebar";
import { DetailDrawer } from "./sections/DetailDrawer";
import { deliveryStatus } from "../Producer/data/deliveries";
import { allocations as initialAllocations, deliveries, demands, market as initialMarket, requests } from "./data/mockCoordinator";
import { UNAVAILABLE, addHold, autoMatch, matchBoard, needsDecision, pairKey, type Book, type MatchOptions } from "./data/market";
import { openOf } from "../Buyer/data/demands";
import { getSite } from "@/lib/site";
import { RiskToasts } from "@/components/freshness/RiskToasts";
import { useSpoilageAlerts, type SpoilageItem } from "@/components/freshness/useSpoilageAlerts";
import { useNow } from "@/components/orders/useNow";
import { formatVnd } from "../Producer/data/format";
import { PARTNERS, partnerPrice, rescueProposals, type RescueDecision } from "./data/rescue";
import { buildQueue } from "./data/queue";
import type { CoordinatorState, DeliveryUpdate, Resolution } from "./data/coordinatorContext";
// Same look as the producer and buyer areas: their styles first, then the coordinator's own.
import "../Producer/styles/ProducerHome.css";
import "../Buyer/styles/Buyer.css";
import "./styles/Coordinator.css";
import { useStoredTheme } from "./data/theme";

/** When a decision was made (called from event handlers only). */
const stamp = () => Date.now();
let transportSeq = 4820;
/** A transport request id for the carrier, e.g. TO-4821. */
const nextTransportId = () => `TO-${(transportSeq += 1)}`;

/** Shell for all coordinator pages: sidebar plus the demo state shared between them. */
export default function CoordinatorLayout() {
  const { theme, toggleTheme } = useStoredTheme("coordinator-theme");
  const [blocked, setBlocked] = useState<string[]>([]);
  const [verified, setVerified] = useState<string[]>([]);
  // The matching engine has already run over the demo market: clean proposals start out as holds.
  const [book, setBook] = useState<Book>(() => autoMatch(demands, { market: initialMarket, allocations: initialAllocations }));
  const [notified, setNotified] = useState<Record<string, boolean>>({});
  const [resolved, setResolved] = useState<Record<string, Resolution>>({});
  const [deliveryUpdates, setDeliveryUpdates] = useState<Record<string, DeliveryUpdate[]>>({});
  const location = useLocation();
  const { market, allocations } = book;
  const [hiddenToasts, setHiddenToasts] = useState<Record<string, boolean>>({});

  // Unsold batches still on the market, watched for spoilage risk; alerts pop up without a reload.
  const watched: SpoilageItem[] = market
    .filter((batch) => !UNAVAILABLE.includes(batch.status) && openOf(batch) > 0)
    .map((batch) => ({
      code: batch.code,
      product: batch.product,
      producer: batch.producer,
      harvestDay: batch.harvestDay,
      sellByDay: batch.sellByDay,
      quantityKg: batch.quantityKg,
      openKg: openOf(batch),
      to: `/coordinator/rescue#proposal-rescue-${batch.code}`,
    }));
  const coldChain = new Set(getSite().products.filter((product) => product.coldChain).map((product) => product.name));
  // Demo sensor event target: the unsold cold-chain batch closest to its sell-by date (a day or more left).
  const excursionCode = watched
    .filter((item) => coldChain.has(item.product) && item.sellByDay >= 1)
    .sort((a, b) => a.sellByDay - b.sellByDay)[0]?.code;
  const spoilage = useSpoilageAlerts(watched, excursionCode);
  const [rescueDecisions, setRescueDecisions] = useState<Record<string, RescueDecision>>({});
  const now = useNow(30_000);

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

  // Proposals are rebuilt from the data; decided ones leave the list but keep their record.
  const proposals = rescueProposals(board, market, spoilage.excursions, now).filter((proposal) => !rescueDecisions[proposal.id]);

  const approveRescue: CoordinatorState["approveRescue"] = (proposal, edit) => {
    const parts = edit.parts.filter((part) => part.kg > 0);
    const total = parts.reduce((sum, part) => sum + part.kg, 0);
    if (total <= 0) return;
    const decided = { kind: proposal.kind, title: proposal.title, at: stamp(), status: "approved" as const };

    if (proposal.kind === "combine" && proposal.demandId) {
      // One hold per farm; each producer confirms its part as usual.
      const next = parts.reduce((current, part) => {
        const batch = current.market.find((item) => item.code === part.batchCode);
        return batch
          ? addHold(current, { demandId: proposal.demandId!, batchCode: part.batchCode, producer: batch.producer, kg: Math.min(part.kg, openOf(batch)), matchedBy: "coordinator" })
          : current;
      }, book);
      settle(next);
      setRescueDecisions((current) => ({
        ...current,
        [proposal.id]: { ...decided, summary: `Held ${total.toLocaleString("en-GB")} kg from ${parts.length} batches for ${proposal.demandId}; each farm confirms its part.` },
      }));
      return;
    }

    const partner = PARTNERS.find((item) => item.id === (edit.partnerId ?? proposal.partnerId));
    const part = parts[0];
    if (!partner || !part) return;
    const batch = market.find((item) => item.code === part.batchCode);
    if (!batch) return;
    const kg = Math.min(part.kg, openOf(batch));
    settle({ ...book, market: market.map((item) => (item.code === batch.code ? { ...item, allocatedKg: item.allocatedKg + kg } : item)) });
    const transportId = nextTransportId();
    const carrier = coldChain.has(batch.product) ? "Delta Cold Chain (refrigerated)" : "SouthLine Logistics";
    setRescueDecisions((current) => ({
      ...current,
      [proposal.id]: {
        ...decided,
        summary: `${kg.toLocaleString("en-GB")} kg ${batch.code} sold to ${partner.name} at ${formatVnd(partnerPrice(partner, batch.product))}/kg. Transport request ${transportId} sent to ${carrier}, pickup ${partner.pickupDays <= 1 ? "tomorrow" : `within ${partner.pickupDays} days`}.`,
        transportId,
      },
    }));
  };

  const rejectRescue: CoordinatorState["rejectRescue"] = (proposal, reason) =>
    setRescueDecisions((current) => ({ ...current, [proposal.id]: { kind: proposal.kind, title: proposal.title, at: stamp(), status: "rejected", reason } }));

  const state: CoordinatorState = {
    proposals,
    rescueDecisions,
    approveRescue,
    rejectRescue,
    excursions: spoilage.excursions,
    spoilageItems: watched,
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

  return (
    <div className="producer-home coordinator-area" id="top" data-theme={theme}>
      <CoordinatorSidebar
        theme={theme}
        onToggleTheme={toggleTheme}
        // The Needs action list, also under the bell so it is reachable from every page.
        notifications={[
          ...spoilage.alerts.map((alert) => ({
            id: alert.id,
            tone: "urgent" as const,
            title: alert.title,
            detail: alert.detail,
            link: { label: "See rescue options", to: alert.to },
          })),
          ...queue.map((item) => ({
            id: item.id,
            tone: item.tone,
            title: `${item.label}: ${item.title}`,
            detail: item.caption,
            link: item.link,
          })),
        ]}
        counts={{
          matching: needsDecision(board).length,
          requests: requests.filter((request) => !resolved[request.id]).length,
          deliveries: deliveries.filter((delivery) => delivery.step < 3 && deliveryStatus(delivery) === "issue").length,
          rescue: proposals.length,
        }}
      />
      <div className="co-content">
        <Outlet context={state} />
        <DetailDrawer demands={demands} market={market} allocations={allocations} board={board} excursions={spoilage.excursions} />
      </div>
      <RiskToasts
        actionLabel="See rescue options"
        alerts={spoilage.alerts.filter((alert) => !hiddenToasts[alert.id])}
        onDismiss={(id) => setHiddenToasts((current) => ({ ...current, [id]: true }))}
      />
    </div>
  );
}
