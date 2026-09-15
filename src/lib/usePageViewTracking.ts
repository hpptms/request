import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// GA's automatic page_view (see public/gtag-init.js) only fires once, on the
// initial full page load, so it never sees client-side route changes in this
// SPA. This sends a page_view manually on every route change (the initial
// one included, since send_page_view is disabled in gtag-init.js).
export function usePageViewTracking(): void {
  const location = useLocation();

  useEffect(() => {
    try {
      window.gtag?.("event", "page_view", {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    } catch {
      // Ignore.
    }
  }, [location]);
}
