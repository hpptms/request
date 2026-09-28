import { useEffect, useState } from "react";
import { api } from "../api";
import { visibleInterval } from "./visibleInterval";

// Re-polled so the day's new theme (drawn at 8:00 JST — see backend theme.DayStartHour) or an admin's
// redraw shows up without reloading a screen that stays open for hours.
const POLL_INTERVAL_MS = 60000;

// Today's 今日のテーマ text, or null while there isn't one (none approved
// yet, or not loaded). Shared by both players' overlays and the board's
// theme box.
export function useTodayTheme(): string | null {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = () =>
      api
        .getTodayTheme()
        .then(({ text }) => {
          if (!cancelled) setText(text || null);
        })
        .catch(() => {
          // Keep the last known theme; the next poll retries.
        });
    poll();
    const stop = visibleInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return text;
}
