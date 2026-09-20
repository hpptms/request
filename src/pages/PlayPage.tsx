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
import ShieldIcon from "@mui/icons-material/Shield";
import { Link as RouterLink } from "react-router-dom";
import { PlayChatForm, PlayChatOverlay } from "../components/PlayChat";
import { QueueList } from "../components/QueueList";
import { RequestForm } from "../components/RequestForm";
import { RequestSidePlayer } from "../components/RequestSidePlayer";
import { LANDSCAPE_PHONE } from "../lib/layout";
import { usePlayChat } from "../lib/usePlayChat";
import { useRequestQueue } from "../lib/useRequestQueue";
import { useSeo } from "../lib/useSeo";
import { SiteLogo } from "../components/SiteLogo";

// 公開の再生画面 (/play): キュー制御(シークガード・投票による短縮・終了時の
// 自動送りなど)には一切関与しない閲覧用プレイヤー(RequestSidePlayer)を
// 画面の主役として最大限大きく表示し、右(狭い画面では下)に待機中の
// キュー、下部にリクエスト投稿欄を置く。いいね/bad投票は動画の上に
// 直接重ねたボタンから行う。中身のデータ・操作はBoardPage(/)と同じ
// useRequestQueue を共有している。
function PlayPage() {
  useSeo(
    "みんなで一緒に動画を見る 再生画面 | 動画リクエストキュー",
    "リクエストされた動画をみんなで一緒に見られる再生画面です。現在再生中の動画をその場で見ながら、いいね・bad投票や動画リクエストができます。",
    "/play",
  );

  const {
    requests,
    requestsLoaded,
    cancelVoteTiers,
    fastForwardActive,
    fastForwardCapSeconds,
    fastForwardCancelVoteTiers,
    likePriorityThreshold,
    errorMessage,
    setErrorMessage,
    isAdmin,
    pending,
    handleCreate,
    handleCancelMine,
    handlePlay,
    handleDelete,
    handleVoteCancel,
    handleLike,
  } = useRequestQueue("play");

  const { lines: chatLines, poll: pollChat } = usePlayChat();

  return (
    <>
      <Box
        sx={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          // Landscape on a notched phone puts the notch to one side instead
          // of the top — pad it out of the way of the AppBar/video/form.
          pl: "env(safe-area-inset-left)",
          pr: "env(safe-area-inset-right)",
        }}
      >
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
          <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
            <SiteLogo />
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
                sx={{ whiteSpace: "nowrap", display: { xs: "none", sm: "inline-flex" } }}
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
                sx={{ whiteSpace: "nowrap", display: { xs: "none", sm: "inline-flex" } }}
              >
                管理者
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Video (maximized) + queue: side by side from md up, stacked (video
            on top, queue scrolling below it) on narrower screens where there's
            no room for a real sidebar. */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            overflowY: { xs: "auto", md: "hidden" },
            [LANDSCAPE_PHONE]: { flexDirection: "row", overflowY: "hidden" },
          }}
        >
          <Box
            sx={{
              position: "relative",
              flex: { md: "3 1 0%" },
              minWidth: 0,
              flexShrink: 0,
              [LANDSCAPE_PHONE]: { flex: "3 1 0%", flexShrink: 1 },
            }}
          >
            {requestsLoaded && (
              <RequestSidePlayer
                requests={requests}
                likePriorityThreshold={likePriorityThreshold}
                cancelVoteTiers={cancelVoteTiers}
                fastForwardActive={fastForwardActive}
                fastForwardCancelVoteTiers={fastForwardCancelVoteTiers}
                fastForwardCapSeconds={fastForwardCapSeconds}
                onLike={handleLike}
                onVoteCancel={handleVoteCancel}
              />
            )}
            <PlayChatOverlay lines={chatLines} />
          </Box>

          <Box
            sx={{
              flex: { md: "1 1 340px" },
              width: { md: 340 },
              [LANDSCAPE_PHONE]: { flex: "1 1 240px", width: 240, overflowY: "auto" },
              flexShrink: 0,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflowY: { md: "auto" },
              p: { xs: 1.5, sm: 2 },
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
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
        </Box>

        {/* Request form, pinned to the bottom of the screen. The extra
            safe-area padding keeps it clear of an iPhone's home indicator,
            which otherwise overlaps content sitting flush with the true
            bottom edge of a 100dvh layout. */}
        <Box
          sx={{
            flexShrink: 0,
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            p: { xs: 1, sm: 2 },
            pb: { xs: "calc(8px + env(safe-area-inset-bottom))", sm: 2 },
          }}
        >
          {/* Two compact rows (request, then message). */}
          <Stack spacing={1}>
            <RequestForm onSubmit={handleCreate} inline />
            <PlayChatForm onSent={pollChat} />
          </Stack>
        </Box>

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

      {/* Below the fold of the fixed-height screen above: not needed to use
          the page, but gives crawlers (and anyone who scrolls) real on-page
          text describing what this screen does, matching useSeo's
          description instead of leaving this page's only text content as
          nav labels and dynamically-loaded queue titles. */}
      <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Typography variant="body2" color="text.secondary">
          今まさに再生中の動画をその場で見ながら、いいね・bad投票で再生順に反映したり、新しい動画をリクエストできます。待機中のリクエストもここから確認・投票できます。
        </Typography>
      </Container>
    </>
  );
}

export default PlayPage;
