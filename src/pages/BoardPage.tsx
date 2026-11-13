import AppBar from "@mui/material/AppBar";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import CampaignIcon from "@mui/icons-material/Campaign";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import MapIcon from "@mui/icons-material/Map";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ShieldIcon from "@mui/icons-material/Shield";
import { cloneElement, useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Footer } from "../components/Footer";
import { FirstVisitGuide } from "../components/FirstVisitGuide";
import { AlertSettingsButton } from "../components/AlertSettingsDialog";
import { TEXT_CONTAINER_SX } from "../lib/layout";
import { NowLive } from "../components/NowLive";
import { NowPlaying } from "../components/NowPlaying";
import { QueueList } from "../components/QueueList";
import { RecentDoneList } from "../components/RecentDoneList";
import { RequestForm } from "../components/RequestForm";
import { PlanComparisonBox } from "../components/PlanComparison";
import { TodayThemeBox } from "../components/TodayThemeBox";
import { PollBox } from "../components/PollBox";
import { useRequestQueue } from "../lib/useRequestQueue";
import { usePageSeo } from "../lib/useSeo";
import { SiteLogo } from "../components/SiteLogo";

// Upper bound on how long the board waits for its first data before showing
// anyway (see boardReady below), so a slow/failed API can't blank the page.
const FIRST_LOAD_TIMEOUT_MS = 2500;

type NavMode = "icon" | "compact" | "full";

function NavButton({ to, label, icon, mode, external = false }: { to: string; label: string; icon: React.ReactElement; mode: NavMode; external?: boolean }) {
  const link = external ? { component: "a", href: to, target: "_blank", rel: "noopener" } : { component: RouterLink, to };
  return (
    <Button
      {...link}
      size="small"
      aria-label={mode === "icon" ? label : undefined}
      startIcon={mode === "icon" ? undefined : icon}
      endIcon={external && mode === "full" ? <OpenInNewIcon /> : undefined}
      sx={{ whiteSpace: "nowrap", minWidth: 0, px: mode === "full" ? 2 : 1 }}
    >
      {mode === "icon" ? cloneElement(icon, { fontSize: "small" } as object) : label}
    </Button>
  );
}

function BoardPage() {
  const theme = useTheme();
  // Icon-only nav buttons on phones: five labeled buttons plus the title
  // don't fit a phone-width Toolbar and were overflowing it horizontally.
  // Tablets in portrait (sm–md) keep the labels but drop the padding and
  // the admin link's external-link icon, which was cutting the title off.
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const navMode: NavMode = isMobile ? "icon" : isTablet ? "compact" : "full";

  usePageSeo("/");

  const {
    requestsLoaded,
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
    handleSuberu,
  } = useRequestQueue("board");

  // NowLive, NowPlaying, TodayThemeBox and PollBox each change height once
  // their first fetch lands, which pushed the request form below them down
  // after it was already on screen (CLS 0.27 in PageSpeed Insights). Keep
  // the board invisible — with its space reserved by minHeight — until all
  // of them have loaded, then reveal it at its final layout in one go.
  const [liveLoaded, setLiveLoaded] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [pollLoaded, setPollLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const handleLiveLoaded = useCallback(() => setLiveLoaded(true), []);
  const handleThemeLoaded = useCallback(() => setThemeLoaded(true), []);
  const handlePollLoaded = useCallback(() => setPollLoaded(true), []);
  useEffect(() => {
    const id = window.setTimeout(() => setTimedOut(true), FIRST_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, []);
  const boardReady = timedOut || (requestsLoaded && liveLoaded && themeLoaded && pollLoaded);

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <SiteLogo />
          <Typography
            variant="h6"
            component="h1"
            noWrap
            sx={{ fontSize: { xs: "1.05rem", sm: "1.25rem" }, flexGrow: 1, minWidth: 0 }}
          >
            動画リクエストキュー
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
            <NavButton to="/play" label="再生" icon={<PlayCircleIcon />} mode={navMode} />
            <NavButton to="/notice" label="お知らせ" icon={<CampaignIcon />} mode={navMode} />
            <NavButton to="/stats" label="集計" icon={<LeaderboardIcon />} mode={navMode} />
            <NavButton to="/heatmap" label="ヒートマップ" icon={<MapIcon />} mode={navMode} />
            <NavButton to="/admin" label="管理者" icon={<ShieldIcon />} mode={navMode} external />
            <AlertSettingsButton />
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={TEXT_CONTAINER_SX}>
        <Stack spacing={3} sx={{ minHeight: "100vh", visibility: boardReady ? "visible" : "hidden" }}>
          {/* Live status first, so it is on screen as soon as the page opens;
              the rules and change log are folded into one box below it. */}
          <NowLive onLoaded={handleLiveLoaded} />
          <FirstVisitGuide />
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
            onSuberu={handleSuberu}
            onCancelMine={handleCancelMine}
          />
          <TodayThemeBox onLoaded={handleThemeLoaded} />
          <PollBox onLoaded={handlePollLoaded} />
          <RequestForm onSubmit={handleCreate} />
          {/* Only while memberships are on, and not for supporters. */}
          <PlanComparisonBox />

          <Box>
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              待機中のリクエスト {pending.length > 0 && <span>({pending.length})</span>}
            </Typography>
            <QueueList
              requests={pending}
              isAdmin={isAdmin}
              onPlay={handlePlay}
              onDelete={handleDelete}
              onVoteCancel={handleVoteCancel}
              onLike={handleLike}
              onCancelMine={handleCancelMine}
            />
          </Box>

          <Box>
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              再生が終わった動画
            </Typography>
            <RecentDoneList requests={recentDone} onVoteCancel={handleVoteCancel} onLike={handleLike} onSuberu={handleSuberu} />
          </Box>
        </Stack>

        <Box component="section" sx={{ mt: 4 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            みんなで動画を同時視聴する、動画リクエストサイト
          </Typography>
          <Typography variant="body2" color="text.secondary">
            動画リクエストキューは、YouTube・ニコニコ動画・Vimeoの動画URLを送るだけで、知らない人とみんなで動画を同時視聴できる視聴者参加型のサービスです。登録は不要で、
            <Link component={RouterLink} to="/play">
              再生画面
            </Link>
            を開けばすぐに参加できます。リクエストされた動画は待機列に並び、いいねが集まると再生順が上がり、bad投票が集まると短く切り上げられます。配信やイベント、友達との動画鑑賞会などでご利用ください。
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            初めての方は
            <Link component={RouterLink} to="/guide">
              使い方ガイド
            </Link>
            と
            <Link component={RouterLink} to="/faq">
              よくある質問
            </Link>
            をご覧ください。
          </Typography>
        </Box>

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
