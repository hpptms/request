import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

// Shared bottom-of-page links to the site's other public pages (再生/集計/
// ヒートマップ/お知らせ, plus 使い方ガイド/よくある質問/サイトについて/
// プライバシーポリシー/利用規約/お問い合わせ)
// — the first four are also in BoardPage's header, but not in every other
// page's, so listing them here gives each public page a crawlable path to
// all the others. Added to the pages a crawler or
// reviewer is most likely to land on first (BoardPage, StatsPage) so these
// pages are actually reachable by navigation, not just present at a URL.
// Left off PlayPage/ViewerPage, which are optimized to show the video/queue
// as large as possible with no unrelated chrome, and off AdminPage (not
// public — see robots.txt).
// PageSpeed Insights' target-size audit: a bare body2 link is only ~20px
// tall, under the 24px minimum, so pad each one vertically.
const LINK_SX = { display: "inline-block", py: 0.5 } as const;

export function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: "divider", mt: 4, py: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1.5, sm: 2 }}
        divider={<Box sx={{ display: { xs: "none", sm: "block" }, borderLeft: 1, borderColor: "divider" }} />}
        sx={{ justifyContent: "center", alignItems: "center", flexWrap: "wrap", px: 2 }}
      >
        <Link component={RouterLink} to="/" variant="body2" color="text.secondary" underline="hover" sx={LINK_SX}>
          リクエスト一覧
        </Link>
        <Link component={RouterLink} to="/play" variant="body2" color="text.secondary" underline="hover" sx={LINK_SX}>
          再生
        </Link>
        <Link component={RouterLink} to="/stats" variant="body2" color="text.secondary" underline="hover" sx={LINK_SX}>
          集計
        </Link>
        <Link component={RouterLink} to="/heatmap" variant="body2" color="text.secondary" underline="hover" sx={LINK_SX}>
          ヒートマップ
        </Link>
        <Link component={RouterLink} to="/notice" variant="body2" color="text.secondary" underline="hover" sx={LINK_SX}>
          お知らせ
        </Link>
        <Link component={RouterLink} to="/guide" variant="body2" color="text.secondary" underline="hover" sx={LINK_SX}>
          使い方ガイド
        </Link>
        <Link component={RouterLink} to="/faq" variant="body2" color="text.secondary" underline="hover" sx={LINK_SX}>
          よくある質問
        </Link>
        <Link component={RouterLink} to="/about" variant="body2" color="text.secondary" underline="hover" sx={LINK_SX}>
          サイトについて
        </Link>
        <Link component={RouterLink} to="/privacy" variant="body2" color="text.secondary" underline="hover" sx={LINK_SX}>
          プライバシーポリシー
        </Link>
        <Link component={RouterLink} to="/terms" variant="body2" color="text.secondary" underline="hover" sx={LINK_SX}>
          利用規約
        </Link>
        <Link component={RouterLink} to="/contact" variant="body2" color="text.secondary" underline="hover" sx={LINK_SX}>
          お問い合わせ
        </Link>
      </Stack>
      <Typography variant="caption" color="text.secondary" align="center" sx={{ display: "block", mt: 1.5 }}>
        © 2026 動画リクエストキュー
      </Typography>
    </Box>
  );
}
