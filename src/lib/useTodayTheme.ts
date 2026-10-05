import { useEffect, useState } from "react";
import { api } from "../api";
import { visibleInterval } from "./visibleInterval";

// Re-polled so the day's new themes (drawn at 8:00 JST — see backend theme.DayStartHour) or an admin's
// redraw shows up without reloading a screen that stays open for hours.
const POLL_INTERVAL_MS = 60000;

// Today's 今日のテーマ texts (two of them — see backend theme.Slots), empty
// while there isn't one (none approved yet, or not loaded). Shared by both
// players' overlays and the board's theme box.
export function useTodayTheme(): string[] {
  return useTodayThemeState().texts;
}

// Same as useTodayTheme, plus whether the first fetch has finished (either
// way) — the board uses it to hold its layout until the theme box's final
// height is known.
export function useTodayThemeState(): { texts: string[]; loaded: boolean } {
  const [texts, setTexts] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const poll = () =>
      api
        .getTodayTheme()
        .then(({ texts }) => {
          if (cancelled) return;
          const next = texts ?? [];
          // Keep the same array while nothing changed, so polling doesn't
          // re-render every consumer once a minute.
          setTexts((prev) => (prev.join("\n") === next.join("\n") ? prev : next));
        })
        .catch(() => {
          // Keep the last known theme; the next poll retries.
        })
        .finally(() => {
          if (!cancelled) setLoaded(true);
        });
    poll();
    const stop = visibleInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return { texts, loaded };
}
