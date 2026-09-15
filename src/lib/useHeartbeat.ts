import { useEffect } from "react";
import { trackEvent } from "./analytics";

// GA4 ends a session after ~30 minutes without any event, so a visitor who
// just keeps the board open in the foreground without clicking anything
// would otherwise drop out of "アクティブユーザー". Sending one small
// custom event per tick keeps GA seeing it as continuously active for as
// long as the tab stays open and visible.
//
// Deliberately skipped while the tab is hidden (backgrounded/minimized) —
// "アクティブユーザー" is meant to track people actually looking at the
// page, not tabs merely left open, so a hidden tab is allowed to age out of
// GA's active-user window like it would on any other site.
const HEARTBEAT_INTERVAL_MS = 60_000;

export function useHeartbeat(): void {
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        trackEvent("heartbeat");
      }
    }, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);
}
