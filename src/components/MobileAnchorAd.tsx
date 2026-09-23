import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useLocation } from "react-router-dom";

// admax banner ad, tag 23aa468c68dd9f337c4c77c42e885ffa (320x100, インライン
// — not the SP overlay/fixed format, which like the old PC 固定表示/右サイド
// tag would refuse to fire its ad request once the admax SDK detects it's
// running inside an iframe). Mobile only (the desktop rail unit lives in
// PcRailAd.tsx instead); pinned to the bottom of the viewport at full
// device width, like PcRailAd's fixed rail — our own CSS provides that
// positioning rather than admax's JS, for the same reason PcRailAd does
// (see that file). Skipped on /viewer for the same reason as PcRailAd — a
// floating ad has no business on a stream capture — and on /play, the
// public playback screen.
//
// Loaded from the dedicated ads.request.tokyo origin (a second custom
// domain on the same Cloudflare Pages deployment — see _headers) rather
// than run directly in this document: admax's RTB pipeline — its own
// scripts, plus whichever exchange/advertiser wins each auction — kept
// needing new script-src/img-src/connect-src CSP entries every time it hit
// a domain this site hadn't allowed yet (see nginx.conf/_headers' history).
// /ad/* has no CSP of its own on that origin, so that whack-a-mole is gone.
//
// The iframe is sandboxed WITH allow-same-origin — safe here specifically
// because the framed content is on a genuinely different origin
// (ads.request.tokyo) from this page (request.tokyo): ordinary
// same-origin-policy already keeps it from touching request.tokyo's real
// cookies/storage/DOM, no opaque-origin trick needed. allow-same-origin is
// required for admax's SDK to work at all — it renders creatives by
// creating further nested iframes and writing into them via
// contentWindow.document, which throws a SecurityError once the outer
// frame lacks allow-same-origin (each such nested context then gets its
// own distinct opaque origin, unable to access each other). Do NOT do this
// on a same-origin URL (e.g. plain /ad/banner) — allow-scripts +
// allow-same-origin together on same-origin content lets it reach
// window.parent.document freely, defeating the sandbox entirely.
const AD_SRC = "https://ads.request.tokyo/ad/banner?tag=23aa468c68dd9f337c4c77c42e885ffa";

// Exported so App.tsx can reserve this much bottom padding on page content
// — otherwise this fixed-position bar covers whatever was at the bottom of
// the page (e.g. Footer's links) since fixed elements are taken out of
// normal document flow and don't push other content out of the way on
// their own.
export const MOBILE_ANCHOR_AD_HEIGHT = 100;

// Shared with App.tsx so the reserved padding above exactly matches when
// this component actually renders itself (mobile widths, not /viewer or
// /play).
export function useMobileAnchorAdVisible() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { pathname } = useLocation();
  return isMobile && pathname !== "/viewer" && pathname !== "/play";
}

export function MobileAnchorAd() {
  const visible = useMobileAnchorAdVisible();
  if (!visible) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        bgcolor: "background.paper",
        zIndex: (theme) => theme.zIndex.appBar - 1,
      }}
    >
      <Box
        component="iframe"
        title="広告"
        src={AD_SRC}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        sx={{ border: 0, width: "100%", height: MOBILE_ANCHOR_AD_HEIGHT }}
      />
    </Box>
  );
}
