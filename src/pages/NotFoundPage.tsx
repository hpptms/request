import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Footer } from "../components/Footer";
import { useSeo } from "../lib/useSeo";
import { BackToTopButton } from "../components/PublicNavButtons";
import { TEXT_CONTAINER_SX } from "../lib/layout";
import { SiteLogo } from "../components/SiteLogo";

// 存在しないURL用の404ページ。Cloudflare Pagesの _redirects が全パスを
// index.html(200)で返すSPAなので、以前はルートに一致しないURLが空白ページ
// のまま200で返り、Googleにソフト404(空の重複ページ)として扱われていた。
// HTTPステータスは変えられないので、代わりに noindex を付けてインデックス
// されないようにし、主要ページへのリンクを置いて回遊先を示す。
function NotFoundPage() {
  const { pathname } = useLocation();
  useSeo(
    "ページが見つかりません | 動画リクエストキュー",
    "お探しのページは見つかりませんでした。URLが変更されたか、削除された可能性があります。",
    pathname,
    { noindex: true },
  );

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <SiteLogo />
          <Typography variant="h6" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
            ページが見つかりません
          </Typography>
          <BackToTopButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={TEXT_CONTAINER_SX}>
        <Stack spacing={3}>
          <Typography variant="body1">
            お探しのページは見つかりませんでした。URLが変更されたか、削除された可能性があります。
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <Button component={RouterLink} to="/" variant="contained">
              リクエスト一覧へ
            </Button>
            <Button component={RouterLink} to="/play" variant="outlined">
              再生画面へ
            </Button>
          </Stack>
        </Stack>

        <Footer />
      </Container>
    </Box>
  );
}

export default NotFoundPage;
