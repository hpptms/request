import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MapIcon from "@mui/icons-material/Map";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { Link as RouterLink } from "react-router-dom";
import { ActiveUsersMap } from "../components/ActiveUsersMap";
import { Footer } from "../components/Footer";
import { useActiveUsersHeatmap } from "../lib/useActiveUsersHeatmap";
import { useSeo } from "../lib/useSeo";

// 公開のヒートマップ画面 (/heatmap): 管理画面の同名タブ(AdminHeatmapPage)
// と共通の ActiveUsersMap / useActiveUsersHeatmap を、認証不要で誰でも
// 見られる形で表示する。
function HeatmapPage() {
  const { points, prefectures, countries, isMock } = useActiveUsersHeatmap();
  useSeo(
    "アクティブユーザーヒートマップ | 動画リクエストキュー",
    "動画リクエストキューを今見ている人を都市別のバブルマップで表示します。",
    "/heatmap",
  );

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <MapIcon color="primary" sx={{ mr: 1.5 }} fontSize="large" />
          <Typography variant="h6" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
            アクティブユーザーヒートマップ
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Button
              component={RouterLink}
              to="/play"
              size="small"
              startIcon={<PlayCircleIcon />}
              sx={{ whiteSpace: "nowrap" }}
            >
              再生
            </Button>
            <Button
              component={RouterLink}
              to="/"
              size="small"
              startIcon={<ArrowBackIcon />}
              sx={{ whiteSpace: "nowrap" }}
            >
              トップに戻る
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        {points === null || prefectures === null ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {isMock && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                現在表示中はダミーデータです。GA4連携の設定が完了次第、実データに切り替わります。
              </Typography>
            )}
            <ActiveUsersMap points={points} prefectures={prefectures} countries={countries} />
          </>
        )}
        <Footer />
      </Container>
    </Box>
  );
}

export default HeatmapPage;
