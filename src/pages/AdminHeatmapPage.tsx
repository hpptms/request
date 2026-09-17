import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ActiveUsersMap } from "../components/ActiveUsersMap";
import { useActiveUsersHeatmap } from "../lib/useActiveUsersHeatmap";

// アクティブユーザーヒートマップ (/admin/heatmap): 都市別のアクティブ
// ユーザー数をバブルマップで表示する。GET /api/heatmap(GA4 Realtime、
// 市区町村単位・IP/属性は含めない)を1分間隔でポーリングし、バックエンド
// にGA4未設定/未取得の間はダミーデータで表示する — 詳細は
// src/lib/useActiveUsersHeatmap.ts。
function AdminHeatmapPage() {
  const { data, isMock } = useActiveUsersHeatmap();
  return (
    <Box>
      {isMock && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          現在表示中はダミーデータです。GA4連携の設定が完了次第、実データに切り替わります。
        </Typography>
      )}
      <ActiveUsersMap data={data} />
    </Box>
  );
}

export default AdminHeatmapPage;
