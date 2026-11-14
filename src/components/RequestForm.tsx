import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import TimerIcon from "@mui/icons-material/Timer";
import { RequestSubmittedPanel } from "./RequestSubmittedPanel";
import type { VideoRequest } from "../types";
import { refreshAccount, useAccount, type AccountState } from "../lib/account";

// Mirrors backend api.maxRequesterNameLen.
const MAX_NAME_LENGTH = 30;
// The name is remembered per browser so regulars don't retype it.
const NAME_STORAGE_KEY = "requesterName";

function loadSavedName(): string {
  try {
    return localStorage.getItem(NAME_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveName(name: string) {
  try {
    if (name) localStorage.setItem(NAME_STORAGE_KEY, name);
    else localStorage.removeItem(NAME_STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode etc.) — just don't remember it.
  }
}

interface Props {
  // requesterName is optional ("" when left blank) and shown on the player.
  onSubmit: (url: string, requesterName: string, twoMinuteRequest: boolean) => Promise<VideoRequest | void>;
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

// One line on the visitor's plan limits, linking to /account — only while
// memberships are switched on (see lib/account.ts).
function PlanNote({ account }: { account: AccountState }) {
  if (account.status !== "ready") return null;
  const { me } = account;
  const text =
    me.user?.plan === "supporter"
      ? `サポーター プラン: キューに${me.supporterMaxPending}曲まで`
      : me.freeRequestWaitSeconds > 0
        ? `無料プラン: 次のリクエストまであと${Math.ceil(me.freeRequestWaitSeconds / 60)}分`
        : `無料プラン: リクエストは${me.freeRequestIntervalMinutes / 60}時間に1回・キューに${me.freeMaxPending ?? 1}曲まで`;
  return (
    <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
      {text}
      {" ・ "}
      <Link component={RouterLink} to="/account">
        {me.user?.plan === "supporter" ? "アカウント" : "サポーター プランについて"}
      </Link>
    </Typography>
  );
}

export function RequestForm({ onSubmit, inline = false }: Props) {
  const account = useAccount();
  const [url, setUrl] = useState("");
  const [name, setName] = useState(loadSavedName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<VideoRequest | null>(null);

  const submit = async (twoMinuteRequest: boolean) => {
    if (!url.trim()) return;

    setSubmitting(true);
    setError(null);
    setSubmitted(null);
    try {
      const trimmedName = name.trim();
      saveName(trimmedName);
      const created = await onSubmit(url.trim(), trimmedName, twoMinuteRequest);
      setUrl("");
      if (created) setSubmitted(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "リクエストの追加に失敗しました");
    } finally {
      // The free-plan wait shown in PlanNote may have changed.
      if (account.status === "ready") void refreshAccount();
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
  const nameField = (
    <TextField
      label="名前（未入力の場合は表示されません）"
      value={name}
      onChange={(e) => setName(e.target.value)}
      fullWidth
      size="small"
      slotProps={{ htmlInput: { maxLength: MAX_NAME_LENGTH } }}
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

  const submittedPanel = submitted && (
    <RequestSubmittedPanel request={submitted} onClose={() => setSubmitted(null)} compact={inline} />
  );

  if (inline) {
    return (
      <Box component="form" onSubmit={handleSubmit}>
        {/* Below sm the name drops to its own second row (order + 100% basis) so the URL field keeps its width; sm+ stays one row. */}
        <Box sx={{ display: "flex", flexWrap: { xs: "wrap", sm: "nowrap" }, gap: 1 }}>
          <Box sx={{ order: { xs: 1, sm: 0 }, flex: { xs: "1 1 100%", sm: "0 1 140px" }, minWidth: { sm: 72 } }}>
            {nameField}
          </Box>
          <Box sx={{ flex: "1 1 0", minWidth: 0 }}>{urlField}</Box>
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            {requestButton}
            {twoMinuteButton}
          </Stack>
        </Box>
        {errorAlert}
        {error && <PlanNote account={account} />}
        {submittedPanel}
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" component="h2" gutterBottom>
        動画をリクエストする
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {urlField}
          {nameField}
          <Stack direction="row" spacing={1}>
            {requestButton}
            {twoMinuteButton}
          </Stack>
        </Stack>
      </Box>
      {errorAlert}
      <PlanNote account={account} />
      {submittedPanel}
    </Paper>
  );
}
