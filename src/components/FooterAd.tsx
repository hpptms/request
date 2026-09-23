import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

// admax banner ad, tag 940ac14e3724561e7b4a65c797fdbcd2 — mobile only (the
// desktop rail unit lives in PcRailAd.tsx instead). Loaded from the
// dedicated ads.request.tokyo origin (a second custom domain on the same
// Cloudflare Pages deployment — see _headers) rather than run directly in
// this document: admax's RTB pipeline — its own scripts, plus whichever
// exchange/advertiser wins each auction — kept needing new script-src/
// img-src/connect-src CSP entries every time it hit a domain this site
// hadn't allowed yet (see nginx.conf/_headers' history). /ad/* has no CSP
// of its own on that origin, so that whack-a-mole is gone.
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
const AD_SRC = "https://ads.request.tokyo/ad/banner?tag=940ac14e3724561e7b4a65c797fdbcd2";

export function FooterAd() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  if (!isMobile) return null;

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
      <Box
        component="iframe"
        title="広告"
        src={AD_SRC}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        sx={{ border: 0, width: "100%", maxWidth: 336, height: 100 }}
      />
    </Box>
  );
}
