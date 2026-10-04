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

// サイトについて/運営者情報ページ (/about)。誰が何の目的で運営しているかを
// 示す、AdSense審査で求められる「運営者情報」ページ。実名・住所までは載せず、
// プロフィール的な内容にとどめる。
function AboutPage() {
  useSeo(
    "サイトについて | 動画リクエストキュー",
    "動画リクエストキューは、リクエスタがリクエストした動画をみんなで一緒に見られる動画リクエストサイトです。運営者情報・サービスの目的についてのページです。",
    "/about",
  );

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <SiteLogo />
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
              {"「動画リクエストキュー」は、配信・視聴イベント中に視聴者(リクエスタ)がYouTube・" +
                "ニコニコ動画・Vimeoの動画URLを送信してリクエストし、みんなで再生順を" +
                "決めながら一緒に視聴できる、視聴者参加型のサービスです。\n\n" +
                "リクエストされた動画は「いいね」で再生順が上がり、「bad(キャンセル" +
                "投票)」が一定数集まると短く切り上げられます。荒らし対策として、" +
                "短時間に大量の操作を行ったIPは自動的に一時BANされます。"}
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              主な特徴
            </Typography>
            <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 3 }}>
              {[
                "登録不要。URLを貼るだけでリクエストでき、スマートフォンからも参加できます。",
                "いいね・超いいね・bad・スベってるの4種類のリアクションで、参加者の反応がそのまま再生順・再生時間に反映されます。",
                "毎朝切り替わる「今日のテーマ」が、何をリクエストするか考えるきっかけになります。",
                "リクエストや投票の履歴を日別・週別・累計・時間帯別に集計し、人気の動画やアーティストをランキングで振り返れます。",
                "いま参加している人の地域を地図で眺められるヒートマップを公開しています。",
              ].map((item) => (
                <Typography key={item} component="li" variant="body1">
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              開発のきっかけ
            </Typography>
            <Typography variant="body1">
              配信中に視聴者から動画のリクエストを受け付けると、コメント欄にURLが流れて埋もれてしまったり、誰のリクエストを先に再生するかで迷ったりしがちです。そこで、リクエストを1つの待機列にまとめ、順番や再生時間を参加者自身の投票で決められるようにしたのが本サービスです。「選曲もみんなで楽しむ」ことを目指して、利用者の声をもとに機能を追加し続けています。これまでの変更内容は
              <Button component={RouterLink} to="/notice" size="small" sx={{ mx: 0.5, verticalAlign: "baseline" }}>
                お知らせ
              </Button>
              で公開しています。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              コンテンツと著作権について
            </Typography>
            <Typography variant="body1">
              本サービスで再生される動画は、YouTube・ニコニコ動画・Vimeoの公式埋め込みプレイヤーを通じて表示しており、動画ファイルを本サービスが保存・再配信することはありません。不適切な動画は管理者が削除し、禁止ワードやBANの仕組みで荒らし行為を防いでいます。詳しくは
              <Button component={RouterLink} to="/terms" size="small" sx={{ mx: 0.5, verticalAlign: "baseline" }}>
                利用規約
              </Button>
              をご覧ください。
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
