window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('js', new Date());

// send_page_view is disabled here because this is a client-side-routed SPA:
// the automatic pageview would only ever fire once, for the initial full
// page load. Route changes are tracked manually instead (see
// src/lib/usePageViewTracking.ts) so in-app navigation (e.g. the board -> /report
// link) is counted too.
gtag('config', 'G-8L7G9DTTF8', { send_page_view: false });
