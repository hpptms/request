import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SaveIcon from "@mui/icons-material/Save";
import { api } from "../api";
import type { NowLiveItem } from "../types";

// NOW LIVE画面 (/admin/live): トップページの「NOW LIVE」欄に出す配信URLを
// プラットフォームごとに入力する。空欄のプラットフォームはトップページに
// 表示されない (backend/internal/nowlive)。
function AdminNowLivePage() {
  const [items, setItems] = useState<NowLiveItem[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apply = useCallback((next: NowLiveItem[]) => {
    setItems(next);
    setUrls(Object.fromEntries(next.map((it) => [it.key, it.url])));
  }, []);

  useEffect(() => {
    api
      .adminGetNowLive()
      .then(({ items }) => apply(items))
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました"));
  }, [apply]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaved(false);
    try {
      const { items } = await api.adminSetNowLive(urls);
      apply(items);
      setSaved(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {saved && <Alert severity="success">保存しました。</Alert>}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          NOW LIVE の配信URL
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          入力したURLだけが、トップページの「NOW LIVE」欄にボタンとして表示されます。空欄にすると、そのプラットフォームは表示されません(すべて空欄なら「NOW LIVE」欄自体が出ません)。
        </Typography>
        <Box component="form" onSubmit={handleSave}>
          <Stack spacing={2}>
            {items.map((it) => (
              <TextField
                key={it.key}
                label={it.label}
                placeholder="https://..."
                value={urls[it.key] ?? ""}
                onChange={(e) => setUrls((u) => ({ ...u, [it.key]: e.target.value }))}
                size="small"
                fullWidth
              />
            ))}
            <Box>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={items.length === 0}>
                保存
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Stack>
  );
}

export default AdminNowLivePage;
