import type { ReactNode } from "react";
import Box from "@mui/material/Box";
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

// Phones: the only banner that fits a fixed bottom bar.
const MOBILE_BANNER: Banner = { advid: "45584", campaignid: "941", width: 320, height: 100 };
export const MOBILE_AD_BAR_HEIGHT = MOBILE_BANNER.height + 8;

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

// PC: i-mobile's rotating 728x90 big banner. Its tag (spot.js) pulls
// scripts from many ad-network hosts, which the SPA's strict CSP blocks, so
// the tag lives in its own page (public/ad/pc-banner.html, served with a
// relaxed CSP — see public/_headers /ad/*) and is framed here. It stays
// mounted across route changes; the banner rotates by itself.
const PC_BANNER = { src: "/ad/pc-banner", width: 728, height: 90 };
const PC_AD_BAR_HEIGHT = PC_BANNER.height + 8;

// The pages lay themselves out (full-width header, centered content column),
// so the ad is overlaid as a fixed bar at the bottom of the screen instead of
// squeezing the page. Screens wide enough for the 728px banner get it; the
// rest get the 320x100 phone banner.
const PC_MIN_WIDTH = PC_BANNER.width + 32;
const MEDIA = {
  pc: `@media (min-width: ${PC_MIN_WIDTH}px)`,
  mobile: `@media (max-width: ${PC_MIN_WIDTH - 0.02}px)`,
};

function AdBar({ media, children }: { media: string; children: ReactNode }) {
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
      {children}
    </Box>
  );
}

function PcBannerFrame() {
  return (
    <Box
      component="iframe"
      src={PC_BANNER.src}
      title="広告"
      width={PC_BANNER.width}
      height={PC_BANNER.height}
      scrolling="no"
      sx={{ display: "block", border: 0, overflow: "hidden", flexShrink: 0 }}
    />
  );
}

// Adds the fixed bottom ad bar (728x90 on PC, 320x100 on phones) on top of a
// page without touching the page's own layout.
export function AffiliateAdLayout({ children }: { pathname?: string; children: ReactNode }) {
  return (
    <>
      {children}
      {/* Keeps the page's last content (footer) from ending up under the fixed bar. */}
      <Box
        sx={{
          [MEDIA.pc]: { height: `calc(${PC_AD_BAR_HEIGHT}px + env(safe-area-inset-bottom))` },
          [MEDIA.mobile]: { height: `calc(${MOBILE_AD_BAR_HEIGHT}px + env(safe-area-inset-bottom))` },
        }}
      />
      <AdBar media={MEDIA.pc}>
        <PcBannerFrame />
      </AdBar>
      <AdBar media={MEDIA.mobile}>
        <BannerFrame banner={MOBILE_BANNER} />
      </AdBar>
    </>
  );
}
