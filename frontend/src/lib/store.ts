// A tiny shared store: one value, read with a React hook, written from anywhere. Every area of the
// app (producer, buyer, coordinator) imports the same module, so they all see one copy of the data.
// The value is also kept in localStorage so the demo survives a reload; when the backend exposes the
// data, `set` becomes an API call and `use` a query, with the same shape.
import { useSyncExternalStore } from "react";

export type Store<T> = {
  get: () => T;
  set: (next: T | ((current: T) => T)) => void;
  use: () => T;
  /** Back to the seed data (and forget the saved copy). */
  reset: () => void;
};

export function createStore<T>(key: string | null, initial: () => T): Store<T> {
  const listeners = new Set<() => void>();

  const load = (): T => {
    if (!key) return initial();
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : initial();
    } catch {
      return initial();
    }
  };

  let value = load();

  const save = () => {
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage blocked or full: the data lives for this visit only.
    }
  };

  const emit = () => listeners.forEach((listener) => listener());

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  // Another tab of the same browser changed the data: pick it up so both tabs agree.
  if (key && typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key !== key) return;
      value = load();
      emit();
    });
  }

  return {
    get: () => value,
    set: (next) => {
      value = typeof next === "function" ? (next as (current: T) => T)(value) : next;
      save();
      emit();
    },
    use: () => useSyncExternalStore(subscribe, () => value),
    reset: () => {
      value = initial();
      if (key) {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
      }
      emit();
    },
  };
}
