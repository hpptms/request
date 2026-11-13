import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";

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

// i-mobile registers PC and smartphone sites as separate "media" (mid 598064
// = PC, 598127 = smartphone) and only fills a spot for the matching device,
// decided by the user agent in spot.js. So the banner has to be picked by
// device first and by viewport width second: a PC browser window too narrow
// for the sidebar used to get the smartphone bar, which i-mobile never fills
// on a PC, so no ad showed at all. This regex mirrors spot.js's own check
// (iPadOS Safari reports a Mac UA, so i-mobile — and we — treat it as a PC).
const SMARTPHONE_UA = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i;
const IS_SMARTPHONE = typeof navigator !== "undefined" && SMARTPHONE_UA.test(navigator.userAgent);

// Smartphones: smartphone banner (320x50) in a fixed bottom bar.
const MOBILE_BANNER: Banner = { src: `${AD_ORIGIN}/ad/sp-banner`, width: 320, height: 50 };
const MOBILE_AD_BAR_HEIGHT = MOBILE_BANNER.height + 8;

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

// PC only: Ninja AdMax skyscraper (160x600) in a sidebar on the left.
const PC_LEFT_BANNER: Banner = { src: `${AD_ORIGIN}/ad/pc-left`, width: 160, height: 600 };

// The pages lay themselves out (full-width header, centered content column),
// so the sidebars are overlaid with position: fixed. On a wide screen the
// centered column already leaves room for them on both sides. On a narrower
// PC window the page gets side padding instead, which shifts the column
// (and narrows it if needed) so no sidebar ever covers it. The right sidebar
// shows from PC_SIDEBAR_MIN_WIDTH, the left one only from
// PC_LEFT_SIDEBAR_MIN_WIDTH so the column keeps its full 720px width.
const SIDEBAR_MARGIN = 16;
const SIDEBAR_RESERVE = PC_BANNER.width + SIDEBAR_MARGIN * 2;
const LEFT_SIDEBAR_RESERVE = PC_LEFT_BANNER.width + SIDEBAR_MARGIN * 2;
const PC_SIDEBAR_MIN_WIDTH = 1024;
const PC_LEFT_SIDEBAR_MIN_WIDTH = 720 + SIDEBAR_RESERVE + LEFT_SIDEBAR_RESERVE + 32;
// Content column widths: TEXT_CONTAINER_SX caps most pages at 720px; the
// stats/heatmap pages use MUI's "md" container (900px).
const WIDE_PAGES = new Set(["/stats", "/heatmap"]);
function mediaQueries(pathname: string) {
  // /stats/2026-11-13 etc. are the same stats page (see lib/statsPath).
  const content = WIDE_PAGES.has(pathname) || pathname.startsWith("/stats/") ? 900 : 720;
  // Centering clears both sidebars once each side has the wider one's room.
  const centeredMinWidth = content + 2 * SIDEBAR_RESERVE;
  return {
    sidebar: `@media (min-width: ${PC_SIDEBAR_MIN_WIDTH}px)`,
    leftSidebar: `@media (min-width: ${PC_LEFT_SIDEBAR_MIN_WIDTH}px)`,
    needsReserve: `@media (max-width: ${centeredMinWidth - 0.02}px)`,
  };
}

// Fixed to the left or right edge, below the page header.
function AdSidebar({ banner, side }: { banner: Banner; side: "left" | "right" }) {
  return (
    <Box
      component="aside"
      aria-label="広告"
      sx={{
        display: "flex",
        position: "fixed",
        top: 80,
        [side]: SIDEBAR_MARGIN,
        width: banner.width,
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <AdLabel />
      <BannerFrame banner={banner} />
    </Box>
  );
}

// Fixed bar at the bottom of the screen when there's no room for the sidebar.
function AdBar({ banner }: { banner: Banner }) {
  return (
    <Box
      component="aside"
      aria-label="広告"
      sx={{
        display: "flex",
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
      <BannerFrame banner={banner} />
    </Box>
  );
}

// Adds the ad sidebars (PC: right, plus left when wide enough) / fixed bottom bar (smartphones) on top of a page.
// Only the matching banner is rendered: an iframe hidden with display: none
// still loads and requests an ad, which would count impressions that can
// never be viewed.
export function AffiliateAdLayout({ pathname, children }: { pathname: string; children: ReactNode }) {
  const media = mediaQueries(pathname);
  const sidebarFits = useMediaQuery(media.sidebar, { noSsr: true });
  const leftFits = useMediaQuery(media.leftSidebar, { noSsr: true });
  if (IS_SMARTPHONE) {
    return (
      <>
        {children}
        {/* Keeps the page's last content (footer) from ending up under the fixed bar. */}
        <Box sx={{ height: `calc(${MOBILE_AD_BAR_HEIGHT}px + env(safe-area-inset-bottom))` }} />
        <AdBar banner={MOBILE_BANNER} />
      </>
    );
  }
  if (!sidebarFits) return <>{children}</>;
  return (
    <>
      <Box
        sx={{
          [media.needsReserve]: { pr: `${SIDEBAR_RESERVE}px`, pl: leftFits ? `${LEFT_SIDEBAR_RESERVE}px` : 0 },
        }}
      >
        {children}
      </Box>
      {leftFits && <AdSidebar banner={PC_LEFT_BANNER} side="left" />}
      <AdSidebar banner={PC_BANNER} side="right" />
    </>
  );
}
