"use client";

import { useSyncExternalStore } from "react";

/**
 * A small settings store: one value, shared by every component that reads it, kept in this
 * browser's localStorage so it survives reloads. (Settings become organisation-wide once the
 * CRM has a backend; until then they're per browser.)
 */
export function createSettingsStore<T>(key: string, initial: T) {
  let value = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) value = JSON.parse(raw) as T;
    } catch {
      /* private mode or corrupt value — keep defaults */
    }
  };

  const store = {
    get(): T {
      load();
      return value;
    },
    set(next: T) {
      load();
      value = next;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage full or blocked — still applies for this session */
      }
      listeners.forEach((l) => l());
    },
    reset() {
      store.set(initial);
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    initial,
  };
  return store;
}

export function useSettingsStore<T>(store: ReturnType<typeof createSettingsStore<T>>) {
  return useSyncExternalStore(store.subscribe, store.get, () => store.initial);
}
