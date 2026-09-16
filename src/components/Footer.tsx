import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

// Shared bottom-of-page links to the site's non-queue pages (プライバシー
// ポリシー/サイトについて/お問い合わせ) — added to the pages a crawler or
// reviewer is most likely to land on first (BoardPage, StatsPage) so these
// pages are actually reachable by navigation, not just present at a URL.
// Left off PlayPage/ViewerPage, which are optimized to show the video/queue
// as large as possible with no unrelated chrome, and off AdminPage (not
// public — see robots.txt).
export function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: "divider", mt: 4, py: 3 }}>
      <Stack
        direction="row"
        spacing={2}
        divider={<Box sx={{ borderLeft: 1, borderColor: "divider" }} />}
        sx={{ justifyContent: "center", flexWrap: "wrap", px: 2 }}
      >
        <Link component={RouterLink} to="/about" variant="body2" color="text.secondary" underline="hover">
          サイトについて
        </Link>
        <Link component={RouterLink} to="/privacy" variant="body2" color="text.secondary" underline="hover">
          プライバシーポリシー
        </Link>
        <Link component={RouterLink} to="/contact" variant="body2" color="text.secondary" underline="hover">
          お問い合わせ
        </Link>
      </Stack>
      <Typography variant="caption" color="text.secondary" align="center" sx={{ display: "block", mt: 1.5 }}>
        動画リクエストキュー
      </Typography>
    </Box>
  );
}
