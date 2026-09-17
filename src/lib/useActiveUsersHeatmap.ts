import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { MOCK_ACTIVE_USERS, mapGA4CitiesToPoints, type ActiveUsersByCity } from "./activeUsersHeatmap";

const POLL_INTERVAL_MS = 60000;

// Polls GET /api/heatmap. data is null until the *first* request settles —
// deliberately not seeded with MOCK_ACTIVE_USERS, so the placeholder
// (Tokyo 420, Osaka 180, ...) never flashes on screen only to be replaced
// a moment later by the real, much smaller numbers once the real request
// resolves. MOCK_ACTIVE_USERS is used only as the actual fallback: the
// backend has nothing yet (no GA4 property configured, background
// refresher hasn't completed its first run) or the request itself failed.
// isMock tells callers which case they're looking at so they can caption
// the map accordingly.
export function useActiveUsersHeatmap(): { data: ActiveUsersByCity[] | null; isMock: boolean } {
  const [data, setData] = useState<ActiveUsersByCity[] | null>(null);
  const [isMock, setIsMock] = useState(false);
  const hasSettledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      api
        .getHeatmap()
        .then((cities) => {
          if (cancelled) return;
          hasSettledRef.current = true;
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
          if (cancelled) return;
          // Keep whatever was last shown (real or mock) rather than
          // flashing back to placeholder data on a transient failure —
          // but if this is the very first attempt, fall back to mock
          // rather than leaving the map stuck on its loading state.
          if (!hasSettledRef.current) {
            hasSettledRef.current = true;
            setData(MOCK_ACTIVE_USERS);
            setIsMock(true);
          }
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
