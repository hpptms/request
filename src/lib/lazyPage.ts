import { lazy, type ComponentType } from "react";

// React.lazy for route pages that survives a deploy. Vite names each page
// chunk by content hash, and a deploy removes the old ones — so a tab opened
// before the deploy fails to import a page it hadn't loaded yet (e.g.
// navigating to /notice after notices.ts changed), which reached the
// ErrorBoundary's 「表示中にエラーが発生しました」 screen. Instead, reload once
// to pick up the new build. The sessionStorage timestamp keeps a genuinely
// broken chunk (or an offline tab) from reloading in a loop.
const RELOAD_KEY = "chunkReloadAt";
const RELOAD_COOLDOWN_MS = 60 * 1000;

function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage blocked: still reload; the cooldown just can't be enforced.
  }
  window.location.reload();
  return true;
}

// Vite also fires this when a chunk's preloaded dependency fails to load.
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (e) => {
    if (reloadOnce()) e.preventDefault();
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- same constraint as React.lazy
export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().catch((err: unknown) => {
      // Never settles while the page reloads, so nothing flashes meanwhile.
      if (reloadOnce()) return new Promise<{ default: T }>(() => {});
      throw err;
    }),
  );
}
