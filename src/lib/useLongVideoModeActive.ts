import { useEffect, useState } from "react";
import { api } from "../api";
import { visibleInterval } from "./visibleInterval";

const POLL_INTERVAL_MS = 60_000;

// Whether today is a 長い動画もOKモード day (see AppConfig.longVideoModeActive),
// re-polled so the day rolling over is picked up without a reload.
export function useLongVideoModeActive(): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const poll = () =>
      api
        .getConfig()
        .then((config) => {
          if (!cancelled) setActive(config.longVideoModeActive ?? false);
        })
        .catch(() => {
          // Keep the last known state; the next poll retries.
        });
    poll();
    const stop = visibleInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      stop();
    };
  }, []);
  return active;
}
