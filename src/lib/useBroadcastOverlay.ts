import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { BroadcastState } from "../types";
import { playChime } from "./playChime";
import { visibleInterval } from "./visibleInterval";

const POLL_INTERVAL_MS = 4000;
const OVERLAY_DURATION_MS = 10000;

// Polls GET /api/broadcast (see AdminBroadcastPage / backend/internal/
// broadcast) and surfaces a newly triggered 意思表示 (text message or
// image) as a 10-second overlay + chime on the viewer/play screens.
// Returns the state to show right now, or null when nothing should be
// showing.
export function useBroadcastOverlay(): BroadcastState {
  const [visible, setVisible] = useState<BroadcastState>(null);
  const lastSeenRef = useRef<string | null>(null);
  // The very first poll only seeds lastSeenRef — otherwise a broadcast
  // triggered before this page loaded (possibly minutes ago) would replay
  // as if new the moment someone opens the screen. Same idiom as
  // ViewerPage's knownRequestIdsRef for the new-request toast.
  const seededRef = useRef(false);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const poll = () => {
      api
        .getBroadcast()
        .then((state) => {
          if (!seededRef.current) {
            seededRef.current = true;
            lastSeenRef.current = state?.triggeredAt ?? null;
            return;
          }
          if (!state || state.triggeredAt === lastSeenRef.current) return;

          lastSeenRef.current = state.triggeredAt;
          setVisible(state);
          playChime();
          if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
          hideTimerRef.current = window.setTimeout(() => setVisible(null), OVERLAY_DURATION_MS);
        })
        .catch(() => {
          // Keep showing whatever's currently visible; the next poll will retry.
        });
    };

    poll();
    const stop = visibleInterval(poll, POLL_INTERVAL_MS);
    return () => {
      stop();
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  return visible;
}
