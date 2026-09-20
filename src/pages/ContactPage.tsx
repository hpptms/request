import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink } from "react-router-dom";
import { Footer } from "../components/Footer";
import { useSeo } from "../lib/useSeo";
import { SiteLogo } from "../components/SiteLogo";

// お問い合わせ窓口。開設済みならここにX(旧Twitter)のURL/@ハンドルを入れる
// — 未設定のうちは下のContactPageが「準備中」表示にフォールバックする。
const X_HANDLE: string | null = "request_tokyo";

// お問い合わせページ (/contact)。フォームは持たず、連絡手段としてX(旧
// Twitter)のアカウントを案内する。AdSense審査上は「連絡手段があること」
// が重要で、フォームである必要はない。
function ContactPage() {
  useSeo(
    "お問い合わせ | 動画リクエストキュー",
    "動画リクエストキューへのご意見・不具合報告等のお問い合わせ方法についてのページです。",
    "/contact",
  );

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <SiteLogo />
          <Typography variant="h6" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
            お問い合わせ
          </Typography>
          <Button component={RouterLink} to="/" size="small" startIcon={<ArrowBackIcon />} sx={{ whiteSpace: "nowrap" }}>
            トップに戻る
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Stack spacing={3}>
          <Typography variant="body1">
            動画リクエストキューに関するご意見・不具合報告・その他お問い合わせは、以下の窓口までご連絡ください。
          </Typography>

          <Box>
            <Typography variant="h6" gutterBottom>
              X（旧Twitter）
            </Typography>
            {X_HANDLE ? (
              <Button
                component="a"
                href={`https://x.com/${X_HANDLE}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
              >
                @{X_HANDLE}
              </Button>
            ) : (
              <Typography variant="body1" color="text.secondary">
                現在お問い合わせ用アカウントを準備中です。
              </Typography>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary">
            内容によってはご返信までお時間をいただく場合や、返信できない場合がございます。あらかじめご了承ください。
          </Typography>
        </Stack>

        <Footer />
      </Container>
    </Box>
  );
}

export default ContactPage;
