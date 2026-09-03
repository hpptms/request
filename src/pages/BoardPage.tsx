import { useCallback, useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShieldIcon from "@mui/icons-material/Shield";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { api } from "../api";
import { NowPlaying } from "../components/NowPlaying";
import { QueueList } from "../components/QueueList";
import { RequestForm } from "../components/RequestForm";
import type { VideoRequest } from "../types";

const POLL_INTERVAL_MS = 4000;
const DEFAULT_CANCEL_VOTE_THRESHOLD = 10;
const DEFAULT_LIKE_PRIORITY_THRESHOLD = 2;

function BoardPage() {
  const [requests, setRequests] = useState<VideoRequest[]>([]);
  const [cancelVoteThreshold, setCancelVoteThreshold] = useState(DEFAULT_CANCEL_VOTE_THRESHOLD);
  const [likePriorityThreshold, setLikePriorityThreshold] = useState(DEFAULT_LIKE_PRIORITY_THRESHOLD);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.listRequests();
      setRequests(data);
    } catch {
      // Silently keep the last known state; the next poll will retry.
    }
  }, []);

  useEffect(() => {
    api
      .getConfig()
      .then((config) => {
        setCancelVoteThreshold(config.cancelVoteThreshold);
        setLikePriorityThreshold(config.likePriorityThreshold);
      })
      .catch(() => {});
    api.adminSession().then((session) => setIsAdmin(session.authenticated)).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleCreate = async (url: string) => {
    await api.createRequest(url, "");
    await refresh();
  };

  const handlePlay = async (id: string) => {
    try {
      await api.playRequest(id);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  const handleDone = async (id: string) => {
    try {
      await api.doneRequest(id);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRequest(id);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  const handleVoteCancel = async (id: string) => {
    try {
      await api.voteCancel(id);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "投票に失敗しました");
    }
  };

  const handleLike = async (id: string) => {
    try {
      await api.likeRequest(id);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "いいねに失敗しました");
    }
  };

  const nowPlaying = requests.find((r) => r.status === "playing") ?? null;
  const pending = requests.filter((r) => r.status === "pending");

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <YouTubeIcon color="primary" sx={{ mr: 1.5 }} fontSize="large" />
          <Typography
            variant="h6"
            component="h1"
            noWrap
            sx={{ fontSize: { xs: "1.05rem", sm: "1.25rem" }, flexGrow: 1, minWidth: 0 }}
          >
            動画リクエストキュー
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Button
              component="a"
              href="/admin"
              target="_blank"
              rel="noopener"
              size="small"
              startIcon={<ShieldIcon />}
              endIcon={<OpenInNewIcon />}
              sx={{ whiteSpace: "nowrap" }}
            >
              管理者
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Stack spacing={3}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "pre-line" }}
          >
            {"6時と12時はリクエスト早送りタイムです。\n" +
              "荒し対策のため操作が頻繁な場合自動BANされます。BANされるとリクエストが削除されます。\n" +
              "自動BANは特定のタイミングで解除されます。"}
          </Typography>
          <RequestForm onSubmit={handleCreate} />
          <NowPlaying
            nowPlaying={nowPlaying}
            cancelVoteThreshold={cancelVoteThreshold}
            isAdmin={isAdmin}
            onMarkDone={handleDone}
            onVoteCancel={handleVoteCancel}
          />

          <Box>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              待機中のリクエスト {pending.length > 0 && `(${pending.length})`}
            </Typography>
            <QueueList
              requests={pending}
              cancelVoteThreshold={cancelVoteThreshold}
              likePriorityThreshold={likePriorityThreshold}
              isAdmin={isAdmin}
              onPlay={handlePlay}
              onDelete={handleDelete}
              onVoteCancel={handleVoteCancel}
              onLike={handleLike}
            />
          </Box>
        </Stack>
      </Container>

      <Snackbar
        open={errorMessage !== null}
        autoHideDuration={4000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default BoardPage;
