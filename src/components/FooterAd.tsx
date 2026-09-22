import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

// admax banner ad, tag 940ac14e3724561e7b4a65c797fdbcd2 — mobile only (the
// desktop rail unit lives in PcRailAd.tsx instead). Loaded via a same-origin
// but sandboxed iframe pointing at the static /ad/banner.html page, rather
// than run directly in this document (or a srcDoc iframe, which inherits
// this page's own CSP just the same): admax's RTB pipeline — its own
// scripts, plus whichever exchange/advertiser wins each auction — kept
// needing new script-src/img-src/connect-src CSP entries every time it hit
// a domain this site hadn't allowed yet (see nginx.conf/_headers' history).
// /ad/banner.html has no CSP of its own, so that whack-a-mole is gone; the
// sandbox attribute (no allow-same-origin) is what keeps it safe even so —
// it gives that document a unique opaque origin, unable to touch
// request.tokyo's real cookies/storage/DOM.
// Cloudflare Pages 308-redirects "*.html" to the extensionless path (still
// serving the same file/headers either way — confirmed via curl against
// production), so this skips straight to that path to avoid the extra hop.
const AD_SRC = "/ad/banner?tag=940ac14e3724561e7b4a65c797fdbcd2";

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
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        sx={{ border: 0, width: "100%", maxWidth: 336, height: 100 }}
      />
    </Box>
  );
}
