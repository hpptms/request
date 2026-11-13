import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/material/Link";
import { ContentPageLayout } from "../components/ContentPageLayout";
import { useAccount } from "../lib/account";
import { SELLER, sellerInfoReady } from "../lib/sellerInfo";
import { useSeo } from "../lib/useSeo";

const DISCLOSE_ON_REQUEST = "請求があった場合には遅滞なく開示いたします。";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "180px 1fr" },
        gap: { xs: 0.5, sm: 2 },
        py: 1.5,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Typography component="dt" variant="body2" sx={{ fontWeight: "bold" }}>
        {label}
      </Typography>
      <Typography component="dd" variant="body1" sx={{ m: 0, lineHeight: 1.8, whiteSpace: "pre-line" }}>
        {children}
      </Typography>
    </Box>
  );
}

// 特定商取引法に基づく表記 (/tokushoho)。サポーター プラン(有料)の販売に
// 必要な表記で、会員機能がONのとき(AppConfig.membershipEnabled)だけ
// 表示する。事業者情報は lib/sellerInfo.ts。
function TokushohoPage() {
  const account = useAccount();
  const ready = account.status === "ready" && sellerInfoReady();
  useSeo(
    "特定商取引法に基づく表記 | 動画リクエストキュー",
    "動画リクエストキューのサポーター プランに関する特定商取引法に基づく表記です。",
    "/tokushoho",
    { noindex: !ready },
  );

  if (account.status === "loading") {
    return (
      <ContentPageLayout title="特定商取引法に基づく表記">
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      </ContentPageLayout>
    );
  }
  if (!ready) {
    return (
      <ContentPageLayout title="特定商取引法に基づく表記">
        <Typography variant="body1">現在準備中です。</Typography>
      </ContentPageLayout>
    );
  }

  return (
    <ContentPageLayout title="特定商取引法に基づく表記">
      <Box component="dl" sx={{ m: 0, borderTop: 1, borderColor: "divider" }}>
        <Row label="販売事業者名">{SELLER.name}</Row>
        {SELLER.representative && <Row label="運営統括責任者">{SELLER.representative}</Row>}
        <Row label="所在地">{SELLER.address || DISCLOSE_ON_REQUEST}</Row>
        <Row label="電話番号">{SELLER.phone || DISCLOSE_ON_REQUEST}</Row>
        <Row label="連絡先">
          {SELLER.email ? `${SELLER.email}\n` : ""}
          <Link component={RouterLink} to="/contact">
            お問い合わせページ
          </Link>
        </Row>
        <Row label="販売価格">request.tokyo サポーター プラン　月額200円（税込）</Row>
        <Row label="商品代金以外の必要料金">インターネット接続に必要な通信料はお客様のご負担となります。</Row>
        <Row label="支払方法">クレジットカード等（Stripeの決済ページでのお支払い）</Row>
        <Row label="支払時期">お申し込み時に初回分をお支払いいただき、以降は毎月同じ日に自動で更新・請求されます。</Row>
        <Row label="サービスの提供時期">お支払いの完了後、直ちにご利用いただけます。</Row>
        <Row label="解約について">
          {"アカウントページの「プランの管理」からいつでも解約できます。解約後も、お支払い済みの期間の終了日まではご利用いただけます。"}
        </Row>
        <Row label="返品・返金について">
          {"サービスの性質上、お支払い後の返金はいたしかねます。ただし、当サイトの不具合によりサービスを提供できなかった場合はこの限りではありません。"}
        </Row>
        <Row label="動作環境">最新版のGoogle Chrome・Safari・Microsoft Edge・Firefoxなど、一般的なWebブラウザ</Row>
      </Box>
    </ContentPageLayout>
  );
}

export default TokushohoPage;
