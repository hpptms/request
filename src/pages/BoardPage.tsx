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
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import ShieldIcon from "@mui/icons-material/Shield";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { Link as RouterLink } from "react-router-dom";
import { api } from "../api";
import { NowPlaying } from "../components/NowPlaying";
import { QueueList } from "../components/QueueList";
import { RequestForm } from "../components/RequestForm";
import { trackEvent } from "../lib/analytics";
import { markMyRequest } from "../lib/myRequestStorage";
import { useSeo } from "../lib/useSeo";
import type { CancelVoteTier, VideoRequest } from "../types";

const POLL_INTERVAL_MS = 4000;
const DEFAULT_CANCEL_VOTE_THRESHOLD = 5;
const DEFAULT_LIKE_PRIORITY_THRESHOLD = 2;
// Mirrors the backend's default store.CancelVoteTiers (internal/store/store.go)
// until the real config loads. Only the first tier's capSeconds is actually
// shown here (see NowPlaying's vote button).
const DEFAULT_CANCEL_VOTE_TIERS: CancelVoteTier[] = [{ votes: 5, capSeconds: 120 }];

function BoardPage() {
  useSeo(
    "動画リクエストキュー",
    "YouTube・ニコニコ動画・Vimeoの動画をみんなでリクエストして再生できる視聴者参加型のキューサービス。いいね・bad投票でリクエストの再生順が変わります。",
    "/",
  );

  const [requests, setRequests] = useState<VideoRequest[]>([]);
  const [cancelVoteThreshold, setCancelVoteThreshold] = useState(DEFAULT_CANCEL_VOTE_THRESHOLD);
  const [cancelVoteTiers, setCancelVoteTiers] = useState<CancelVoteTier[]>(DEFAULT_CANCEL_VOTE_TIERS);
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
        setCancelVoteTiers(config.cancelVoteTiers);
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
    const created = await api.createRequest(url, "");
    markMyRequest(created.id);
    trackEvent("video_request_submit", {
      request_id: created.id,
      platform: created.platform,
      source: "board",
    });
    await refresh();
  };

  const handleCancelMine = async (id: string) => {
    try {
      await api.cancelMyRequest(id);
      trackEvent("video_request_cancel_mine", { request_id: id, source: "board" });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "キャンセルに失敗しました");
    }
  };

  const handlePlay = async (id: string) => {
    try {
      await api.playRequest(id);
      trackEvent("video_request_admin_play", { request_id: id });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  const handleDone = async (id: string) => {
    try {
      await api.doneRequest(id);
      trackEvent("video_request_admin_done", { request_id: id });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRequest(id);
      trackEvent("video_request_admin_delete", { request_id: id });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  const handleVoteCancel = async (id: string) => {
    try {
      const result = await api.voteCancel(id);
      trackEvent("video_request_bad_vote", {
        request_id: id,
        vote_count: result.voteCount,
        source: "board",
      });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "投票に失敗しました");
    }
  };

  const handleLike = async (id: string) => {
    try {
      const result = await api.likeRequest(id);
      trackEvent("video_request_like", {
        request_id: id,
        like_count: result.likeCount,
        source: "board",
      });
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
              component={RouterLink}
              to="/report"
              size="small"
              startIcon={<QueryStatsIcon />}
              sx={{ whiteSpace: "nowrap" }}
            >
              レポート
            </Button>
            <Button
              component={RouterLink}
              to="/stats"
              size="small"
              startIcon={<LeaderboardIcon />}
              sx={{ whiteSpace: "nowrap" }}
            >
              集計
            </Button>
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
            {"AMPMの0,3,6,9時は1時間半リクエスト早送りタイムです。\n" +
              "荒し対策のため操作が頻繁な場合自動BANされます。BANされるとリクエストが削除されます。\n" +
              "自動BANは特定のタイミングで解除されます。"}
          </Typography>
          <RequestForm onSubmit={handleCreate} />
          <NowPlaying
            nowPlaying={nowPlaying}
            cancelVoteThreshold={cancelVoteThreshold}
            firstTierCapSeconds={cancelVoteTiers[0]?.capSeconds ?? DEFAULT_CANCEL_VOTE_TIERS[0].capSeconds}
            likePriorityThreshold={likePriorityThreshold}
            isAdmin={isAdmin}
            onMarkDone={handleDone}
            onVoteCancel={handleVoteCancel}
            onLike={handleLike}
            onCancelMine={handleCancelMine}
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
              onCancelMine={handleCancelMine}
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
