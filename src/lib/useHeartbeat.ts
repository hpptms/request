import { useEffect } from "react";
import { trackEvent } from "./analytics";

// GA4 ends a session after ~30 minutes without any event. A tab left open
// for a long time (the OBS/streaming PC's viewer screen, a visitor who just
// leaves the board open in a background tab, ...) would otherwise drop out
// of "アクティブユーザー" once nothing else happens to trigger an event.
// Sending one small custom event per tick keeps GA seeing it as
// continuously active for as long as the tab stays open — background tabs
// included, since browsers already throttle setInterval there to roughly
// once a minute, which happens to match this interval anyway.
const HEARTBEAT_INTERVAL_MS = 60_000;

export function useHeartbeat(): void {
  useEffect(() => {
    const interval = window.setInterval(() => {
      trackEvent("heartbeat");
    }, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);
}
