import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import {
  MOCK_ACTIVE_USERS,
  type ActiveUsersPoint,
  type ActiveUsersByPrefecture,
  type ActiveUsersByCountry,
} from "./activeUsersHeatmap";

const POLL_INTERVAL_MS = 60000;

type Result = {
  // Bubble markers (coordinates only — no city names are sent).
  points: ActiveUsersPoint[] | null;
  // Prefecture-only totals for the table under the map.
  prefectures: ActiveUsersByPrefecture[] | null;
  // Overseas totals per country (Japan excluded).
  countries: ActiveUsersByCountry[];
  isMock: boolean;
};

// Polls GET /api/heatmap. Both fields are null until the *first* request
// settles — deliberately not seeded with mock data, so the placeholder
// (Tokyo 420, Osaka 180, ...) never flashes on screen only to be replaced
// a moment later by the real, much smaller numbers once the real request
// resolves. MOCK_ACTIVE_USERS is used only as the actual fallback: the
// backend has nothing yet (no GA4 property configured, background
// refresher hasn't completed its first run) or the request itself failed.
// isMock tells callers which case they're looking at so they can caption
// the map accordingly.
export function useActiveUsersHeatmap(): Result {
  const [points, setPoints] = useState<ActiveUsersPoint[] | null>(null);
  const [prefectures, setPrefectures] = useState<ActiveUsersByPrefecture[] | null>(null);
  const [countries, setCountries] = useState<ActiveUsersByCountry[]>([]);
  const [isMock, setIsMock] = useState(false);
  const hasSettledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const applyMock = () => {
      setPoints(MOCK_ACTIVE_USERS.points);
      setPrefectures(MOCK_ACTIVE_USERS.prefectures);
      setCountries(MOCK_ACTIVE_USERS.countries ?? []);
      setIsMock(true);
    };

    const poll = () => {
      api
        .getHeatmap()
        .then((report) => {
          if (cancelled) return;
          hasSettledRef.current = true;
          const overseas = report.countries ?? [];
          // Overseas-only traffic leaves points empty but is still real data.
          if (report.points.length === 0 && overseas.length === 0) {
            applyMock();
            return;
          }
          setPoints(report.points);
          setPrefectures(report.prefectures);
          setCountries(overseas);
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

  return { points, prefectures, countries, isMock };
}
