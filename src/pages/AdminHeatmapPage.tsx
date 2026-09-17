import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ActiveUsersMap } from "../components/ActiveUsersMap";
import { MOCK_ACTIVE_USERS } from "../lib/activeUsersHeatmap";

// アクティブユーザーヒートマップ (/admin/heatmap): 都市別のアクティブ
// ユーザー数をバブルマップで表示する。現状はダミーデータ
// (MOCK_ACTIVE_USERS — src/lib/activeUsersHeatmap.ts) 表示のみで、GA4
// Realtime Data API(市区町村単位、IP/属性は含めない)との連携は
// バックエンド側のサービスアカウント設定が済み次第つなぎ込む。
function AdminHeatmapPage() {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        現在表示中はダミーデータです。GA4連携の設定が完了次第、実データに切り替わります。
      </Typography>
      <ActiveUsersMap data={MOCK_ACTIVE_USERS} />
    </Box>
  );
}

export default AdminHeatmapPage;
