import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import SendIcon from "@mui/icons-material/Send";
import { api } from "../api";
import type { VisibleChat } from "../lib/usePlayChat";

// Chat lines laid over the bottom-left of the /play video area. Ignores
// pointer events so it never blocks the like/bad buttons underneath.
export function PlayChatOverlay({ lines }: { lines: VisibleChat[] }) {
  if (lines.length === 0) return null;
  return (
    <Stack
      spacing={0.5}
      sx={{
        position: "absolute",
        left: { xs: 8, sm: 16 },
        bottom: { xs: 8, sm: 16 },
        maxWidth: { xs: "calc(100% - 16px)", md: "55%" },
        zIndex: 5,
        pointerEvents: "none",
        alignItems: "flex-start",
      }}
    >
      {lines.map((l) => (
        <Box
          key={l.id}
          sx={{
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            bgcolor: "rgba(0, 0, 0, 0.7)",
            color: "#fff",
            fontSize: "0.95rem",
            wordBreak: "break-word",
          }}
        >
          {l.text}
        </Box>
      ))}
    </Stack>
  );
}

// One-row message box: メッセージ + 送信.
export function PlayChatForm({ onSent }: { onSent: () => void }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      await api.sendChat(body);
      setText("");
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack direction="row" spacing={1}>
        <TextField
          label="メッセージ"
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
          size="small"
          error={error !== null}
          helperText={error ?? undefined}
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />
        <Button
          type="submit"
          variant="contained"
          startIcon={<SendIcon />}
          disabled={sending || !text.trim()}
          sx={{ whiteSpace: "nowrap", flexShrink: 0, alignSelf: "flex-start" }}
        >
          送信
        </Button>
      </Stack>
    </Box>
  );
}
