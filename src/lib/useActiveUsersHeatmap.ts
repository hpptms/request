import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import {
  MOCK_ACTIVE_USERS_RAW,
  aggregateByPrefecture,
  mapGA4CitiesToPoints,
  type ActiveUsersByCity,
  type ActiveUsersByPrefecture,
} from "./activeUsersHeatmap";

const POLL_INTERVAL_MS = 60000;

type Result = {
  // City-precision points for the map's bubble markers.
  points: ActiveUsersByCity[] | null;
  // Prefecture-only totals for the table under the map — see
  // aggregateByPrefecture's own comment for why it's coarser than points.
  prefectures: ActiveUsersByPrefecture[] | null;
  isMock: boolean;
};

// Polls GET /api/heatmap. Both fields are null until the *first* request
// settles — deliberately not seeded with mock data, so the placeholder
// (Tokyo 420, Osaka 180, ...) never flashes on screen only to be replaced
// a moment later by the real, much smaller numbers once the real request
// resolves. MOCK_ACTIVE_USERS_RAW is used only as the actual fallback: the
// backend has nothing yet (no GA4 property configured, background
// refresher hasn't completed its first run) or the request itself failed.
// isMock tells callers which case they're looking at so they can caption
// the map accordingly.
export function useActiveUsersHeatmap(): Result {
  const [points, setPoints] = useState<ActiveUsersByCity[] | null>(null);
  const [prefectures, setPrefectures] = useState<ActiveUsersByPrefecture[] | null>(null);
  const [isMock, setIsMock] = useState(false);
  const hasSettledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const applyMock = () => {
      setPoints(mapGA4CitiesToPoints(MOCK_ACTIVE_USERS_RAW));
      setPrefectures(aggregateByPrefecture(MOCK_ACTIVE_USERS_RAW));
      setIsMock(true);
    };

    const poll = () => {
      api
        .getHeatmap()
        .then((cities) => {
          if (cancelled) return;
          hasSettledRef.current = true;
          const mappedPoints = mapGA4CitiesToPoints(cities);
          if (mappedPoints.length === 0) {
            applyMock();
            return;
          }
          setPoints(mappedPoints);
          setPrefectures(aggregateByPrefecture(cities));
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
            applyMock();
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

  return { points, prefectures, isMock };
}
