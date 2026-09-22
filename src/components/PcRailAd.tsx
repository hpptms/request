import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useLocation } from "react-router-dom";

// admax banner ad, tag 23ae35e7e86013ef2c89b228df7e3ea3 — desktop only
// (>=1024px; narrower viewports have no spare room beside the board's
// content for a 160px-wide rail without overlapping it), fixed to the
// right edge of the viewport. Skipped on /viewer, the admin-only OBS
// capture screen — a floating ad has no business on a stream capture.
//
// Previously loaded via boot.js using admax's own `sticky.right` JS action,
// which injects a position:fixed element directly into this page's <body>
// — something a sandboxed iframe fundamentally can't do (an iframe can
// only position elements within its own document). Switched to loading the
// plain per-tag snippet (same mechanism as FooterAd) inside a sandboxed
// same-origin iframe pointed at /ad/banner.html, with our own CSS
// providing the fixed positioning instead of admax's JS — see
// FooterAd.tsx / _headers for why that page needs to be sandboxed rather
// than run directly in this document.
//
// If this tag_id was registered in the admax dashboard specifically as a
// "sticky" format unit, requesting it through the plain snippet endpoint
// may render blank — check the admax dashboard and swap in a standard
// 160x600 tag_id if so.
const AD_SRC = "/ad/banner.html?tag=23ae35e7e86013ef2c89b228df7e3ea3";

export function PcRailAd() {
  const isDesktop = useMediaQuery("(min-width:1024px)");
  const { pathname } = useLocation();
  if (!isDesktop || pathname === "/viewer") return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: "50%",
        right: 16,
        transform: "translateY(-50%)",
        zIndex: (theme) => theme.zIndex.appBar - 1,
      }}
    >
      <Box
        component="iframe"
        title="広告"
        src={AD_SRC}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        sx={{ border: 0, width: 160, height: 600 }}
      />
    </Box>
  );
}
