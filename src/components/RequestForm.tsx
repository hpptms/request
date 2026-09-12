import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import TimerIcon from "@mui/icons-material/Timer";

interface Props {
  onSubmit: (url: string, twoMinuteRequest: boolean) => Promise<void>;
}

export function RequestForm({ onSubmit }: Props) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (twoMinuteRequest: boolean) => {
    if (!url.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(url.trim(), twoMinuteRequest);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "リクエストの追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(false);
  };

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" gutterBottom>
        動画をリクエストする
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="動画のURL"
            placeholder="YouTube・ニコニコ動画・Vimeo のURL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            required
            size="small"
          />
          <Stack direction="row" spacing={1}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<AddCircleIcon />}
              disabled={submitting || !url.trim()}
              sx={{ whiteSpace: "nowrap", flex: 1 }}
            >
              リクエスト
            </Button>
            <Button
              type="button"
              variant="outlined"
              startIcon={<TimerIcon />}
              disabled={submitting || !url.trim()}
              onClick={() => submit(true)}
              sx={{ whiteSpace: "nowrap", flex: 1 }}
            >
              2分でリクエスト
            </Button>
          </Stack>
        </Stack>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
}
