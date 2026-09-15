// Thin wrapper around gtag (see public/gtag-init.js) for GA4 custom events
// tracking specific user actions (request/like/cancel-vote/...) beyond the
// automatic page_view. No-ops silently if gtag hasn't loaded (blocked by an
// ad blocker, script still loading, etc) so analytics can never break the app.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
  try {
    window.gtag?.("event", name, params);
  } catch {
    // Ignore.
  }
}
