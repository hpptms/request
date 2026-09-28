import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import SendIcon from "@mui/icons-material/Send";
import { api } from "../api";
import { useTodayTheme } from "../lib/useTodayTheme";

// Mirrors backend theme.MaxTextRunes.
const MAX_LENGTH = 40;

// 今日のテーマの表示と、テーマの提案フォーム。提案は管理者が承認すると
// 抽選の対象になる(backend/internal/theme)。フォームは普段は畳んでおく。
export function TodayThemeBox() {
  const todayTheme = useTodayTheme();
  const [open, setOpen] = useState(false);
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
      await api.suggestTheme(body);
      setText("");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <LightbulbIcon sx={{ color: "#FF9A3C" }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 800, flexGrow: 1, minWidth: 0, wordBreak: "break-word" }}>
          今日のテーマ：{todayTheme ?? "準備中"}
        </Typography>
        <Button size="small" onClick={() => setOpen((v) => !v)} sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>
          {open ? "閉じる" : "テーマを提案"}
        </Button>
      </Stack>
      <Collapse in={open} unmountOnExit>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, mb: 1.5 }}>
          「今日のテーマ」にしたいお題を送ってください。管理者が承認すると、毎日のテーマ抽選の候補に入ります。
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1}>
              <TextField
                label="テーマ"
                placeholder="例: 夏に聴きたい曲"
                value={text}
                onChange={(e) => setText(e.target.value)}
                size="small"
                fullWidth
                slotProps={{ htmlInput: { maxLength: MAX_LENGTH } }}
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<SendIcon />}
                disabled={sending || !text.trim()}
                sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
              >
                提案
              </Button>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
            {sent && <Alert severity="success">提案を送信しました。承認されると抽選の候補に入ります。</Alert>}
          </Stack>
        </form>
      </Collapse>
    </Paper>
  );
}
