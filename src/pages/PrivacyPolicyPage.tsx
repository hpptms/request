import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink } from "react-router-dom";
import { Footer } from "../components/Footer";
import { useSeo } from "../lib/useSeo";
import { SiteLogo } from "../components/SiteLogo";

// プライバシーポリシー (/privacy)。Google公式ヘルプが必須としている3点
// (第三者配信事業者によるCookie利用/パーソナライズド広告の表示/広告設定
// による無効化手段)を明記した、AdSense審査で唯一必須のページ。実際に本
// サイトが行っているGoogle Analyticsでのアクセス解析、荒らし対策目的の
// IPアドレス利用についても合わせて記載する。
function PrivacyPolicyPage() {
  useSeo(
    "プライバシーポリシー | 動画リクエストキュー",
    "動画リクエストキューにおける個人情報の取り扱い、Cookie・アクセス解析・広告配信についてのプライバシーポリシーです。",
    "/privacy",
  );

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <SiteLogo />
          <Typography variant="h6" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
            プライバシーポリシー
          </Typography>
          <Button component={RouterLink} to="/" size="small" startIcon={<ArrowBackIcon />} sx={{ whiteSpace: "nowrap" }}>
            トップに戻る
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            動画リクエストキュー（以下「本サービス」）における、利用者の個人情報の取り扱いについて説明します。
          </Typography>

          <Box>
            <Typography variant="h6" gutterBottom>
              個人情報の取得について
            </Typography>
            <Typography variant="body1">
              本サービスの利用にあたり、氏名やメールアドレス等の登録は必要ありません。一方で、不正利用・荒らし行為を防止する目的で、リクエストや投票の際のIPアドレスを取得し、レート制限や自動BAN等の判定に利用しています。また、時間帯別のいいね数ランキング(上位5位の方への通知表示)のため、リクエスト元のIPアドレスを時間帯ごとに集計して保存しています。さらに、「管理者へメッセージ」機能では、送信されたメッセージを送信元のIPアドレスとともに30日間保存し、管理者からの返信を同じIPアドレスの方に次回アクセス時に表示するために利用しています。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              アクセス解析ツール（Google アナリティクス）について
            </Typography>
            <Typography variant="body1">
              本サービスでは、サイトの利用状況を把握するためにGoogleアナリティクスを利用しています。Googleアナリティクスはトラフィックデータの収集のためにCookieを使用しますが、このデータは匿名で収集されており、個人を特定するものではありません。この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。この規約に関して、詳しくは
              <Link href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" rel="noopener noreferrer">
                Googleアナリティクス利用規約
              </Link>
              のページや
              <Link href="https://policies.google.com/technologies/partner-sites?hl=ja" target="_blank" rel="noopener noreferrer">
                Googleポリシーと規約
              </Link>
              のページをご覧ください。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              第三者配信の広告サービスについて
            </Typography>
            <Typography variant="body1">
              当サイトは、Googleをはじめとする第三者配信事業者による広告サービスを利用する場合があります。これら広告配信事業者は、利用者の興味に応じた広告を表示するため、当サイトや他サイトへのアクセスに関する情報（Cookie等）を用いることがあります。
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              Googleが広告配信にCookieを使用することにより、当サイトや他のサイトへの過去のアクセス情報に基づいて、ユーザーの興味に応じた広告（パーソナライズド広告）を表示しています。パーソナライズド広告の表示を無効にする場合は、
              <Link href="https://adssettings.google.com/authenticated" target="_blank" rel="noopener noreferrer">
                広告設定
              </Link>
              にアクセスして行うことができます。またパーソナライズド広告に使われるCookieを無効にする場合は
              <Link href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
                aboutads.info
              </Link>
              にアクセスし、オプトアウトの設定を行うことができます。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              アフィリエイトについて
            </Typography>
            <Typography variant="body1">
              当サイトは、Amazonアソシエイト・プログラムおよび楽天アフィリエイトの参加者です。再生中の曲の横に表示する「Amazonで探す」「楽天で探す」のリンクは広告(アフィリエイトリンク)で、リンク先で商品を購入すると、当サイトが紹介料を受け取ることがあります。Amazonアソシエイトとして、適格販売により収入を得ています。これらのリンクをクリックすると、各社のサイトでCookie等が利用されることがあります。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              お問い合わせについて
            </Typography>
            <Typography variant="body1">
              本サービス・本ポリシーに関するお問い合わせは
              <Button component={RouterLink} to="/contact" size="small" sx={{ mx: 0.5, verticalAlign: "baseline" }}>
                お問い合わせページ
              </Button>
              よりご連絡ください。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              プライバシーポリシーの変更について
            </Typography>
            <Typography variant="body1">
              本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、利用者に通知することなく、変更することができるものとします。変更後のプライバシーポリシーは、本ページに掲載したときから効力を生じるものとします。
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary">
            制定日: 2026年9月16日
          </Typography>
        </Stack>

        <Footer />
      </Container>
    </Box>
  );
}

export default PrivacyPolicyPage;
