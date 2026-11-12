import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { PAGE_SEO, type PagePath } from './src/lib/pageSeo.ts'

const SITE_ORIGIN = 'https://request.tokyo'
const SITE_NAME = '動画リクエストキュー'

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Replaces exactly one match or fails the build, so an edit to index.html
// that renames/reorders a tag can't silently ship every route with the home
// page's metadata again.
function replaceOnce(html: string, pattern: RegExp, replacement: string, route: string) {
  const matches = html.match(new RegExp(pattern.source, 'g'))
  if (matches?.length !== 1) {
    throw new Error(`prerender-seo: ${pattern} matched ${matches?.length ?? 0} times in index.html (route ${route})`)
  }
  return html.replace(pattern, replacement)
}

// Pages listed in the static pre-React nav, in display order. Only public,
// indexable routes (all of them come from PAGE_SEO).
const STATIC_NAV: PagePath[] = ['/', '/play', '/guide', '/faq', '/stats', '/notice', '/themes', '/polls', '/about', '/terms', '/copyright', '/privacy', '/contact']

function pageName(path: PagePath) {
  return path === '/' ? SITE_NAME : PAGE_SEO[path].title.split(' | ')[0]
}

// Static HTML for a route, placed inside #root (see index.html). Crawlers and
// no-JS visitors get a real heading, description and internal links in the
// initial HTML; normal visitors never see it because index.html's
// #seo-static::after cover hides it until React's first render replaces it.
function seoStaticBlock(path: PagePath) {
  const nav = STATIC_NAV.map((p) => `<li><a href="${p}">${escapeHtml(pageName(p))}</a></li>`).join('')
  // Home gets the longer site introduction (formerly the <noscript> text)
  // on top of its meta description; other routes show their own description.
  const intro =
    path === '/'
      ? `<p>${escapeHtml(PAGE_SEO['/'].description)}</p><p>動画リクエストキューは、YouTube・ニコニコ動画・Vimeoの動画をリクエストして、知らない人とみんなで同時視聴できる登録不要の動画リクエストサイトです。FC2ライブ・ニコ生でも同時視聴配信を行っています。</p>`
      : `<p>${escapeHtml(PAGE_SEO[path].description)}</p>`
  return (
    `<div id="seo-static">` +
    `<header><a href="/">${SITE_NAME}</a></header>` +
    `<main><h1>${escapeHtml(pageName(path))}</h1>${intro}</main>` +
    `<nav aria-label="サイト内リンク"><ul>${nav}</ul></nav>` +
    `<noscript><p>ご利用にはJavaScriptを有効にしてください。</p></noscript>` +
    `</div>`
  )
}

// Expands index.html's <!--seo-static--> marker into the home page's static
// block, in dev and build alike; prerenderSeo then swaps in each route's own
// block for dist/<route>.html.
function seoStatic(): Plugin {
  return {
    name: 'seo-static',
    transformIndexHtml(html) {
      return replaceOnce(html, /<!--seo-static-->/, seoStaticBlock('/'), '/')
    },
  }
}

// The site is a client-rendered SPA, so Cloudflare Pages used to answer every
// route with the same dist/index.html — whose static <head> says title/
// canonical = the home page. Crawlers read that before (or without) running
// JS, so /guide, /faq, ... all looked like duplicates of "/" pointing their
// canonical at it, and only the home page ever showed up in search. This
// writes dist/guide.html etc. (Pages serves /guide from guide.html, ahead of
// the _redirects SPA fallback) with each route's own title/description/
// canonical/og:*/breadcrumb from src/lib/pageSeo.ts — the same values
// useSeo sets once React mounts, so nothing changes visibly at runtime.
function prerenderSeo(): Plugin {
  let outDir = 'dist'
  return {
    name: 'prerender-seo',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const template = readFileSync(resolve(outDir, 'index.html'), 'utf-8')
      for (const [path, { title, description }] of Object.entries(PAGE_SEO) as [PagePath, { title: string; description: string }][]) {
        if (path === '/') continue
        const url = `${SITE_ORIGIN}${path}`
        const t = escapeHtml(title)
        const d = escapeHtml(description)
        const breadcrumb = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: pageName(path), item: url },
          ],
        })

        let html = template
        html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${t}</title>`, path)
        html = replaceOnce(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${d}" />`, path)
        html = replaceOnce(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`, path)
        html = replaceOnce(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${t}" />`, path)
        html = replaceOnce(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${d}" />`, path)
        html = replaceOnce(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`, path)
        html = replaceOnce(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${t}" />`, path)
        html = replaceOnce(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${d}" />`, path)
        // Same id useSeo uses, so its runtime breadcrumb replaces this one
        // instead of duplicating it.
        html = replaceOnce(html, /<\/head>/, `  <script type="application/ld+json" id="seo-breadcrumb">${breadcrumb.replace(/</g, '\\u003c')}</script>\n  </head>`, path)
        html = replaceOnce(html, /<div id="seo-static">[\s\S]*?<\/nav><noscript>[\s\S]*?<\/noscript><\/div>/, seoStaticBlock(path), path)

        writeFileSync(resolve(outDir, `${path.slice(1)}.html`), html)
      }
    },
  }
}

// Proxy /api to the Go backend during `npm run dev` so the frontend can
// always call the relative path "/api/...", matching how the Docker/nginx
// setup serves both from the same origin in production.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.BACKEND_PORT || '8090'

  return {
    plugins: [react(), seoStatic(), prerenderSeo()],
    server: {
      proxy: {
        // changeOrigin off keeps the browser's Host (localhost:5173), which
        // the backend's CSRF guard compares Origin against.
        '/api': { target: `http://localhost:${backendPort}`, changeOrigin: false },
      },
    },
  }
})
