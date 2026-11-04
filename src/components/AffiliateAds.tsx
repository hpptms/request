import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

// i-mobile affiliate banners. The tag i-mobile hands out
// (aff.i-mobile.co.jp/script/adspot_ifs.js) only document.write()s an
// <iframe src="https://aff.i-mobile.co.jp/adspot.aspx?..."> — which can't run
// in an SPA (and its inline <script> would be blocked by our CSP anyway) — so
// the same iframe is rendered directly here. CSP: frame-src allows
// https://aff.i-mobile.co.jp (public/_headers, nginx.conf).
const PARTNER_ID = "69099";
const SITE_ID = "57821";

interface Banner {
  advid: string;
  campaignid: string;
  width: number;
  height: number;
}

// PC sidebar: one of these per page view, picked at random.
const SIDEBAR_BANNERS: Banner[] = [
  { advid: "979", campaignid: "95", width: 300, height: 250 },
  { advid: "5272", campaignid: "397", width: 250, height: 250 },
  { advid: "6347", campaignid: "489", width: 120, height: 600 },
  { advid: "52090", campaignid: "4952", width: 200, height: 200 },
];

// Phones: the only banner that fits a fixed bottom bar.
const MOBILE_BANNER: Banner = { advid: "45584", campaignid: "941", width: 320, height: 100 };
export const MOBILE_AD_BAR_HEIGHT = MOBILE_BANNER.height + 8;

// Text-link program (アミノプラス).
const TEXT_LINK = {
  href: `https://aff.i-mobile.co.jp/ad_link.ashx?pid=${PARTNER_ID}&advid=77307&psid=${SITE_ID}`,
  label: "アミノプラス",
};

function bannerSrc(b: Banner) {
  const params = new URLSearchParams({
    pid: PARTNER_ID,
    psid: SITE_ID,
    advid: b.advid,
    camid: b.campaignid,
    adtype: "Image",
    width: String(b.width),
    height: String(b.height),
  });
  return `https://aff.i-mobile.co.jp/adspot.aspx?${params}`;
}

function BannerFrame({ banner }: { banner: Banner }) {
  return (
    <Box
      component="iframe"
      src={bannerSrc(banner)}
      title="広告"
      width={banner.width}
      height={banner.height}
      scrolling="no"
      loading="lazy"
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

// The pages lay themselves out (full-width header, centered content column),
// so the ads are overlaid with position: fixed instead of squeezing the page
// into a flex row — that cut every page's header short. The sidebar only
// shows when the viewport leaves room for it beside the content column;
// narrower screens get the bottom bar instead.
const SIDEBAR_WIDTH = 300;
const SIDEBAR_MARGIN = 16;
// Content column widths: TEXT_CONTAINER_SX caps most pages at 720px; the
// stats/heatmap pages use MUI's "md" container (900px).
const WIDE_PAGES = new Set(["/stats", "/heatmap"]);
function sidebarMediaQuery(pathname: string) {
  const content = WIDE_PAGES.has(pathname) ? 900 : 720;
  const minWidth = content + 2 * (SIDEBAR_WIDTH + SIDEBAR_MARGIN * 2);
  return {
    sidebar: `@media (min-width: ${minWidth}px)`,
    bar: `@media (max-width: ${minWidth - 0.02}px)`,
  };
}

// Fixed to the right edge, below the page header. Remounted per route (key)
// so each page view can draw a different banner.
function AdSidebar({ media }: { media: string }) {
  const [banner] = useState(() => SIDEBAR_BANNERS[Math.floor(Math.random() * SIDEBAR_BANNERS.length)]);
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
      <BannerFrame banner={banner} />
      <Link href={TEXT_LINK.href} target="_blank" rel="noopener sponsored" variant="body2" color="text.secondary" underline="hover">
        [PR] {TEXT_LINK.label}
      </Link>
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
  const media = sidebarMediaQuery(pathname);
  return (
    <>
      {children}
      {/* Keeps the page's last content (footer) from ending up under the fixed bar. */}
      <Box sx={{ display: "none", [media.bar]: { display: "block" }, height: `calc(${MOBILE_AD_BAR_HEIGHT}px + env(safe-area-inset-bottom))` }} />
      <AdSidebar key={`side-${pathname}`} media={media.sidebar} />
      <MobileAdBar key={`bar-${pathname}`} media={media.bar} />
    </>
  );
}
