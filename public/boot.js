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

// admax (Shinobi Tools) sticky-right ad: PC only — narrow/mobile viewports
// have no spare room beside the board's content for a 160px-wide sticky
// rail without it overlapping. Gated here (not just via CSS) so phones/
// tablets never even fetch the ad script. Loaded as a real script element
// (rather than the vendor snippet's document.write) since this file runs
// as an ordinary external script, not an inline one during initial parse.
if (window.matchMedia('(min-width: 1024px)').matches) {
  window.admaxaction = { tag_id: '23ae35e7e86013ef2c89b228df7e3ea3', type: 'a', width: 160, height: 600, action: 'sticky.right' };
  var admaxScript = document.createElement('script');
  admaxScript.src = 'https://adm.shinobi.jp/st/s.js';
  admaxScript.charset = 'utf-8';
  document.head.appendChild(admaxScript);
}
