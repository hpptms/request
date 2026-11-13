import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import { useAccount } from "../lib/account";

// Shared bottom-of-page links to the site's other public pages (再生/集計/
// ヒートマップ/お知らせ, plus 使い方ガイド/よくある質問/サイトについて/
// プライバシーポリシー/利用規約/著作権ガイドライン/お問い合わせ)
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

const LINKS: [to: string, label: string][] = [
  ["/", "リクエスト一覧"],
  ["/play", "再生"],
  ["/stats", "集計"],
  ["/heatmap", "ヒートマップ"],
  ["/notice", "お知らせ"],
  ["/guide", "使い方ガイド"],
  ["/faq", "よくある質問"],
  ["/about", "サイトについて"],
  ["/privacy", "プライバシーポリシー"],
  ["/terms", "利用規約"],
  ["/copyright", "著作権ガイドライン"],
  ["/contact", "お問い合わせ"],
];

export function Footer() {
  // /account only once memberships are switched on (see lib/account.ts).
  const account = useAccount();
  const links: [string, string][] = account.status === "ready" ? [...LINKS, ["/account", "アカウント"]] : LINKS;
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: "divider", mt: 4, py: 3 }}>
      {/* Phones: a two-column grid — one link per row made the footer
          alone about a screen tall. Wider: wrapping rows. */}
      <Box
        component="nav"
        aria-label="サイト内リンク"
        sx={{
          display: { xs: "grid", sm: "flex" },
          gridTemplateColumns: "1fr 1fr",
          justifyItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          columnGap: { xs: 1, sm: 3 },
          rowGap: { xs: 0.5, sm: 0.25 },
          px: 2,
        }}
      >
        {links.map(([to, label]) => (
          <Link key={to} component={RouterLink} to={to} variant="body2" color="text.secondary" underline="hover" sx={LINK_SX}>
            {label}
          </Link>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" align="center" sx={{ display: "block", mt: 1.5 }}>
        © 2026 動画リクエストキュー
      </Typography>
    </Box>
  );
}
