import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// i-mobile ad banners. Their tag (spot.js) pulls scripts from many
// ad-network hosts, which the SPA's strict CSP blocks, so each tag lives in
// its own page under public/ad/ (served with a relaxed CSP — see
// public/_headers /ad/*) and is framed here from the separate origin
// https://ads.request.tokyo (an extra custom domain on the same Cloudflare
// Pages project), so ad scripts are isolated from the main site. The frame
// is also sandboxed: allow-same-origin only grants the ads.request.tokyo
// origin (i-mobile's script needs its storage), and leaving out
// allow-top-navigation keeps an ad from redirecting the main page. The frames stay mounted across
// route changes; the banners rotate by themselves.
const AD_ORIGIN = import.meta.env.DEV ? "" : "https://ads.request.tokyo";

interface Banner {
  src: string;
  width: number;
  height: number;
}

// Phones: smartphone banner (320x50) in a fixed bottom bar.
const MOBILE_BANNER: Banner = { src: `${AD_ORIGIN}/ad/sp-banner`, width: 320, height: 50 };
export const MOBILE_AD_BAR_HEIGHT = MOBILE_BANNER.height + 8;

function BannerFrame({ banner }: { banner: Banner }) {
  return (
    <Box
      component="iframe"
      src={banner.src}
      title="広告"
      width={banner.width}
      height={banner.height}
      scrolling="no"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      sx={{ display: "block", border: 0, overflow: "hidden", flexShrink: 0 }}
    />
  );
}

function AdLabel() {
  return (
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, lineHeight: 1 }}>
      広告
    </Typography>
  );
}

// PC: half-page banner (300x600) in a sidebar on the right.
const PC_BANNER: Banner = { src: `${AD_ORIGIN}/ad/pc-sidebar`, width: 300, height: 600 };

// The pages lay themselves out (full-width header, centered content column),
// so the ads are overlaid with position: fixed instead of squeezing the page
// into a flex row. The sidebar only shows when the viewport leaves room for
// it beside the content column; narrower screens get the bottom bar instead.
const SIDEBAR_WIDTH = PC_BANNER.width;
const SIDEBAR_MARGIN = 16;
// Content column widths: TEXT_CONTAINER_SX caps most pages at 720px; the
// stats/heatmap pages use MUI's "md" container (900px).
const WIDE_PAGES = new Set(["/stats", "/heatmap"]);
function mediaQueries(pathname: string) {
  // /stats/2026-11-13 etc. are the same stats page (see lib/statsPath).
  const content = WIDE_PAGES.has(pathname) || pathname.startsWith("/stats/") ? 900 : 720;
  const minWidth = content + 2 * (SIDEBAR_WIDTH + SIDEBAR_MARGIN * 2);
  return {
    sidebar: `@media (min-width: ${minWidth}px)`,
    bar: `@media (max-width: ${minWidth - 0.02}px)`,
  };
}

// Fixed to the right edge, below the page header.
function AdSidebar({ media }: { media: string }) {
  return (
    <Box
      component="aside"
      aria-label="広告"
      sx={{
        display: "none",
        [media]: { display: "flex" },
        position: "fixed",
        top: 80,
        right: SIDEBAR_MARGIN,
        width: SIDEBAR_WIDTH,
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <AdLabel />
      <BannerFrame banner={PC_BANNER} />
    </Box>
  );
}

// Fixed bar at the bottom of the screen when there's no room for the sidebar.
function MobileAdBar({ media }: { media: string }) {
  return (
    <Box
      component="aside"
      aria-label="広告"
      sx={{
        display: "none",
        [media]: { display: "flex" },
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.appBar,
        justifyContent: "center",
        pt: 0.5,
        pb: "calc(4px + env(safe-area-inset-bottom))",
        bgcolor: "background.default",
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Box sx={{ position: "absolute", top: 2, left: 4 }}>
        <AdLabel />
      </Box>
      <BannerFrame banner={MOBILE_BANNER} />
    </Box>
  );
}

// Adds the ad sidebar (wide screens) / fixed bottom bar (others) on top of a
// page without touching the page's own layout.
export function AffiliateAdLayout({ pathname, children }: { pathname: string; children: ReactNode }) {
  const media = mediaQueries(pathname);
  return (
    <>
      {children}
      {/* Keeps the page's last content (footer) from ending up under the fixed bar. */}
      <Box sx={{ display: "none", [media.bar]: { display: "block" }, height: `calc(${MOBILE_AD_BAR_HEIGHT}px + env(safe-area-inset-bottom))` }} />
      <AdSidebar media={media.sidebar} />
      <MobileAdBar media={media.bar} />
    </>
  );
}
