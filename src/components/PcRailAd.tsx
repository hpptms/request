import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useLocation } from "react-router-dom";

// admax banner ad, tag cd45827394e2a2c014eb20d9bfe1c51a — desktop only
// (>=1024px; narrower viewports have no spare room beside the board's
// content for a 160px-wide rail without overlapping it), fixed to the
// right edge of the viewport. Skipped on /viewer, the admin-only OBS
// capture screen — a floating ad has no business on a stream capture.
//
// Previously loaded via boot.js using admax's own `sticky.right` JS action,
// which injects a position:fixed element directly into this page's <body>
// — something an iframe fundamentally can't do (an iframe can only
// position elements within its own document), and which the admax SDK
// itself refuses to even attempt once it detects it's running inside an
// iframe. Switched to a plain "インライン" 160x600 tag (registered as such
// in the admax dashboard, unlike the old "固定表示/右サイド" tag this
// replaced) loaded via the same per-tag snippet as FooterAd, from the
// dedicated ads.request.tokyo origin, with our own CSS providing the fixed
// positioning instead of admax's JS — see FooterAd.tsx for why that origin
// (and allow-same-origin on the iframe) is needed for admax's SDK to
// render anything at all, and why it's safe despite allow-same-origin.
const AD_SRC = "https://ads.request.tokyo/ad/banner?tag=cd45827394e2a2c014eb20d9bfe1c51a";

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
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        sx={{ border: 0, width: 160, height: 600 }}
      />
    </Box>
  );
}
