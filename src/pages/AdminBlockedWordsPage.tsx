import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import AdminKeywordLimitsPage from "./AdminKeywordLimitsPage";
import AdminKeywordsPage from "./AdminKeywordsPage";

// 禁止ワードタブ (/admin/keywords): 禁止ワードとセミ禁止ワードを1画面に並べる。
function AdminBlockedWordsPage() {
  return (
    <Stack spacing={4}>
      <AdminKeywordsPage />
      <Divider />
      <AdminKeywordLimitsPage />
    </Stack>
  );
}

export default AdminBlockedWordsPage;
