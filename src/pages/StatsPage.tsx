import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import { Link as RouterLink } from "react-router-dom";
import { StatsView } from "../components/StatsView";

// 公開の集計画面 (/stats): backend/internal/analytics の日別/週別/累計
// ランキング(GET /api/stats、認証不要)を誰でも見られる形で表示する。
// 中身は管理画面の集計タブ(AdminStatsPage)と共通の StatsView。
function StatsPage() {
  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <LeaderboardIcon color="primary" sx={{ mr: 1.5 }} fontSize="large" />
          <Typography variant="h6" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
            集計
          </Typography>
          <Button
            component={RouterLink}
            to="/"
            size="small"
            startIcon={<ArrowBackIcon />}
            sx={{ whiteSpace: "nowrap" }}
          >
            トップに戻る
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <StatsView />
      </Container>
    </Box>
  );
}

export default StatsPage;
