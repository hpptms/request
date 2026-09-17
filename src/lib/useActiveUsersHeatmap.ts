import { useEffect, useState } from "react";
import { api } from "../api";
import { MOCK_ACTIVE_USERS, mapGA4CitiesToPoints, type ActiveUsersByCity } from "./activeUsersHeatmap";

const POLL_INTERVAL_MS = 60000;

// Polls GET /api/heatmap and falls back to MOCK_ACTIVE_USERS whenever the
// backend has nothing yet — no GA4 property configured, the background
// refresher hasn't completed its first run, or the request itself failed
// (network blip, backend restart). isMock tells callers which case they're
// looking at so they can caption the map accordingly.
export function useActiveUsersHeatmap(): { data: ActiveUsersByCity[]; isMock: boolean } {
  const [data, setData] = useState<ActiveUsersByCity[]>(MOCK_ACTIVE_USERS);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      api
        .getHeatmap()
        .then((cities) => {
          if (cancelled) return;
          const points = mapGA4CitiesToPoints(cities);
          if (points.length === 0) {
            setData(MOCK_ACTIVE_USERS);
            setIsMock(true);
            return;
          }
          setData(points);
          setIsMock(false);
        })
        .catch(() => {
          // Keep whatever was last shown (real or mock) rather than
          // flashing back to placeholder data on a transient failure.
        });
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { data, isMock };
}
