import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import AdminSafeIPsPage from "./AdminSafeIPsPage";
import AdminSafeWordsPage from "./AdminSafeWordsPage";

// セーフタブ (/admin/safewords): セーフワードとセーフIPを1画面に並べる。
function AdminSafeListsPage() {
  return (
    <Stack spacing={4}>
      <AdminSafeWordsPage />
      <Divider />
      <AdminSafeIPsPage />
    </Stack>
  );
}

export default AdminSafeListsPage;
