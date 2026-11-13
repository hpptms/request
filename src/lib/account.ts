import { useEffect, useSyncExternalStore } from "react";
import { api } from "../api";
import type { AccountMe } from "../types";

// Shared visitor-account state (login + サポーター プラン), read by the
// account page, the request form, and App's ad layout (supporters see no
// ads). One fetch is shared by every component that uses it.
//
// status:
// - "loading": not known yet (ads wait, so a supporter never sees them flash)
// - "disabled": the backend has memberships switched off (or is
//   unreachable) — no login/plan UI anywhere, ads show as before
// - "ready": `me` holds the caller's account (me.user null = logged out)
export type AccountState =
  | { status: "loading" }
  | { status: "disabled" }
  | { status: "ready"; me: AccountMe };

let state: AccountState = { status: "loading" };
// Likes a request needs to be played ahead of others (AppConfig.
// likePriorityThreshold) — a サポーター プラン request gets that priority from
// the start. Kept here since refreshAccount already reads the config.
let likePriorityThreshold = 5;
export const getLikePriorityThreshold = () => likePriorityThreshold;
let started = false;
const listeners = new Set<() => void>();

function set(next: AccountState) {
  state = next;
  listeners.forEach((l) => l());
}

// Sticky until dismissed: the server reports loggedOutElsewhere only once.
let loggedOutElsewhere = false;

export function setAccountMe(me: AccountMe) {
  if (me.loggedOutElsewhere) loggedOutElsewhere = true;
  set({ status: "ready", me });
}

export function useLoggedOutElsewhere(): boolean {
  return useSyncExternalStore(subscribe, () => loggedOutElsewhere);
}

export function dismissLoggedOutElsewhere() {
  loggedOutElsewhere = false;
  listeners.forEach((l) => l());
}

// While logged in, re-check every few minutes and whenever the tab comes
// back into view, so a browser pushed out by a newer login (one browser per
// account) finds out — and loses the supporter's ad-free view — promptly.
const RECHECK_MS = 2 * 60 * 1000;
function startRechecking() {
  const recheck = () => {
    if (document.visibilityState === "visible" && state.status === "ready" && state.me.user) void refreshAccount();
  };
  window.setInterval(recheck, RECHECK_MS);
  document.addEventListener("visibilitychange", recheck);
}

// Re-fetches the account (after login/logout, or a request that changed
// the free-plan wait).
export async function refreshAccount(): Promise<void> {
  try {
    const config = await api.getConfig();
    likePriorityThreshold = config.likePriorityThreshold;
    if (!config.membershipEnabled) {
      set({ status: "disabled" });
      return;
    }
    setAccountMe(await api.accountMe());
  } catch {
    // Fail open: behave as before memberships existed.
    if (state.status === "loading") set({ status: "disabled" });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAccount(): AccountState {
  const current = useSyncExternalStore(subscribe, () => state);
  useEffect(() => {
    if (!started) {
      started = true;
      void refreshAccount();
      startRechecking();
    }
  }, []);
  return current;
}

export function isSupporter(s: AccountState): boolean {
  return s.status === "ready" && s.me.user?.plan === "supporter";
}
