import type { StatsPeriod, TimeSlot } from "../types";

// The stats page's selection (period, date, time-of-day slot) lives in the
// URL path so every day/week/slot ranking has its own crawlable, shareable
// address instead of all of them sharing /stats:
//
//   /stats                      today (day), every time of day
//   /stats/2026-11-13[/evening] that day[, that slot]
//   /stats/week[/2026-11-09][/evening]
//   /stats/all[/evening]
//
// date null means "let the server pick today/this week". Slot slugs are the
// backend's own TimeSlot values.

export type StatsSelection = { period: StatsPeriod; date: string | null; slot: TimeSlot };

const SLOTS: readonly TimeSlot[] = ["morning", "daytime", "evening", "midnight"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// parseStatsPath reads the part of the path after "/stats/" (React Router's
// splat). It returns null for anything that isn't one of the shapes above.
export function parseStatsPath(splat: string): StatsSelection | null {
  const parts = splat.split("/").filter(Boolean);
  let period: StatsPeriod = "day";
  if (parts[0] === "week" || parts[0] === "all") {
    period = parts.shift() as StatsPeriod;
  }
  let date: string | null = null;
  if (period !== "all" && parts.length > 0 && DATE_RE.test(parts[0])) {
    date = parts.shift()!;
    if (!isValidDate(date)) return null;
  }
  let slot: TimeSlot = "";
  if (parts.length > 0 && (SLOTS as readonly string[]).includes(parts[0])) {
    slot = parts.shift() as TimeSlot;
  }
  return parts.length === 0 ? { period, date, slot } : null;
}

export function buildStatsPath({ period, date, slot }: StatsSelection): string {
  const parts = ["/stats"];
  if (period !== "day") parts.push(period);
  if (period !== "all" && date) parts.push(date);
  if (slot) parts.push(slot);
  return parts.join("/");
}

// Today's date (YYYY-MM-DD) in JST, the backend's day boundary (see
// backend/internal/analytics), whatever the viewer's own timezone is.
export function todayJst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
