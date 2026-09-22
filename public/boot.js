window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('js', new Date());

// send_page_view is disabled here because this is a client-side-routed SPA:
// the automatic pageview would only ever fire once, for the initial full
// page load. Route changes are tracked manually instead (see
// src/lib/usePageViewTracking.ts) so in-app navigation (e.g. the board -> /stats
// link) is counted too.
gtag('config', 'G-8L7G9DTTF8', { send_page_view: false });

// The admax (Shinobi Tools) PC-only rail ad used to be loaded here via
// admax's own `sticky.right` JS action, running directly in this document.
// It's now rendered by src/components/PcRailAd.tsx instead, inside a
// sandboxed iframe pointed at /ad/banner.html — see that file for why.
