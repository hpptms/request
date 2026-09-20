import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink } from "react-router-dom";
import { AdminMessageForm } from "../components/AdminMessageForm";
import { Footer } from "../components/Footer";
import { SiteLogo } from "../components/SiteLogo";
import { NOTICES, RECENT_CHANGES } from "../lib/notices";
import { useSeo } from "../lib/useSeo";

// お知らせページ (/notice): トップページに置いていた注意書き・直近の変更・
// 管理者へのメッセージ欄をここにまとめている(トップは配信中/再生中を優先)。
function NoticePage() {
  useSeo(
    "お知らせ | 動画リクエストキュー",
    "動画リクエストキューのお知らせ・ルール・直近の変更点と、管理者へのメッセージ送信ページです。",
    "/notice",
  );

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <SiteLogo />
          <Typography variant="h6" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
            お知らせ
          </Typography>
          <Button component={RouterLink} to="/" size="small" startIcon={<ArrowBackIcon />} sx={{ whiteSpace: "nowrap" }}>
            トップに戻る
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              お知らせ・ルール
            </Typography>
            <Stack spacing={1}>
              {NOTICES.map((text) => (
                <Typography key={text} variant="body1">
                  {text}
                </Typography>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              直近の変更
            </Typography>
            <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
              {RECENT_CHANGES.map((text) => (
                <Typography key={text} component="li" variant="body1">
                  {text}
                </Typography>
              ))}
            </Stack>
          </Box>

          <AdminMessageForm defaultOpen />
        </Stack>
        <Footer />
      </Container>
    </Box>
  );
}

export default NoticePage;
