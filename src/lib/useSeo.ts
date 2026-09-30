import { useEffect } from "react";

const SITE_ORIGIN = "https://request.tokyo";
const SITE_NAME = "動画リクエストキュー";
const BREADCRUMB_SCRIPT_ID = "seo-breadcrumb";

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// A BreadcrumbList (ホーム > this page) as JSON-LD, so search results can show
// the page's place in the site instead of a bare URL. It's a data block, not
// a script that runs, so the CSP's script-src doesn't affect it. Removed
// again on "/" (a one-item breadcrumb is meaningless) and on unmount.
function setBreadcrumb(pageName: string | null, url: string) {
  document.getElementById(BREADCRUMB_SCRIPT_ID)?.remove();
  if (pageName === null) return;
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.id = BREADCRUMB_SCRIPT_ID;
  el.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: pageName, item: url },
    ],
  });
  document.head.appendChild(el);
}

// This app is a client-rendered SPA with no server-side rendering, so
// index.html's <title>/description/canonical/og:* only ever describe one
// (the home page's) URL — every other route needs to overwrite them once it
// mounts, or a crawler indexing e.g. /stats would see the board page's
// metadata and Google would likely fold it into the home page as a
// duplicate. This hook is that per-route override; restoring the previous
// title on unmount keeps a page without its own useSeo call (ViewerPage,
// AdminPage) from being left with a stale title from whatever public page
// was visited last. `noindex` (e.g. the 404 page) likewise restores the
// previous robots value on unmount, so it can't leak onto the next route —
// and restoring rather than hardcoding "index,follow" keeps boot.js's
// noindex on non-production hosts intact.
export function useSeo(title: string, description: string, path: string, options: { noindex?: boolean } = {}) {
  const { noindex = false } = options;
  useEffect(() => {
    const prevTitle = document.title;
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const prevRobots = robots?.getAttribute("content") ?? null;
    const url = `${SITE_ORIGIN}${path}`;

    document.title = title;
    setMetaTag("name", "description", description);
    setCanonical(url);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", url);
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    if (noindex) setMetaTag("name", "robots", "noindex,follow");
    setBreadcrumb(path === "/" || noindex ? null : title.split(" | ")[0], url);

    return () => {
      document.title = prevTitle;
      if (noindex && prevRobots !== null) setMetaTag("name", "robots", prevRobots);
      setBreadcrumb(null, url);
    };
  }, [title, description, path, noindex]);
}
