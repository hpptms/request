import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SendIcon from "@mui/icons-material/Send";
import { api } from "../api";

const MAX_LENGTH = 500;

// 管理者へのメッセージ欄。リクエストできなかった動画の報告などを送る。
// 返信は同じIPで次にページを開いたときに表示される(IPが変わると届かない)。
export function AdminMessageForm() {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    setSent(false);
    try {
      await api.sendInquiry(body);
      setText("");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" gutterBottom>
        管理者へメッセージ
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        この動画がリクエストできなかったなど、管理者に伝えたいことがあれば送ってください。返信がある場合は、次回このページを開いたときに表示されます(接続元のIPが変わると届かないことがあります)。
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="メッセージ"
            value={text}
            onChange={(e) => setText(e.target.value)}
            multiline
            minRows={2}
            maxRows={6}
            fullWidth
            slotProps={{ htmlInput: { maxLength: MAX_LENGTH } }}
            helperText={`${text.length}/${MAX_LENGTH}`}
          />
          {error && <Alert severity="error">{error}</Alert>}
          {sent && <Alert severity="success">送信しました。</Alert>}
          <Button type="submit" variant="contained" startIcon={<SendIcon />} disabled={sending || !text.trim()}>
            送信
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
