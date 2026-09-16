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
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ShieldIcon from "@mui/icons-material/Shield";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { Link as RouterLink } from "react-router-dom";
import { Footer } from "../components/Footer";
import { NowPlaying } from "../components/NowPlaying";
import { QueueList } from "../components/QueueList";
import { RequestForm } from "../components/RequestForm";
import { useRequestQueue } from "../lib/useRequestQueue";
import { useSeo } from "../lib/useSeo";

function BoardPage() {
  useSeo(
    "動画リクエストキュー",
    "YouTube・ニコニコ動画・Vimeoの動画をみんなでリクエストして再生できる視聴者参加型のキューサービス。いいね・bad投票でリクエストの再生順が変わります。",
    "/",
  );

  const {
    cancelVoteThreshold,
    cancelVoteTiers,
    fastForwardActive,
    fastForwardCancelVoteTiers,
    likePriorityThreshold,
    errorMessage,
    setErrorMessage,
    isAdmin,
    nowPlaying,
    pending,
    handleCreate,
    handleCancelMine,
    handlePlay,
    handleDone,
    handleDelete,
    handleVoteCancel,
    handleLike,
  } = useRequestQueue("board");

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
              to="/play"
              size="small"
              startIcon={<PlayCircleIcon />}
              sx={{ whiteSpace: "nowrap" }}
            >
              再生
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
            {"0,6,9,12,15,18,21時は1時間半リクエスト早送りタイムです。\n" +
              "荒し対策のため操作が頻繁な場合自動BANされます。BANされるとリクエストが削除されます。\n" +
              "自動BANは特定のタイミングで解除されます。\n" +
              "キューが30件を超えている間は、1人1曲までのリクエストとなります。"}
          </Typography>
          <RequestForm onSubmit={handleCreate} />
          <NowPlaying
            nowPlaying={nowPlaying}
            cancelVoteTiers={cancelVoteTiers}
            fastForwardActive={fastForwardActive}
            fastForwardCancelVoteTiers={fastForwardCancelVoteTiers}
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

        <Footer />
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
