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
// without the config below). Subdomains like ads.request.tokyo share the
// request.tokyo cookie domain, so they need no cross-domain setup.
var host = location.hostname;
var isProdHost = host === 'request.tokyo' || host.endsWith('.request.tokyo');
if (isProdHost) {
  gtag('config', 'G-8L7G9DTTF8', { send_page_view: false });
} else {
  window['ga-disable-G-8L7G9DTTF8'] = true;
  // Keep non-production copies (e.g. *.pages.dev) out of search results.
  // Cloudflare Pages' _headers can't match on hostname, so this can't be an
  // X-Robots-Tag header without a Pages Function on every request; Google
  // honors a robots meta tag set by JS when it renders the page.
  var robots = document.querySelector('meta[name="robots"]');
  if (robots) robots.setAttribute('content', 'noindex,nofollow');
}

// The admax (Shinobi Tools) PC-only rail ad used to be loaded here via
// admax's own `sticky.right` JS action, running directly in this document.
// It's now rendered by src/components/PcRailAd.tsx instead, inside a
// sandboxed iframe pointed at /ad/banner.html — see that file for why.
