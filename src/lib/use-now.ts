"use client";

import { useSyncExternalStore } from "react";

// One shared ticking clock for live labels ("Open now", wait timers).
// The server snapshot is null so server and client markup always match.
let current = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (!timer) {
    current = Date.now();
    timer = setInterval(() => {
      current = Date.now();
      listeners.forEach((l) => l());
    }, 15000);
  }
  return () => {
    listeners.delete(onChange);
    if (!listeners.size) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const getSnapshot = () => current || (current = Date.now());
const getServerSnapshot = () => 0;

/** Current time in ms, refreshed every 15 seconds; null during server render. */
export function useNow(): number | null {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return now || null;
}
