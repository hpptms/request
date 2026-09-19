import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import { api } from "../api";
import type { VideoRequest } from "../types";
import { formatDuration } from "../lib/formatDuration";

// 割り込みリクエスト画面 (/admin/interrupt): テスト用に、同じ動画の
// クールダウン(VideoCooldown)を無視してリクエストし、待機列の先頭(今の
// 再生の次)へ入れる。バックエンドは管理者セッションがない adminInterrupt を
// 403で拒否するので、一般ユーザーはこの機能を使えない
// (backend/internal/api handleCreateRequest)。
function AdminInterruptPage() {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<VideoRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    setCreated(null);
    try {
      setCreated(await api.adminInterruptRequest(trimmed));
      setUrl("");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "リクエストに失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          割り込みリクエスト
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          同じ動画の再リクエスト制限(クールダウン)を無視して登録し、今再生中の動画の次に再生します。テスト用の管理者専用機能です。
          動画URLの開始位置(t=・start=・from=)と終了位置(end=)も反映されます。
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="動画のURL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              size="small"
              fullWidth
              placeholder="https://www.youtube.com/watch?v=...&t=155s&end=376s"
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={<PlaylistAddIcon />}
              disabled={submitting || url.trim() === ""}
              sx={{ whiteSpace: "nowrap" }}
            >
              割り込み登録
            </Button>
          </Stack>
        </Box>
      </Paper>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {created && (
        <Alert severity="success">
          次の再生に登録しました: {created.title}
          {created.startSeconds ? ` / 開始 ${formatDuration(created.startSeconds)}` : ""}
          {created.endSeconds ? ` / 終了 ${formatDuration(created.endSeconds)}` : ""}
        </Alert>
      )}
    </Stack>
  );
}

export default AdminInterruptPage;
