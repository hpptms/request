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

// Free plan (memberships on): bad votes, スベってる and super likes aren't
// available, so their buttons are disabled instead of sending a request the
// server would only refuse. Read off the server's own quota for the caller
// (the free plan is the only one with a 0 bad allowance), so it agrees with
// the server's plan/admin decision; unknown (not loaded yet) allows.
export const FREE_PLAN_UNAVAILABLE = "無料プランでは使えません（サポーター プランなら使えます）";
export function useFreePlanRestricted(): boolean {
  const q = useVoteQuota();
  return q !== null && !q.unlimitedLikes && q.badLimit === 0;
}
// A super like costs two like points.
export function useCanSuperLike(): boolean {
  const q = useVoteQuota();
  return q === null || q.unlimitedLikes === true || q.likeLimit >= 2;
}

// True for an admin IP, whose likes and bad votes the server counts on
// every press with no quota — so those buttons never grey out as "already
// voted".
export function useUnlimitedLikes(): boolean {
  return useVoteQuota()?.unlimitedLikes === true;
}
