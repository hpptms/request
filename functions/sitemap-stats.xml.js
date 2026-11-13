// Cloudflare Pages Function: serves the backend's sitemap of dated stats
// pages (backend/internal/api.handleStatsSitemap) from request.tokyo itself.
// Search Console only accepts sitemaps on the property's own host, so it
// can't be submitted at api.request.tokyo directly.
const SOURCE = "https://api.request.tokyo/api/sitemap-stats.xml";

export async function onRequestGet() {
  const res = await fetch(SOURCE, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!res.ok) {
    return new Response("sitemap unavailable", { status: 502 });
  }
  return new Response(res.body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
