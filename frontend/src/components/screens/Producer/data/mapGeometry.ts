// Helpers shared by the delivery route map and the coordinator hub map.

export type Coordinate = [number, number];

/** Splits the route at `progress` (0–1) of its length; returns the travelled part and the current point. */
export function splitRoute(coordinates: Coordinate[], progress: number) {
  // Equirectangular distances are accurate enough over ~150 km.
  const lengths = coordinates.slice(1).map(([lng, lat], index) => {
    const [prevLng, prevLat] = coordinates[index];
    const x = (lng - prevLng) * Math.cos(((lat + prevLat) / 2) * (Math.PI / 180));
    return Math.hypot(x, lat - prevLat);
  });
  let remaining = Math.min(1, Math.max(0, progress)) * lengths.reduce((sum, length) => sum + length, 0);
  const done: Coordinate[] = [coordinates[0]];
  for (let index = 0; index < lengths.length; index += 1) {
    const [x1, y1] = coordinates[index];
    const [x2, y2] = coordinates[index + 1];
    if (remaining <= lengths[index]) {
      const t = lengths[index] === 0 ? 0 : remaining / lengths[index];
      const point: Coordinate = [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
      return { done: [...done, point], point };
    }
    remaining -= lengths[index];
    done.push(coordinates[index + 1]);
  }
  return { done, point: coordinates.at(-1)! };
}

export function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
