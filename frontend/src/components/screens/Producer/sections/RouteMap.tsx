import { useEffect, useRef, useState, type ReactNode } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, LngLatLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// MapLibre derives its worker URL from its own module URL, which breaks once Vite pre-bundles it.
// The worker file is self-contained, so let Vite emit it and point MapLibre at it explicitly.
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { Delivery } from "../data/mockProducer";
import type { DeliveryStatus } from "../data/deliveries";
import { ROUTES } from "../data/routes";
import { splitRoute, supportsWebGL, type Coordinate } from "../data/mapGeometry";
import { ColdChainPanel } from "./LiveTemperature";
import { useLiveReadings } from "../data/liveTemperature";

maplibregl.setWorkerUrl(workerUrl);

// Free, key-less vector basemap (light "Positron" style) from OpenFreeMap; data © OpenStreetMap.
const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

// Brand green for normal shipments; red only when something needs attention.
const ROUTE_COLOR: Record<DeliveryStatus, string> = {
  in_transit: "#2f6340",
  delivered: "#2f6340",
  issue: "#bf3a2b",
};

const line = (coordinates: Coordinate[]) => ({
  type: "Feature" as const,
  properties: {},
  geometry: { type: "LineString" as const, coordinates },
});

function markerElement(className: string, text?: string) {
  const element = document.createElement("div");
  element.className = className;
  if (text) element.textContent = text;
  return element;
}

type Props = {
  delivery: Delivery;
  status: DeliveryStatus;
  /** Overlays (alert, shipment panel). As a function it gets the live "Cold chain" block to place in the panel. */
  children?: ReactNode | ((coldChain: ReactNode) => ReactNode);
};

export function RouteMap({ delivery, status, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  // Without WebGL the map cannot render at all; show the fallback note from the start.
  const [failed, setFailed] = useState(() => !supportsWebGL());
  const route = ROUTES[delivery.routeKey].coordinates;
  const moving = delivery.step < 3;
  const readings = useLiveReadings(delivery.id, delivery.temperatures, moving);

  // Build the map once per delivery.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || failed) return;

    const bounds = route.reduce(
      (all, coordinate) => all.extend(coordinate),
      new maplibregl.LngLatBounds(route[0], route[0]),
    );
    // Leave room on the right for the floating summary panel (340px + gaps) and the origin label.
    const padding = { top: 70, bottom: 60, left: 70, right: container.clientWidth > 900 ? 470 : 50 };

    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding },
      attributionControl: false,
      dragRotate: false,
    });
    mapRef.current = map;

    // Don't hijack page scrolling; zoom with the buttons or a pinch instead.
    map.scrollZoom.disable();
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    const { done, point } = splitRoute(route, delivery.progress);
    const delivered = delivery.step === 3;

    map.on("load", () => {
      map.addSource("route-full", { type: "geojson", data: line(route) });
      map.addSource("route-done", { type: "geojson", data: line(done) });
      map.addLayer({
        id: "route-rest",
        type: "line",
        source: "route-full",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#8f978d", "line-width": 3, "line-dasharray": [1, 2] },
      });
      map.addLayer({
        id: "route-done-casing",
        type: "line",
        source: "route-done",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ffffff", "line-width": 8 },
      });
      map.addLayer({
        id: "route-done",
        type: "line",
        source: "route-done",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": ROUTE_COLOR[status], "line-width": 5 },
      });
    });

    new maplibregl.Marker({ element: markerElement("ph-mk ph-mk--origin") }).setLngLat(route[0] as LngLatLike).addTo(map);
    new maplibregl.Marker({ element: markerElement("ph-mk ph-mk--dest") }).setLngLat(route.at(-1) as LngLatLike).addTo(map);
    new maplibregl.Marker({ element: markerElement("ph-mk-label", delivery.fromShort), anchor: "top", offset: [0, 10] })
      .setLngLat(route[0] as LngLatLike)
      .addTo(map);
    new maplibregl.Marker({ element: markerElement("ph-mk-label", delivery.toShort), anchor: "top", offset: [0, 10] })
      .setLngLat(route.at(-1) as LngLatLike)
      .addTo(map);
    if (!delivered) {
      new maplibregl.Marker({ element: markerElement("ph-mk ph-mk--now") }).setLngLat(point as LngLatLike).addTo(map);
      new maplibregl.Marker({ element: markerElement("ph-mk-vehicle", delivery.vehiclePlate), anchor: "bottom", offset: [0, -14] })
        .setLngLat(point as LngLatLike)
        .addTo(map);
    }

    map.on("error", (event: maplibregl.ErrorEvent) => {
      // A failed style or tile request leaves an empty canvas; say so instead.
      if (!map.isStyleLoaded()) setFailed(true);
      console.warn("Map error", event.error);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is rebuilt per delivery; status colour is updated by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery.id, delivery.step === 3]);

  // Recolour the travelled route when the status changes (for example after reporting a problem).
  useEffect(() => {
    const map = mapRef.current;
    if (map?.getLayer("route-done")) map.setPaintProperty("route-done", "line-color", ROUTE_COLOR[status]);
  }, [status]);

  // Keep the done-line in sync if progress ever changes while mounted.
  useEffect(() => {
    const source = mapRef.current?.getSource("route-done") as GeoJSONSource | undefined;
    source?.setData(line(splitRoute(route, delivery.progress).done));
  }, [route, delivery.progress]);

  return (
    <div className={`ph-map ph-map--${status}`} style={{ ["--ph-route-color" as string]: ROUTE_COLOR[status] }}>
      <div ref={containerRef} className="ph-map-canvas" />
      {failed && (
        <p className="ph-map-failed">
          The map could not load. Check your internet connection; the shipment details below are still up to date.
        </p>
      )}
      {typeof children === "function" ? children(<ColdChainPanel readings={readings} live={moving} />) : children}
    </div>
  );
}
