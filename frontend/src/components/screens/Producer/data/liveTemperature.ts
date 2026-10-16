// Cold-chain readings for a shipment on the map. The demo has no sensor feed, so while a
// shipment is moving a new reading is simulated every few seconds, drifting from the last stored
// one; a real feed (websocket or polling) would replace useLiveReadings.
import { useEffect, useState } from "react";
import { TEMPERATURE_RANGE } from "./deliveries";

export type Reading = { time: string; celsius: number };

const TICK_MS = 5000;
const KEEP = 24;
const middle = () => (TEMPERATURE_RANGE.min + TEMPERATURE_RANGE.max) / 2;

export const isOut = (celsius: number) => celsius < TEMPERATURE_RANGE.min || celsius > TEMPERATURE_RANGE.max;
const clock = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Stored readings plus a simulated live one every few seconds while `live` is true. */
export function useLiveReadings(key: string, initial: Reading[], live: boolean) {
  const [state, setState] = useState({ key, readings: initial });
  // Another delivery (or new stored readings): start again from what is stored.
  const readings = state.key === key && state.readings.length >= initial.length ? state.readings : initial;

  useEffect(() => {
    if (!live || initial.length === 0) return;
    const timer = window.setInterval(() => {
      setState((current) => {
        const base = current.key === key && current.readings.length >= initial.length ? current.readings : initial;
        const last = base.at(-1)!.celsius;
        // Drift a little, pulled gently back towards the middle of the safe band.
        const next = last + (middle() - last) * 0.15 + (Math.random() - 0.5) * 0.5;
        return { key, readings: [...base, { time: clock(), celsius: Math.round(next * 10) / 10 }].slice(-Math.max(KEEP, initial.length + 1)) };
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [key, live, initial]);

  return readings;
}

