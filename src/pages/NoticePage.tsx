import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink } from "react-router-dom";
import { AdminMessageForm } from "../components/AdminMessageForm";
import { Footer } from "../components/Footer";
import { SiteLogo } from "../components/SiteLogo";
import { NOTICE_SECTIONS, RECENT_CHANGES } from "../lib/notices";
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
          <Box component="section">
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              お知らせ・ルール
            </Typography>
            <Stack spacing={1.5}>
              {NOTICE_SECTIONS.map((section) => (
                <Paper key={section.title} variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                    <Box component="span" aria-hidden sx={{ fontSize: "1.25rem", lineHeight: 1 }}>
                      {section.icon}
                    </Box>
                    <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>
                      {section.title}
                    </Typography>
                  </Stack>
                  <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
                    {section.items.map((item) => (
                      <Typography key={item} component="li" variant="body2" sx={{ lineHeight: 1.7 }}>
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>

          <Box component="section">
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              直近の変更
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              {RECENT_CHANGES.map((change, i) => (
                <Box key={change.title}>
                  {i > 0 && <Divider />}
                  <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1.25 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      {i === 0 && (
                        <Chip
                          label="NEW"
                          color="primary"
                          size="small"
                          sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}
                        />
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {change.title}
                      </Typography>
                    </Stack>
                    {change.detail && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                        {change.detail}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Paper>
          </Box>

          <AdminMessageForm defaultOpen />
        </Stack>
        <Footer />
      </Container>
    </Box>
  );
}

export default NoticePage;
