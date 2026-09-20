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
  // Compact single-row layout (URL, リクエスト, 2分でリクエスト side by side,
  // no card or title) for the /play screen's bottom bar. On phone widths the
  // button labels/icons shrink so it still fits one row.
  inline?: boolean;
}

// Inline (phone-friendly) buttons: sized to their label, icon dropped below
// sm, so URL + both buttons still fit one row on a ~360px screen.
const inlineButtonSx = {
  whiteSpace: "nowrap",
  minHeight: 40,
  px: { xs: 1.25, sm: 2 },
  flexShrink: 0,
  "& .MuiButton-startIcon": { display: { xs: "none", sm: "inherit" } },
} as const;

export function RequestForm({ onSubmit, inline = false }: Props) {
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

  const urlField = (
    <TextField
      label="動画のURL"
      placeholder="YouTube・ニコニコ動画・Vimeo のURL"
      value={url}
      onChange={(e) => setUrl(e.target.value)}
      fullWidth
      required
      size="small"
    />
  );
  const requestButton = (
    <Button
      type="submit"
      variant="contained"
      startIcon={<AddCircleIcon />}
      disabled={submitting || !url.trim()}
      sx={inline ? inlineButtonSx : { whiteSpace: "nowrap", flex: 1 }}
    >
      リクエスト
    </Button>
  );
  const twoMinuteButton = (
    <Button
      type="button"
      variant="outlined"
      startIcon={<TimerIcon />}
      disabled={submitting || !url.trim()}
      onClick={() => submit(true)}
      sx={inline ? inlineButtonSx : { whiteSpace: "nowrap", flex: 1 }}
    >
      2分
      <Box component="span" sx={{ display: inline ? { xs: "none", sm: "inline" } : "inline" }}>
        でリクエスト
      </Box>
    </Button>
  );
  const errorAlert = error && (
    <Alert severity="error" sx={{ mt: inline ? 1 : 2 }}>
      {error}
    </Alert>
  );

  if (inline) {
    return (
      <Box component="form" onSubmit={handleSubmit}>
        <Stack direction="row" spacing={1}>
          <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>{urlField}</Box>
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            {requestButton}
            {twoMinuteButton}
          </Stack>
        </Stack>
        {errorAlert}
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" gutterBottom>
        動画をリクエストする
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {urlField}
          <Stack direction="row" spacing={1}>
            {requestButton}
            {twoMinuteButton}
          </Stack>
        </Stack>
      </Box>
      {errorAlert}
    </Paper>
  );
}
