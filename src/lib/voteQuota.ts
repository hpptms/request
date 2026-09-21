import { useSyncExternalStore } from "react";
import type { VoteQuota } from "../types";

// The caller's remaining hourly like/bad allowance, shared by every vote
// button/label on the page. Kept module-level (not in useRequestQueue's
// state) so the buttons, which take handlers as props, can show it without
// threading it through every component.
let current: VoteQuota | null = null;
const listeners = new Set<() => void>();

export function setVoteQuota(quota: VoteQuota): void {
  current = quota;
  listeners.forEach((l) => l());
}

export function useVoteQuota(): VoteQuota | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}
