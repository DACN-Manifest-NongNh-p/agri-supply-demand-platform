import { useEffect, useRef, useState, type ReactNode } from "react";
import * as maplibregl from "maplibre-gl";
import type { LngLatLike, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { useNavigate, useSearchParams } from "react-router-dom";
import { spoilageRisk } from "@/components/freshness/shelfLife";
import { useNow } from "@/components/orders/useNow";
import { splitRoute, supportsWebGL } from "../../Producer/data/mapGeometry";
import { ROUTES, type RouteKey } from "../../Producer/data/routes";
import { deliveryStatus } from "../../Producer/data/deliveries";
import { formatDay, formatKg } from "../../Producer/data/format";
import { openOf } from "../../Buyer/data/demands";
import type { SupplyBatch } from "../../Buyer/data/mockBuyer";
import type { BoardRow } from "../data/market";
import type { MarketDelivery } from "../data/mockCoordinator";
import { PROVINCE_PINS, buyerCity, farmArea, provinceOf, type LabelSide } from "../data/places";

maplibregl.setWorkerUrl(workerUrl);

// Key-less satellite imagery (Esri World Imagery), toned down so the overlays stay readable.
const SATELLITE: StyleSpecification = {
  version: 8,
  sources: {
    imagery: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      maxzoom: 18,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "imagery", type: "raster", source: "imagery", paint: { "raster-saturation": -0.2, "raster-brightness-max": 0.82 } }],
};

function element(className: string, text?: string) {
  const node = document.createElement("div");
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** A pin's label: the place and one number. Everything else is in the popup, on demand. */
function label(title: string, short?: string) {
  const node = element("co-pin-label");
  node.append(element("co-pin-label-title", title));
  if (short) node.append(element("co-pin-label-detail", short));
  return node;
}

/** 14,400 kg → "14.4 t"; 800 kg → "800 kg". */
function compactKg(kg: number) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(kg >= 10_000 ? 0 : 1).replace(/\.0$/, "")} t` : `${kg} kg`;
}

/** One line of a pin's popup: a batch or a demand, opening its detail drawer. */
type PopupItem = { kind: "batch" | "demand"; id: string; title: string; meta: string; tone?: "low" | "watch" | "high" | "gap" };

type Group = {
  at: [number, number];
  side: LabelSide;
  title: string;
  detail: string;
  province?: string;
  /** One number on the label, e.g. "14.4 t" or "3 demands". */
  short?: string;
  /** "Dragon fruit 4 · Mango 4": what the pin holds, shown in its popup. */
  products?: string;
  items?: PopupItem[];
};

/** Rows in a popup; the rest are in the lists under the map. */
const POPUP_ROWS = 3;
/** Hover this long before a popup opens, so sweeping the mouse across the map opens nothing. */
const OPEN_DELAY_MS = 250;
const CLOSE_DELAY_MS = 200;

/** "Dragon fruit 2 · Mango 1" from a list of product names. */
function productCounts(products: string[]) {
  const counts = new Map<string, number>();
  for (const product of products) counts.set(product, (counts.get(product) ?? 0) + 1);
  return [...counts].map(([product, count]) => `${product} ${count}`).join(" · ");
}

function batchItem(batch: SupplyBatch, now: number): PopupItem {
  const open = openOf(batch);
  const risk = spoilageRisk({ ...batch, openKg: open }, now);
  return {
    kind: "batch",
    id: batch.code,
    title: `${batch.code} · ${batch.product}, grade ${batch.grade}`,
    meta: `${formatKg(open)} open · sell by ${formatDay(batch.sellByDay)} · ${batch.producer}`,
    tone: risk.level,
  };
}

/** The popup body, built as DOM so MapLibre can hold it; rows call back into React. */
function popupContent(group: Group, onItem: (item: PopupItem) => void, extra?: { label: string; onClick: () => void }) {
  const root = element("co-map-popup-body");
  root.append(element("co-map-popup-title", group.title), element("co-map-popup-sub", group.detail));
  if (group.products) root.append(element("co-map-popup-products", group.products));
  const items = group.items ?? [];
  if (items.length) {
    const list = document.createElement("ul");
    list.className = "co-map-popup-list";
    for (const item of items.slice(0, POPUP_ROWS)) {
      const row = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = item.tone ? `co-map-popup-item co-map-popup-item--${item.tone}` : "co-map-popup-item";
      button.append(element("co-map-popup-item-title", item.title), element("co-map-popup-item-meta", item.meta));
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        onItem(item);
      });
      row.append(button);
      list.append(row);
    }
    root.append(list);
    if (items.length > POPUP_ROWS) root.append(element("co-map-popup-more", `+ ${items.length - POPUP_ROWS} more in the lists below the map`));
  }
  if (extra) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "co-map-popup-action";
    button.textContent = extra.label;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      extra.onClick();
    });
    root.append(button);
  }
  return root;
}

type PopupContent = () => HTMLElement;

/**
 * One popup for the whole map. It opens when the pointer rests on a pin (not when it sweeps past),
 * closes shortly after the pointer leaves the pin and the popup, and closes when the map moves or on
 * Escape. A click (or a tap on a phone) keeps it open until the map is clicked.
 */
function popupController(map: maplibregl.Map) {
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, focusAfterOpen: false, offset: 16, maxWidth: "300px", className: "co-map-popup" });
  let openTimer = 0;
  let closeTimer = 0;
  let owner: HTMLElement[] | null = null;
  let pinned = false;

  const mark = (nodes: HTMLElement[] | null, on: boolean) => nodes?.forEach((node) => node.classList.toggle("is-active", on));
  const close = () => {
    window.clearTimeout(openTimer);
    window.clearTimeout(closeTimer);
    pinned = false;
    mark(owner, false);
    owner = null;
    popup.remove();
  };
  const open = (nodes: HTMLElement[], at: LngLatLike, content: PopupContent) => {
    window.clearTimeout(closeTimer);
    if (owner === nodes && popup.isOpen()) return;
    mark(owner, false);
    owner = nodes;
    mark(nodes, true);
    popup.setLngLat(at).setDOMContent(content()).addTo(map);
  };
  const closeSoon = () => {
    window.clearTimeout(openTimer);
    if (pinned) return;
    closeTimer = window.setTimeout(close, CLOSE_DELAY_MS);
  };

  popup.on("open", () => {
    const box = popup.getElement();
    box?.addEventListener("mouseenter", () => window.clearTimeout(closeTimer));
    box?.addEventListener("mouseleave", closeSoon);
  });
  map.on("movestart", close);
  map.on("click", close);
  const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
  window.addEventListener("keydown", onKey);
  map.on("remove", () => window.removeEventListener("keydown", onKey));

  /**
   * Gives a pin a popup. `nodes` is the pin, then its label: only the pin takes the pointer; the label
   * is hidden until the pin is hovered, and hides again while the popup (which repeats its name) is open.
   * `clickPins: false` leaves the pin's click to the caller.
   */
  const attach = (nodes: HTMLElement[], at: LngLatLike, content: PopupContent, clickPins = true) => {
    const [pin] = nodes;
    pin.classList.add("co-pin-hover");
    pin.addEventListener("mouseenter", () => {
      nodes.forEach((node) => node.classList.add("is-hover"));
      window.clearTimeout(openTimer);
      window.clearTimeout(closeTimer);
      if (pinned && owner !== nodes) return;
      openTimer = window.setTimeout(() => open(nodes, at, content), owner ? 0 : OPEN_DELAY_MS);
    });
    pin.addEventListener("mouseleave", () => {
      nodes.forEach((node) => node.classList.remove("is-hover"));
      closeSoon();
    });
    if (clickPins)
      pin.addEventListener("click", (event) => {
        event.stopPropagation();
        if (pinned && owner === nodes) return close();
        open(nodes, at, content);
        pinned = true;
      });
  };
  return { attach, close };
}

// A label on the pin's right is anchored by its left edge, and so on; offsets clear the pin and its rings.
const LABEL_PLACEMENT: Record<LabelSide, { anchor: maplibregl.PositionAnchor; offset: [number, number] }> = {
  right: { anchor: "left", offset: [26, 0] },
  left: { anchor: "right", offset: [-26, 0] },
  top: { anchor: "bottom", offset: [0, -26] },
  bottom: { anchor: "top", offset: [0, 26] },
};

function addPin(map: maplibregl.Map, className: string, group: Group, onClick?: () => void) {
  const pin = element(className);
  const tag = label(group.title, group.short);
  if (onClick) {
    for (const node of [pin, tag]) {
      node.classList.add("co-pin-action");
      node.setAttribute("role", "button");
      node.setAttribute("title", `Show ${group.title}`);
      node.addEventListener("click", onClick);
    }
  }
  new maplibregl.Marker({ element: pin }).setLngLat(group.at as LngLatLike).addTo(map);
  new maplibregl.Marker({ element: tag, ...LABEL_PLACEMENT[group.side] }).setLngLat(group.at as LngLatLike).addTo(map);
  return [pin, tag];
}

/** The map frames the focused province's farm areas, or every province and buyer city when nothing is in focus. */
function framing(farms: Group[], provinces: Group[], buyers: Group[], focus?: string) {
  const focused = farms.filter((farm) => farm.province === focus);
  const points = (focused.length > 0 ? focused : [...provinces, ...buyers]).map((group) => group.at);
  const bounds = points.reduce((all, point) => all.extend(point), new maplibregl.LngLatBounds(points[0], points[0]));
  return { bounds, maxZoom: focused.length > 0 ? 9.5 : 12 };
}

function padding(wide: boolean) {
  // The "things need you" list is closed by default, so the map uses its full width.
  return wide ? { top: 150, bottom: 140, left: 140, right: 180 } : { top: 110, bottom: 50, left: 70, right: 80 };
}

function farmGroups(market: SupplyBatch[], now: number): Group[] {
  const groups = new Map<string, { at: [number, number]; side: LabelSide; province: string; kg: number; producers: Set<string>; batches: SupplyBatch[] }>();
  for (const batch of market) {
    const open = openOf(batch);
    const area = farmArea(batch.region);
    if (open <= 0 || !area) continue;
    const group = groups.get(area.name) ?? { at: area.at, side: area.side, province: area.province, kg: 0, producers: new Set<string>(), batches: [] };
    group.kg += open;
    group.producers.add(batch.producer);
    group.batches.push(batch);
    groups.set(area.name, group);
  }
  return [...groups].map(([name, group]) => ({
    at: group.at,
    side: group.side,
    province: group.province,
    title: name,
    short: compactKg(group.kg),
    detail: `${formatKg(group.kg)} open · ${group.producers.size} ${group.producers.size === 1 ? "farm" : "farms"}`,
    products: productCounts(group.batches.map((batch) => batch.product)),
    items: [...group.batches].sort((a, b) => a.sellByDay - b.sellByDay).map((batch) => batchItem(batch, now)),
  }));
}

/** Farm areas rolled up per province, for the all-regions view. */
function provinceGroups(market: SupplyBatch[], now: number): Group[] {
  const groups = new Map<string, { kg: number; producers: Set<string>; batches: SupplyBatch[] }>();
  for (const batch of market) {
    const open = openOf(batch);
    const area = farmArea(batch.region);
    if (open <= 0 || !area || !PROVINCE_PINS[area.province]) continue;
    const group = groups.get(area.province) ?? { kg: 0, producers: new Set<string>(), batches: [] };
    group.kg += open;
    group.producers.add(batch.producer);
    group.batches.push(batch);
    groups.set(area.province, group);
  }
  return [...groups].map(([province, group]) => ({
    ...PROVINCE_PINS[province],
    province,
    title: province,
    short: compactKg(group.kg),
    detail: `${formatKg(group.kg)} open · ${group.producers.size} ${group.producers.size === 1 ? "farm" : "farms"}`,
    products: productCounts(group.batches.map((batch) => batch.product)),
    items: [...group.batches].sort((a, b) => a.sellByDay - b.sellByDay).map((batch) => batchItem(batch, now)),
  }));
}

function buyerGroups(board: BoardRow[]): Group[] {
  const groups = new Map<string, { at: [number, number]; side: LabelSide; kg: number; rows: BoardRow[] }>();
  for (const row of board) {
    const city = buyerCity(row.demand.destination);
    const group = groups.get(city.name) ?? { at: city.at, side: city.side, kg: 0, rows: [] };
    group.kg += row.fulfilment.openKg;
    group.rows.push(row);
    groups.set(city.name, group);
  }
  return [...groups].map(([name, group]) => {
    const gaps = group.rows.filter((row) => !row.best).length;
    return {
      at: group.at,
      side: group.side,
      title: name,
      short: `${group.rows.length} ${group.rows.length === 1 ? "demand" : "demands"}`,
      detail: `${group.rows.length} ${group.rows.length === 1 ? "demand" : "demands"} · ${formatKg(group.kg)} wanted${gaps ? ` · ${gaps} without supply` : ""}`,
      products: productCounts(group.rows.map((row) => row.demand.product)),
      items: [...group.rows]
        .sort((a, b) => a.demand.neededByDay - b.demand.neededByDay)
        .map((row) => ({
          kind: "demand" as const,
          id: row.demand.id,
          title: `${row.demand.id} · ${row.demand.buyer}`,
          meta: `${formatKg(row.fulfilment.openKg)} ${row.demand.product.toLowerCase()}, ${row.demand.gradeWanted} · by ${formatDay(row.demand.neededByDay)}${row.best ? ` · best ${row.best.batch.code}` : " · no supply"}`,
          tone: row.best ? undefined : ("gap" as const),
        })),
    };
  });
}

type Props = {
  market: SupplyBatch[];
  board: BoardRow[];
  deliveries: MarketDelivery[];
  /** A province to zoom to: its farm areas are shown district by district, the others dimmed. */
  focus?: string;
  /** Called when a province pin is clicked in the all-regions view. */
  onFocus?: (province: string) => void;
  children?: ReactNode;
};

/** The whole market at a glance: where supply sits, where demand is, and the trucks in between. */
export function HubMap({ market, board, deliveries, focus, onFocus, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const districtNodesRef = useRef<{ province?: string; nodes: HTMLElement[] }[]>([]);
  const provinceNodesRef = useRef<HTMLElement[]>([]);
  const truckNodesRef = useRef<{ province?: string; node: HTMLElement }[]>([]);
  const onFocusRef = useRef(onFocus);
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const [failed, setFailed] = useState(() => !supportsWebGL());
  // Risk changes slowly; rounding "now" to the hour keeps the marker signature stable between renders.
  const now = Math.floor(useNow(600_000) / 3_600_000) * 3_600_000;
  const farms = farmGroups(market, now);
  const provinces = provinceGroups(market, now);
  const buyers = buyerGroups(board);
  const active = deliveries.filter((delivery) => delivery.step < 3);
  // Rebuild the markers only when what they show changes.
  const signature = JSON.stringify([farms, provinces, buyers, active.map((delivery) => [delivery.id, delivery.progress])]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || failed) return;

    const { bounds, maxZoom } = framing(farms, provinces, buyers, focus);

    const map = new maplibregl.Map({
      container,
      style: SATELLITE,
      bounds,
      fitBoundsOptions: { padding: padding(container.clientWidth > 900), maxZoom },
      attributionControl: false,
      dragRotate: false,
    });
    map.scrollZoom.disable();
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    const routeKeys = [...new Set(active.map((delivery) => delivery.routeKey))] as RouteKey[];
    map.on("load", () => {
      for (const key of routeKeys) {
        map.addSource(`route-${key}`, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: ROUTES[key].coordinates } },
        });
        map.addLayer({
          id: `route-${key}`,
          type: "line",
          source: `route-${key}`,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#f4f7ec", "line-width": 2, "line-opacity": 0.75, "line-dasharray": [2, 2] },
        });
      }
    });

    // Rows in a popup open the same detail drawer as the lists below the map.
    const openItem = (item: PopupItem) =>
      setParams((current) => {
        const next = new URLSearchParams(current);
        next.set("detail", `${item.kind}:${item.id}`);
        return next;
      });
    const popups = popupController(map);
    const withPopup = (nodes: HTMLElement[], group: Group, extra?: { label: string; onClick: () => void }, clickPins = true) => {
      popups.attach(nodes, group.at as LngLatLike, () => popupContent(group, openItem, extra), clickPins);
      return nodes;
    };

    districtNodesRef.current = farms.map((farm) => ({ province: farm.province, nodes: withPopup(addPin(map, "co-pin co-pin--farm", farm), farm) }));
    provinceNodesRef.current = provinces.flatMap((group) =>
      // A click still zooms into the province; hovering shows its batches first.
      withPopup(
        addPin(map, "co-pin co-pin--farm", group, () => group.province && onFocusRef.current?.(group.province)),
        group,
        {
          label: `Zoom to ${group.title}`,
          onClick: () => {
            popups.close();
            if (group.province) onFocusRef.current?.(group.province);
          },
        },
        false,
      ),
    );
    for (const buyer of buyers) withPopup(addPin(map, "co-pin co-pin--buyer", buyer), buyer);
    truckNodesRef.current = [];
    for (const delivery of active) {
      const { point } = splitRoute(ROUTES[delivery.routeKey].coordinates, delivery.progress);
      const truck = element(deliveryStatus(delivery) === "issue" ? "co-truck co-truck--issue" : "co-truck");
      truck.setAttribute("role", "link");
      truck.setAttribute("aria-label", `Delivery ${delivery.id}`);
      new maplibregl.Marker({ element: truck }).setLngLat(point as LngLatLike).addTo(map);
      const truckGroup: Group = {
        at: point as [number, number],
        side: "right",
        title: `${delivery.id} · ${delivery.product}`,
        detail: `${formatKg(delivery.quantityKg)} from ${delivery.fromShort} to ${delivery.toShort} · ${delivery.carrier} · ETA ${delivery.eta}${delivery.issue ? ` · ${delivery.issue}` : ""}`,
      };
      withPopup([truck], truckGroup, { label: "Open delivery", onClick: () => navigate(`/coordinator/deliveries/${delivery.id}`) });
      const region = market.find((batch) => batch.code === delivery.batch)?.region ?? delivery.origin;
      truckNodesRef.current.push({ province: provinceOf(region), node: truck });
    }

    map.on("error", (event: maplibregl.ErrorEvent) => {
      if (!map.isStyleLoaded()) setFailed(true);
      console.warn("Map error", event.error);
    });

    mapRef.current = map;
    return () => {
      mapRef.current = null;
      map.remove();
    };
    // Markers are rebuilt from `signature`; the arrays themselves are new on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, failed]);

  useEffect(() => {
    onFocusRef.current = onFocus;
  });

  // Moving between provinces pans the existing map instead of rebuilding it.
  useEffect(() => {
    for (const node of provinceNodesRef.current) node.classList.toggle("co-hidden", Boolean(focus));
    // Trucks crowd the country view; they show once a province is chosen.
    for (const { province, node } of truckNodesRef.current) node.classList.toggle("co-hidden", province !== focus);
    for (const { province, nodes } of districtNodesRef.current) {
      for (const node of nodes) {
        node.classList.toggle("co-hidden", !focus);
        node.classList.toggle("co-dim", Boolean(focus) && province !== focus);
      }
    }
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;
    const { bounds, maxZoom } = framing(farms, provinces, buyers, focus);
    map.fitBounds(bounds, { padding: padding(container.clientWidth > 900), maxZoom, duration: 900 });
    // Re-frame only when the focus changes; marker changes rebuild the map above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, signature]);

  return (
    <div className="co-hub-map">
      <div ref={containerRef} className="co-hub-canvas" />
      {failed && <p className="ph-map-failed">The map could not load. The lists below are still up to date.</p>}
      {children}
    </div>
  );
}
