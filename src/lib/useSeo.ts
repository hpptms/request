import { useEffect } from "react";

const SITE_ORIGIN = "https://request.tokyo";

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

// This app is a client-rendered SPA with no server-side rendering, so
// index.html's <title>/description/canonical/og:* only ever describe one
// (the home page's) URL — every other route needs to overwrite them once it
// mounts, or a crawler indexing e.g. /stats would see the board page's
// metadata and Google would likely fold it into the home page as a
// duplicate. This hook is that per-route override; restoring the previous
// title on unmount keeps a page without its own useSeo call (ViewerPage,
// AdminPage) from being left with a stale title from whatever public page
// was visited last.
export function useSeo(title: string, description: string, path: string) {
  useEffect(() => {
    const prevTitle = document.title;
    const url = `${SITE_ORIGIN}${path}`;

    document.title = title;
    setMetaTag("name", "description", description);
    setCanonical(url);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", url);

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, path]);
}
