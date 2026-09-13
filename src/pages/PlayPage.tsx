import AppBar from "@mui/material/AppBar";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ShieldIcon from "@mui/icons-material/Shield";
import { Link as RouterLink } from "react-router-dom";
import { NowPlaying } from "../components/NowPlaying";
import { QueueList } from "../components/QueueList";
import { RequestForm } from "../components/RequestForm";
import { RequestSidePlayer } from "../components/RequestSidePlayer";
import { useRequestQueue } from "../lib/useRequestQueue";
import { useSeo } from "../lib/useSeo";

// 公開の再生画面 (/play): キュー制御(シークガード・投票による短縮・終了時の
// 自動送りなど)には一切関与しない閲覧用プレイヤー(RequestSidePlayer)に、
// リクエストフォームといいね/bad投票を添えた画面。中身のデータ・操作は
// BoardPage(/)と同じ useRequestQueue を共有している。
function PlayPage() {
  useSeo(
    "再生 | 動画リクエストキュー",
    "現在再生中の動画をその場で見ながら、いいね・bad投票やリクエストができる再生画面です。",
    "/play",
  );

  const {
    requests,
    requestsLoaded,
    cancelVoteThreshold,
    cancelVoteTiers,
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
  } = useRequestQueue("play");

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <PlayCircleIcon color="primary" sx={{ mr: 1.5 }} fontSize="large" />
          <Typography variant="h6" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
            再生
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Button
              component={RouterLink}
              to="/"
              size="small"
              startIcon={<ArrowBackIcon />}
              sx={{ whiteSpace: "nowrap" }}
            >
              トップ
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
          <RequestForm onSubmit={handleCreate} />
          {requestsLoaded && <RequestSidePlayer requests={requests} />}
          <NowPlaying
            nowPlaying={nowPlaying}
            cancelVoteTiers={cancelVoteTiers}
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

export default PlayPage;
