import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

// admax banner ad, tag 940ac14e3724561e7b4a65c797fdbcd2 — mobile only (the
// desktop sticky-right unit lives in boot.js/index.html instead; see that
// file's comment for the CSP script-src additions both units share).
// Rendered inside a srcDoc iframe rather than injected straight into the
// page: the vendor snippet chain-loads a second script via document.write,
// and Footer mounts long after DOMContentLoaded, so calling document.write
// on the live SPA document at that point would wipe the whole page. A
// freshly created srcDoc document is still mid-parse, so document.write
// behaves normally there.
const AD_HTML = `<!doctype html><html><head><style>body{margin:0;display:flex;justify-content:center;align-items:center}</style></head><body>
<!-- admax -->
<script src="https://adm.shinobi.jp/s/940ac14e3724561e7b4a65c797fdbcd2"></script>
<!-- admax -->
</body></html>`;

export function FooterAd() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  if (!isMobile) return null;

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
      <Box
        component="iframe"
        title="広告"
        srcDoc={AD_HTML}
        sx={{ border: 0, width: "100%", maxWidth: 336, height: 100 }}
      />
    </Box>
  );
}
