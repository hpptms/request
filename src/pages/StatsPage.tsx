import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Footer } from "../components/Footer";
import { StatsView } from "../components/StatsView";
import { useSeo } from "../lib/useSeo";
import { PublicNavButtons } from "../components/PublicNavButtons";
import { SiteLogo } from "../components/SiteLogo";

// 公開の集計画面 (/stats): backend/internal/analytics の日別/週別/累計
// ランキング(GET /api/stats、認証不要)を誰でも見られる形で表示する。
// 中身は管理画面の集計タブ(AdminStatsPage)と共通の StatsView。
function StatsPage() {
  useSeo(
    "集計 | 動画リクエストキュー",
    "動画リクエストキューで、リクエスタから動画リクエストの多いアーティスト・動画、いいね・bad(キャンセル投票)の多い動画を日別・週別・累計で集計したランキングです。",
    "/stats",
  );

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <SiteLogo />
          <Typography variant="h6" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
            集計
          </Typography>
          <PublicNavButtons />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <StatsView />
        <Footer />
      </Container>
    </Box>
  );
}

export default StatsPage;
