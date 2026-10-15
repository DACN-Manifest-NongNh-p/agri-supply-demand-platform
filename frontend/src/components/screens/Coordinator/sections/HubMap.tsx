import { useEffect, useRef, useState, type ReactNode } from "react";
import * as maplibregl from "maplibre-gl";
import type { LngLatLike, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { useNavigate } from "react-router-dom";
import { splitRoute, supportsWebGL } from "../../Producer/data/mapGeometry";
import { ROUTES, type RouteKey } from "../../Producer/data/routes";
import { deliveryStatus } from "../../Producer/data/deliveries";
import { formatKg } from "../../Producer/data/format";
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

function label(title: string, detail: string) {
  const node = element("co-pin-label");
  node.append(element("co-pin-label-title", title), element("co-pin-label-detail", detail));
  return node;
}

type Group = { at: [number, number]; side: LabelSide; title: string; detail: string; province?: string };

// A label on the pin's right is anchored by its left edge, and so on; offsets clear the pin and its rings.
const LABEL_PLACEMENT: Record<LabelSide, { anchor: maplibregl.PositionAnchor; offset: [number, number] }> = {
  right: { anchor: "left", offset: [26, 0] },
  left: { anchor: "right", offset: [-26, 0] },
  top: { anchor: "bottom", offset: [0, -26] },
  bottom: { anchor: "top", offset: [0, 26] },
};

/** Adds a pin and its label; returns both elements so they can be hidden or dimmed as the focus changes. */
function addPin(map: maplibregl.Map, className: string, group: Group, onClick?: () => void) {
  const pin = element(className);
  const tag = label(group.title, group.detail);
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
  return wide ? { top: 190, bottom: 90, left: 110, right: 560 } : { top: 110, bottom: 50, left: 70, right: 80 };
}

function farmGroups(market: SupplyBatch[]): Group[] {
  const groups = new Map<string, { at: [number, number]; side: LabelSide; province: string; kg: number; producers: Set<string> }>();
  for (const batch of market) {
    const open = openOf(batch);
    const area = farmArea(batch.region);
    if (open <= 0 || !area) continue;
    const group = groups.get(area.name) ?? { at: area.at, side: area.side, province: area.province, kg: 0, producers: new Set<string>() };
    group.kg += open;
    group.producers.add(batch.producer);
    groups.set(area.name, group);
  }
  return [...groups].map(([name, group]) => ({
    at: group.at,
    side: group.side,
    province: group.province,
    title: name,
    detail: `${formatKg(group.kg)} open · ${group.producers.size} ${group.producers.size === 1 ? "farm" : "farms"}`,
  }));
}

/** Farm areas rolled up per province, for the all-regions view. */
function provinceGroups(market: SupplyBatch[]): Group[] {
  const groups = new Map<string, { kg: number; producers: Set<string> }>();
  for (const batch of market) {
    const open = openOf(batch);
    const area = farmArea(batch.region);
    if (open <= 0 || !area || !PROVINCE_PINS[area.province]) continue;
    const group = groups.get(area.province) ?? { kg: 0, producers: new Set<string>() };
    group.kg += open;
    group.producers.add(batch.producer);
    groups.set(area.province, group);
  }
  return [...groups].map(([province, group]) => ({
    ...PROVINCE_PINS[province],
    province,
    title: province,
    detail: `${formatKg(group.kg)} open · ${group.producers.size} ${group.producers.size === 1 ? "farm" : "farms"}`,
  }));
}

function buyerGroups(board: BoardRow[]): Group[] {
  const groups = new Map<string, { at: [number, number]; side: LabelSide; kg: number; demands: number }>();
  for (const row of board) {
    const city = buyerCity(row.demand.destination);
    const group = groups.get(city.name) ?? { at: city.at, side: city.side, kg: 0, demands: 0 };
    group.kg += row.fulfilment.openKg;
    group.demands += 1;
    groups.set(city.name, group);
  }
  return [...groups].map(([name, group]) => ({
    at: group.at,
    side: group.side,
    title: name,
    detail: `${group.demands} ${group.demands === 1 ? "demand" : "demands"} · ${formatKg(group.kg)} wanted`,
  }));
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
  const [failed, setFailed] = useState(() => !supportsWebGL());
  const farms = farmGroups(market);
  const provinces = provinceGroups(market);
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

    districtNodesRef.current = farms.map((farm) => ({ province: farm.province, nodes: addPin(map, "co-pin co-pin--farm", farm) }));
    provinceNodesRef.current = provinces.flatMap((group) =>
      addPin(map, "co-pin co-pin--farm", group, () => group.province && onFocusRef.current?.(group.province)),
    );
    for (const buyer of buyers) addPin(map, "co-pin co-pin--buyer", buyer);
    truckNodesRef.current = [];
    for (const delivery of active) {
      const { point } = splitRoute(ROUTES[delivery.routeKey].coordinates, delivery.progress);
      const truck = element(deliveryStatus(delivery) === "issue" ? "co-truck co-truck--issue" : "co-truck");
      truck.setAttribute("role", "link");
      truck.setAttribute("aria-label", `Delivery ${delivery.id}`);
      truck.setAttribute("title", `${delivery.id} · ${delivery.product} to ${delivery.toShort}`);
      truck.addEventListener("click", () => navigate(`/coordinator/deliveries/${delivery.id}`));
      new maplibregl.Marker({ element: truck }).setLngLat(point as LngLatLike).addTo(map);
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
