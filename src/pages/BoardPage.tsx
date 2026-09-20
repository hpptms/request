import AppBar from "@mui/material/AppBar";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import MapIcon from "@mui/icons-material/Map";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ShieldIcon from "@mui/icons-material/Shield";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { Link as RouterLink } from "react-router-dom";
import { Footer } from "../components/Footer";
import { NowPlaying } from "../components/NowPlaying";
import { QueueList } from "../components/QueueList";
import { RecentDoneList } from "../components/RecentDoneList";
import { RequestForm } from "../components/RequestForm";
import { useRequestQueue } from "../lib/useRequestQueue";
import { useSeo } from "../lib/useSeo";

const NOTICES = [
  "0,6,9,12,15,18,21時は1時間半リクエスト早送りタイムです。",
  "荒し対策のため操作が頻繁な場合自動BANされます。BANされるとリクエストが削除されます。",
  "自動BANは特定のタイミングで解除されます。",
  "キューが50件を超えている間は、1人1曲までのリクエストとなります。",
];

const RECENT_CHANGES = ["badを可視化出来なくしました", "再生が終わった直近5曲にもいいね・badできるようにしました"];

function BoardPage() {
  const theme = useTheme();
  // Icon-only nav buttons below this width: four labeled buttons (再生/
  // 集計/ヒートマップ/管理者) plus the title don't fit a phone-width
  // Toolbar and were overflowing it horizontally.
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useSeo(
    "動画リクエストキュー",
    "YouTube・ニコニコ動画・Vimeoの動画をみんなでリクエストして再生できる視聴者参加型のキューサービス。いいね・bad投票でリクエストの再生順が変わります。",
    "/",
  );

  const {
    cancelVoteTiers,
    fastForwardActive,
    fastForwardCancelVoteTiers,
    likePriorityThreshold,
    errorMessage,
    setErrorMessage,
    isAdmin,
    nowPlaying,
    pending,
    recentDone,
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
              aria-label={isMobile ? "再生" : undefined}
              startIcon={isMobile ? undefined : <PlayCircleIcon />}
              sx={{ whiteSpace: "nowrap", minWidth: 0, px: isMobile ? 1 : 2 }}
            >
              {isMobile ? <PlayCircleIcon fontSize="small" /> : "再生"}
            </Button>
            <Button
              component={RouterLink}
              to="/stats"
              size="small"
              aria-label={isMobile ? "集計" : undefined}
              startIcon={isMobile ? undefined : <LeaderboardIcon />}
              sx={{ whiteSpace: "nowrap", minWidth: 0, px: isMobile ? 1 : 2 }}
            >
              {isMobile ? <LeaderboardIcon fontSize="small" /> : "集計"}
            </Button>
            <Button
              component={RouterLink}
              to="/heatmap"
              size="small"
              aria-label={isMobile ? "ヒートマップ" : undefined}
              startIcon={isMobile ? undefined : <MapIcon />}
              sx={{ whiteSpace: "nowrap", minWidth: 0, px: isMobile ? 1 : 2 }}
            >
              {isMobile ? <MapIcon fontSize="small" /> : "ヒートマップ"}
            </Button>
            <Button
              component="a"
              href="/admin"
              target="_blank"
              rel="noopener"
              size="small"
              aria-label={isMobile ? "管理者" : undefined}
              startIcon={isMobile ? undefined : <ShieldIcon />}
              endIcon={isMobile ? undefined : <OpenInNewIcon />}
              sx={{ whiteSpace: "nowrap", minWidth: 0, px: isMobile ? 1 : 2 }}
            >
              {isMobile ? <ShieldIcon fontSize="small" /> : "管理者"}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
            <Stack spacing={1}>
              {NOTICES.map((text) => (
                <Typography key={text} variant="body2">
                  {text}
                </Typography>
              ))}
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              直近の変更
            </Typography>
            <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
              {RECENT_CHANGES.map((text) => (
                <Typography key={text} component="li" variant="body2" color="text.secondary">
                  {text}
                </Typography>
              ))}
            </Stack>
          </Paper>
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
              likePriorityThreshold={likePriorityThreshold}
              isAdmin={isAdmin}
              onPlay={handlePlay}
              onDelete={handleDelete}
              onVoteCancel={handleVoteCancel}
              onLike={handleLike}
              onCancelMine={handleCancelMine}
            />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              再生が終わった動画
            </Typography>
            <RecentDoneList requests={recentDone} onVoteCancel={handleVoteCancel} onLike={handleLike} />
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
