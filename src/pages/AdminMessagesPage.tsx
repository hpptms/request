import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import { api } from "../api";
import type { InquiryThread } from "../types";

// メッセージ画面 (/admin/messages): 訪問者から届いたメッセージをIPごとのスレッド
// で表示し、そのIPに返信できる。返信は同じIPのブラウザが次にページを開いたときに
// 表示される (backend/internal/inquiry)。IPが変わった相手には届かない。
function AdminMessagesPage() {
  const [threads, setThreads] = useState<InquiryThread[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { threads } = await api.adminListInquiries();
      setThreads(threads);
      // Opening the tab counts as reading: clear the unread markers on the
      // server, but keep showing them in this render.
      threads.filter((t) => t.unread > 0).forEach((t) => api.adminReadInquiry(t.ip).catch(() => {}));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました");
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleReply = async (ip: string) => {
    const text = (drafts[ip] ?? "").trim();
    if (!text) return;
    try {
      await api.adminReplyInquiry(ip, text);
      setDrafts((d) => ({ ...d, [ip]: "" }));
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "返信に失敗しました");
    }
  };

  const handleDelete = async (ip: string) => {
    try {
      await api.adminDeleteInquiry(ip);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      <Typography variant="body2" color="text.secondary">
        返信は、同じIPのブラウザが次にページを開いたときに表示されます。IPが変わった相手には届きません。メッセージは30日で、10日以上表示されなかった(届かなかった)返信は10日で自動的に削除されます。
      </Typography>

      {threads.length === 0 ? (
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
          <Typography color="text.secondary">メッセージはありません</Typography>
        </Paper>
      ) : (
        threads.map((t) => (
          <Paper key={t.ip} elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: "center" }}>
              <Typography variant="subtitle1" sx={{ fontFamily: "monospace", flexGrow: 1, wordBreak: "break-all" }}>
                {t.ip}
              </Typography>
              {t.unread > 0 && <Chip size="small" color="error" label={`未読 ${t.unread}`} />}
              <Tooltip title="このスレッドを削除">
                <IconButton size="small" onClick={() => handleDelete(t.ip)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Stack spacing={1} sx={{ mb: 2 }}>
              {t.messages.map((m) => (
                <Box
                  key={m.id}
                  sx={{
                    alignSelf: m.fromAdmin ? "flex-end" : "flex-start",
                    maxWidth: "90%",
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: m.fromAdmin ? "primary.dark" : "action.hover",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {m.fromAdmin ? "管理者" : "訪問者"} ・ {new Date(m.createdAt).toLocaleString("ja-JP")}
                    {m.fromAdmin && (m.seen ? " ・ 表示済み" : " ・ 未表示")}
                  </Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.text}</Typography>
                </Box>
              ))}
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "flex-start" } }}>
              <TextField
                label="返信"
                size="small"
                fullWidth
                multiline
                maxRows={5}
                value={drafts[t.ip] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [t.ip]: e.target.value }))}
                slotProps={{ htmlInput: { maxLength: 500 } }}
              />
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                disabled={!(drafts[t.ip] ?? "").trim()}
                onClick={() => handleReply(t.ip)}
                sx={{ whiteSpace: "nowrap" }}
              >
                返信
              </Button>
            </Stack>
          </Paper>
        ))
      )}
    </Stack>
  );
}

export default AdminMessagesPage;
