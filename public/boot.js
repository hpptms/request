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
//
// Only production hosts report to GA. The same build is also served from
// Cloudflare Pages' own request-7xk.pages.dev (and its preview/branch
// subdomains) and localhost; without this, those visits went to the
// production property too, and GA4 flagged request-7xk.pages.dev as a
// cross-domain measurement candidate. ga-disable-* is GA's official opt-out
// and also stops the event calls in src/ (they'd have no target anyway
// without the config below). Subdomains of request.tokyo share the
// request.tokyo cookie domain, so they need no cross-domain setup.
// The GA4 measurement ID comes from VITE_GA_MEASUREMENT_ID via this script
// tag's data-ga-id (see index.html) — public/ isn't processed by Vite.
var gaId = (document.currentScript && document.currentScript.dataset.gaId) || '';
if (!/^G-[A-Z0-9]+$/.test(gaId)) gaId = '';
var host = location.hostname;
var isProdHost = host === 'request.tokyo' || host.endsWith('.request.tokyo');
if (isProdHost && gaId) {
  gtag('config', gaId, { send_page_view: false });
} else {
  if (gaId) window['ga-disable-' + gaId] = true;
  // Keep non-production copies (e.g. *.pages.dev) out of search results.
  // Cloudflare Pages' _headers can't match on hostname, so this can't be an
  // X-Robots-Tag header without a Pages Function on every request; Google
  // honors a robots meta tag set by JS when it renders the page.
  var robots = document.querySelector('meta[name="robots"]');
  if (robots) robots.setAttribute('content', 'noindex,nofollow');
}
