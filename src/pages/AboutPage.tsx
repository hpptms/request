import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoIcon from "@mui/icons-material/Info";
import { Link as RouterLink } from "react-router-dom";
import { Footer } from "../components/Footer";
import { useSeo } from "../lib/useSeo";

// サイトについて/運営者情報ページ (/about)。誰が何の目的で運営しているかを
// 示す、AdSense審査で求められる「運営者情報」ページ。実名・住所までは載せず、
// プロフィール的な内容にとどめる。
function AboutPage() {
  useSeo(
    "サイトについて | 動画リクエストキュー",
    "動画リクエストキューの運営者情報・サービスの目的についてのページです。",
    "/about",
  );

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <InfoIcon color="primary" sx={{ mr: 1.5 }} fontSize="large" />
          <Typography variant="h6" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
            サイトについて
          </Typography>
          <Button component={RouterLink} to="/" size="small" startIcon={<ArrowBackIcon />} sx={{ whiteSpace: "nowrap" }}>
            トップに戻る
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              サービスについて
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {"「動画リクエストキュー」は、配信・視聴イベント中に視聴者がYouTube・" +
                "ニコニコ動画・Vimeoの動画URLを送信してリクエストし、みんなで再生順を" +
                "決めながら一緒に視聴できる、視聴者参加型のサービスです。\n\n" +
                "リクエストされた動画は「いいね」で再生順が上がり、「bad(キャンセル" +
                "投票)」が一定数集まると短く切り上げられます。荒らし対策として、" +
                "短時間に大量の操作を行ったIPは自動的に一時BANされます。"}
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              運営者
            </Typography>
            <Typography variant="body1">
              本サイトは個人が趣味として開発・運営しています。実在の配信・イベントで実際に使われることを想定して機能追加や不具合修正を継続的に行っています。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              お問い合わせ
            </Typography>
            <Typography variant="body1">
              サービスに関するご意見・不具合報告などは
              <Button component={RouterLink} to="/contact" size="small" sx={{ mx: 0.5, verticalAlign: "baseline" }}>
                お問い合わせページ
              </Button>
              からご連絡ください。
            </Typography>
          </Box>
        </Stack>

        <Footer />
      </Container>
    </Box>
  );
}

export default AboutPage;
