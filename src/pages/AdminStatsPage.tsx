import { StatsView } from "../components/StatsView";

// 集計画面 (/admin/stats): AdminPage の共通レイアウト(タブ切替・Container)に
// 乗せているだけで、中身は公開ページ(/stats, StatsPage)と共通の StatsView。
function AdminStatsPage() {
  return <StatsView />;
}

export default AdminStatsPage;
