import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Grow from "@mui/material/Grow";
import IconButton from "@mui/material/IconButton";
import Slide from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Zoom from "@mui/material/Zoom";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import { api } from "../api";
import { AdminLoginForm } from "../components/AdminLoginForm";
import { hasVoted, markVoted } from "../lib/cancelVoteStorage";
import { FALLBACK_VIDEO_IDS, pickRandomFallbackVideoId } from "../lib/fallbackPlaylist";
import { hasLiked, markLiked } from "../lib/likeStorage";
import { loadYouTubeIframeApi } from "../lib/loadYouTubeIframeApi";
import type { FallbackTrack, PlaylistTrack, VideoRequest } from "../types";

const POLL_INTERVAL_MS = 3000;
const PLAYER_ELEMENT_ID = "yt-viewer-player";
const DEFAULT_CANCEL_VOTE_THRESHOLD = 5;
const DEFAULT_CANCEL_VOTE_SEVERE_THRESHOLD = 10;
const DEFAULT_CANCEL_VOTE_SEVERE_CAP_SECONDS = 60;
const DEFAULT_LIKE_PRIORITY_THRESHOLD = 2;
const SHORTENED_PLAYBACK_SECONDS = 90; // 1:30
// Non-YouTube platforms (niconico/bilibili/vimeo) have no ended/error event
// this screen can listen for, so their queue advance is a plain timer
// instead: NON_YOUTUBE_DEFAULT_DURATION_SECONDS when the platform didn't
// report a duration (always true for bilibili — see the backend's
// bilibili package), capped at NON_YOUTUBE_MAX_DURATION_SECONDS either way
// so one long video can't hog the queue. Never allowed below
// SHORTENED_PLAYBACK_SECONDS, which mirrors the backend's default
// MinPlaybackBeforeFinish floor — otherwise the timer could fire before
// the server will actually accept finishRequest.
const NON_YOUTUBE_DEFAULT_DURATION_SECONDS = 300; // 5 min
const NON_YOUTUBE_MAX_DURATION_SECONDS = 600; // 10 min

// How long the music-program-style title card stays up when a video
// starts, and how long after that the duration badge shows.
const NOW_PLAYING_INTRO_MS = 20000;
const DURATION_BADGE_DELAY_MS = 5000;
const DURATION_BADGE_VISIBLE_MS = 3000;
const NEW_REQUEST_NOTICE_MS = 4000;
const VOTE_STATUS_VISIBLE_MS = 4000;

// niconico's embed doesn't honor a plain ?autoplay=1 query flag (confirmed
// by inspecting its server-rendered config — the flag is silently
// ignored); autoplay only works through its postMessage-based "external
// player API" (jsapi=1 in the embed URL — see the backend's niconico
// package), which requires explicitly posting a {eventName:"play"}
// command once the player has loaded. NICONICO_PLAYER_ID must match the
// playerId= the backend put in the embed URL, or the player's
// origin/playerId check silently rejects the command.
const NICONICO_ORIGIN = "https://embed.nicovideo.jp";
const NICONICO_PLAYER_ID = "recest-viewer";
// How many times (and how far apart) to (re-)send the play/unmute
// commands after the iframe's onLoad fires — the player's own JS bundle
// needs a moment to bootstrap and wire up its message listener after the
// surrounding HTML document finishes loading, so a single immediate
// attempt isn't reliable; sending "play" to an already-playing video is a
// harmless no-op.
const NICONICO_COMMAND_RETRY_DELAYS_MS = [300, 1000, 2000];

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Gatekeeper for /viewer: the actual YouTube playback only ever loads inside
// an authenticated admin session (see the OBS setup note in AuthenticatedViewerPage's
// comment below), so nobody who merely finds/guesses the URL can reach the
// live iframe and mess with playback (seeking, pausing, etc.) for everyone
// watching the stream. Requesting/liking/cancel-voting stays open to
// everyone via the public board page (/) — this gate is only about who can
// load the actual player.
function ViewerPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const { authenticated } = await api.adminSession();
      setAuthenticated(authenticated);
    } catch {
      setAuthenticated(false);
    } finally {
      setCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (checkingSession) {
    return (
      <Box sx={{ position: "fixed", inset: 0, bgcolor: "black", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "white" }} />
      </Box>
    );
  }

  return authenticated ? (
    <AuthenticatedViewerPage onSessionExpired={() => setAuthenticated(false)} />
  ) : (
    <AdminLoginForm onLoggedIn={() => setAuthenticated(true)} />
  );
}

// The OBS capture screen: video on the left (4), a live queue with cancel
// voting on the right (1), and a request bar along the bottom. It plays
// whatever the queue says is current, auto-advances when a video ends, and
// fills silence with the admin's playlist (or, failing that, a random
// fallback video) when nothing is queued.
//
// Only rendered once ViewerPage above has confirmed an admin session, so set
// OBS's Browser Source to this URL and use its "Interact" option to log in
// once — the session cookie then persists for that source.
function AuthenticatedViewerPage({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [searchParams] = useSearchParams();
  // ?solo=1 : OBSキャプチャ用に動画だけをフルサイズで表示し、キューと入力欄を隠す。
  const solo = searchParams.get("solo") === "1";
  const [requests, setRequests] = useState<VideoRequest[]>([]);
  const [cancelVoteThreshold, setCancelVoteThreshold] = useState(DEFAULT_CANCEL_VOTE_THRESHOLD);
  const [likePriorityThreshold, setLikePriorityThreshold] = useState(DEFAULT_LIKE_PRIORITY_THRESHOLD);
  const [cancelVoteSevereThreshold, setCancelVoteSevereThreshold] = useState(DEFAULT_CANCEL_VOTE_SEVERE_THRESHOLD);
  const [cancelVoteSevereCapSeconds, setCancelVoteSevereCapSeconds] = useState(DEFAULT_CANCEL_VOTE_SEVERE_CAP_SECONDS);
  // Backlog fast-forward mode (see AppConfig.fastForwardActive): re-polled
  // periodically, not just fetched once, since it's expected to flip on/off
  // while this screen stays open for hours at a time.
  const [fastForwardActive, setFastForwardActive] = useState(false);
  const [fastForwardCapSeconds, setFastForwardCapSeconds] = useState(60);
  const [started, setStarted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isFallbackPlaying, setIsFallbackPlaying] = useState(false);
  // Non-null while a non-YouTube request (niconico/bilibili/vimeo) is the
  // current target: shown as a plain <iframe> layered over the YouTube
  // player element instead of driving it. Filler (playlist/fallback) is
  // always YouTube, so this is only ever set for a real request.
  const [nonYouTubeEmbedUrl, setNonYouTubeEmbedUrl] = useState<string | null>(null);
  // Music-program-style title card, shown for NOW_PLAYING_INTRO_MS whenever
  // a new video (request or filler) starts. introContent only ever updates
  // when showing a new one — introVisible drives the Zoom pop in/out so the
  // exit animation still has the right title to fade away with.
  const [introVisible, setIntroVisible] = useState(false);
  const [introContent, setIntroContent] = useState<{ title: string; channelTitle: string } | null>(null);
  // Duration badge, shown DURATION_BADGE_VISIBLE_MS starting
  // DURATION_BADGE_DELAY_MS after a video starts (same lagging-content
  // pattern as the intro card above).
  const [durationBadgeVisible, setDurationBadgeVisible] = useState(false);
  const [durationBadgeSeconds, setDurationBadgeSeconds] = useState<number | null>(null);
  // New-request toast (feature: notify every time someone adds a request).
  // One at a time, oldest first — see enqueueNewRequestNotice.
  const [newRequestNotice, setNewRequestNotice] = useState<{ id: string; title: string } | null>(null);
  // Vote-status badge (😨 cancel votes / 😊 likes) for the currently
  // playing real request: shown as soon as it starts if it already has any
  // votes, and again every time either count goes up while it's still
  // playing — see the effect watching `requests` for lastShownVoteCountsRef.
  const [voteStatusVisible, setVoteStatusVisible] = useState(false);
  const [voteStatusContent, setVoteStatusContent] = useState<{ cancelVotes: number; likes: number } | null>(null);
  const [fallbackNowPlayingId, setFallbackNowPlayingId] = useState<string | null>(null);
  // World/Japan Top 100 tracks from the backend; empty until resolved (or
  // permanently, with no YouTube API key configured), in which case the
  // static FALLBACK_VIDEO_IDS list below is used instead.
  const [fallbackTracks, setFallbackTracks] = useState<FallbackTrack[]>([]);
  // Admin-curated playlist (see AdminPage's PlaylistManagement): a plain,
  // ordered list of videos that takes priority over the World/Japan Top 100
  // fallback above whenever it's non-empty.
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);

  const playerRef = useRef<YT.Player | null>(null);
  const loadedVideoIdRef = useRef<string | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);
  const endedHandledRef = useRef(false);
  const claimedIdsRef = useRef<Set<string>>(new Set());
  // Mirrors fallbackTracks for the player event handlers below, which are
  // wired up once (see the `started`-only effect) and would otherwise close
  // over a stale empty list.
  const fallbackPoolRef = useRef<string[]>(FALLBACK_VIDEO_IDS);
  // Mirrors playlistTracks, for the same reason as fallbackPoolRef.
  const playlistPoolRef = useRef<PlaylistTrack[]>([]);
  // Which playlist track is "up next": preserved across interruptions so a
  // request pausing the playlist and finishing doesn't restart it from the
  // top. Cleared back to 0 only when a track finishes naturally.
  const playlistIndexRef = useRef(0);
  // How many seconds into the current playlist track playback was paused at
  // when a request interrupted it; used to resume from that point rather
  // than replaying the track from the start.
  const playlistPositionRef = useRef(0);
  // True while the currently loaded filler video is a playlistTracks entry
  // (sequential, resumable) rather than a random fallback pick.
  const isPlaylistActiveRef = useRef(false);
  // Last known-good playback position (seconds) and when it was last
  // checked, for the seek-guard effect below to tell normal playback apart
  // from someone dragging the seek bar (or skipping ahead any other way —
  // touch gesture, OS media controls, etc.) and snap straight back.
  const expectedTimeRef = useRef(0);
  const seekGuardTickRef = useRef<number | null>(null);
  // One-shot timer standing in for a non-YouTube video's ended event (see
  // nonYouTubeEmbedUrl); cleared whenever the target changes for any
  // reason so a stale timer can't fire against whatever's playing next.
  const nonYouTubeTimerRef = useRef<number | null>(null);
  // Which platform the current non-YouTube iframe is showing (set
  // alongside nonYouTubeEmbedUrl) and a handle to the iframe element
  // itself, so sendNiconicoPlayCommand knows when/where to postMessage.
  const nonYouTubePlatformRef = useRef<string | null>(null);
  const nonYouTubeIframeRef = useRef<HTMLIFrameElement | null>(null);
  // Timers for the now-playing intro card / duration badge (see the state
  // declared above); cleared and re-armed each time a new video starts.
  const introHideTimerRef = useRef<number | null>(null);
  const durationBadgeShowTimerRef = useRef<number | null>(null);
  const durationBadgeHideTimerRef = useRef<number | null>(null);
  // New-request notice queue + whether one is currently being shown (see
  // enqueueNewRequestNotice). null after the very first poll seeds it, so
  // the existing backlog on page load doesn't fire a notice per request.
  const knownRequestIdsRef = useRef<Set<string> | null>(null);
  const newRequestQueueRef = useRef<{ id: string; title: string }[]>([]);
  const newRequestTimerRef = useRef<number | null>(null);
  // Vote-status badge bookkeeping: the last counts shown for whichever
  // request this refers to, so the watcher effect can tell "just started
  // playing" (id differs) apart from "a vote came in" (id matches, a count
  // went up) — see the effect below and showVoteStatus.
  const lastShownVoteCountsRef = useRef<{ id: string; cancelVotes: number; likes: number } | null>(null);
  const voteStatusHideTimerRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.listRequests();
      setRequests(data);

      // Notify (once each) for every request that showed up since the
      // last poll. The very first poll only seeds knownRequestIdsRef —
      // otherwise the entire pre-existing backlog would fire a notice on
      // every page load.
      const currentIds = new Set(data.map((r) => r.id));
      if (knownRequestIdsRef.current === null) {
        knownRequestIdsRef.current = currentIds;
      } else {
        const known = knownRequestIdsRef.current;
        for (const r of data) {
          if (!known.has(r.id)) {
            newRequestQueueRef.current.push({ id: r.id, title: r.title });
          }
        }
        knownRequestIdsRef.current = currentIds;
        showNextNewRequestNotice();
      }
    } catch {
      // Keep the last known state; the next poll will retry.
    }
  }, []);

  // Polled (not just fetched once) so a fast-forward window starting or
  // ending mid-session takes effect without reloading the viewer screen.
  useEffect(() => {
    const fetchConfig = () => {
      api
        .getConfig()
        .then((config) => {
          setCancelVoteThreshold(config.cancelVoteThreshold);
          setLikePriorityThreshold(config.likePriorityThreshold);
          setCancelVoteSevereThreshold(config.cancelVoteSevereThreshold);
          setCancelVoteSevereCapSeconds(config.cancelVoteSevereCapSeconds);
          setFastForwardActive(config.fastForwardActive);
          setFastForwardCapSeconds(config.fastForwardCapSeconds);
        })
        .catch(() => {});
    };
    fetchConfig();
    const interval = setInterval(fetchConfig, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api
      .getFallbackPlaylist()
      .then((tracks) => {
        if (tracks.length === 0) return;
        setFallbackTracks(tracks);
        fallbackPoolRef.current = tracks.map((t) => t.videoId);
      })
      .catch(() => {
        // Keep the static FALLBACK_VIDEO_IDS pool already in fallbackPoolRef.
      });
  }, []);

  // Poll the admin-curated playlist periodically so edits made mid-stream
  // take effect without reloading the viewer screen. If the list shrinks,
  // playlistIndexRef is clamped where it's used below.
  useEffect(() => {
    const fetchPlaylist = () => {
      api
        .getPlaylist()
        .then((tracks) => {
          setPlaylistTracks(tracks);
          playlistPoolRef.current = tracks;
        })
        .catch(() => {
          // Keep whatever playlist was last successfully fetched.
        });
    };
    fetchPlaylist();
    const interval = setInterval(fetchPlaylist, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // The admin actions below (play/done/finish) silently swallow failures so
  // a transient network blip doesn't interrupt playback — but that also
  // means a session that's gone invalid (e.g. the backend restarted, or the
  // cookie expired) fails the same way: finishRequest keeps 401ing forever,
  // and since nothing else notices, the same video just reloads from the
  // start on every natural end instead of advancing. Polling the session
  // independently catches that and drops back to the login screen instead.
  useEffect(() => {
    const interval = setInterval(() => {
      api
        .adminSession()
        .then(({ authenticated }) => {
          if (!authenticated) onSessionExpired();
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [onSessionExpired]);

  // Create the player once, after the user's tap unlocks autoplay-with-sound.
  useEffect(() => {
    if (!started) return;

    let cancelled = false;
    loadYouTubeIframeApi().then((YTApi) => {
      if (cancelled) return;
      playerRef.current = new YTApi.Player(PLAYER_ELEMENT_ID, {
        width: "100%",
        height: "100%",
        // controls/disablekb off: seeking to the end here fires the same
        // ENDED event handleEnded uses to advance the queue. iv_load_policy
        // drops the old annotations overlay; modestbranding/fs/cc_load_policy
        // trim what YouTube's own chrome would otherwise draw on top of the
        // video — though YouTube's branding requirements mean a small
        // logo watermark and (briefly, right as a video ends) its
        // related-videos end screen can't be suppressed via this API at all.
        playerVars: {
          autoplay: 1,
          rel: 0,
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0,
          cc_load_policy: 0,
        },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (event) => {
            if (event.data === YTApi.PlayerState.ENDED) {
              handleEnded();
            }
          },
          // YouTube itself refusing to play something (age restriction,
          // embedding disabled by the uploader, region lock, video
          // deleted, ...) never fires ENDED, so without this the screen
          // would just sit frozen forever. Treat it like a manual skip
          // (doneRequest, not finishRequest) since nothing actually
          // played — there's no reason to wait out
          // MinPlaybackBeforeFinish for a video that never started.
          onError: (event) => {
            console.warn("YouTube player error, skipping:", event.data);
            handleSkip();
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      setPlayerReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // Rebase the seek-guard's expected position whenever a new video is
  // intentionally loaded, so the jump to startSeconds isn't itself flagged as
  // an unauthorized seek.
  const resetSeekGuard = (startSeconds = 0) => {
    expectedTimeRef.current = startSeconds;
    seekGuardTickRef.current = null;
  };

  const clearNonYouTubeTimer = () => {
    if (nonYouTubeTimerRef.current !== null) {
      window.clearTimeout(nonYouTubeTimerRef.current);
      nonYouTubeTimerRef.current = null;
    }
  };

  const showVoteStatus = (cancelVotes: number, likes: number) => {
    if (voteStatusHideTimerRef.current !== null) window.clearTimeout(voteStatusHideTimerRef.current);
    setVoteStatusContent({ cancelVotes, likes });
    setVoteStatusVisible(true);
    voteStatusHideTimerRef.current = window.setTimeout(() => {
      setVoteStatusVisible(false);
      voteStatusHideTimerRef.current = null;
    }, VOTE_STATUS_VISIBLE_MS);
  };

  // See NICONICO_ORIGIN's comment: niconico's embed needs an explicit
  // postMessage to actually start playing (and unmute/max the volume),
  // unlike every other platform here which honors a plain autoplay=1 URL
  // flag. Called from the iframe's onLoad, with a few delayed retries.
  const sendNiconicoPlayCommand = () => {
    for (const delay of NICONICO_COMMAND_RETRY_DELAYS_MS) {
      window.setTimeout(() => {
        // Bail if the target changed (a different video, or no longer
        // niconico) since this was scheduled.
        if (nonYouTubePlatformRef.current !== "niconico") return;
        const win = nonYouTubeIframeRef.current?.contentWindow;
        if (!win) return;
        const post = (eventName: string, data?: unknown) =>
          win.postMessage({ sourceConnectorType: 1, playerId: NICONICO_PLAYER_ID, eventName, data }, NICONICO_ORIGIN);
        post("play");
        post("mute", { mute: false });
        post("volumeChange", { volume: 1 });
      }, delay);
    }
  };

  // Kicks off the title-card + duration-badge sequence for a freshly
  // started video. getDurationSeconds is a callback (not a plain value) so
  // the YouTube path can read playerRef.current.getDuration() at the
  // moment the badge is about to show — right after loadVideoById, the
  // player hasn't buffered enough to report it yet.
  const startNowPlayingIntro = (title: string, channelTitle: string, getDurationSeconds: () => number | null) => {
    if (introHideTimerRef.current !== null) window.clearTimeout(introHideTimerRef.current);
    if (durationBadgeShowTimerRef.current !== null) window.clearTimeout(durationBadgeShowTimerRef.current);
    if (durationBadgeHideTimerRef.current !== null) window.clearTimeout(durationBadgeHideTimerRef.current);
    setDurationBadgeVisible(false);

    setIntroContent({ title, channelTitle });
    setIntroVisible(true);
    introHideTimerRef.current = window.setTimeout(() => {
      setIntroVisible(false);
      introHideTimerRef.current = null;
    }, NOW_PLAYING_INTRO_MS);

    durationBadgeShowTimerRef.current = window.setTimeout(() => {
      durationBadgeShowTimerRef.current = null;
      const duration = getDurationSeconds();
      if (!duration || duration <= 0) return;
      setDurationBadgeSeconds(duration);
      setDurationBadgeVisible(true);
      durationBadgeHideTimerRef.current = window.setTimeout(() => {
        setDurationBadgeVisible(false);
        durationBadgeHideTimerRef.current = null;
      }, DURATION_BADGE_VISIBLE_MS);
    }, DURATION_BADGE_DELAY_MS);
  };

  // Shows queued new-request notices one at a time (oldest first) so a
  // burst of simultaneous requests doesn't overlap; see refresh() for where
  // notices are enqueued.
  const showNextNewRequestNotice = () => {
    if (newRequestTimerRef.current !== null) return;
    const next = newRequestQueueRef.current.shift();
    if (!next) return;
    setNewRequestNotice(next);
    newRequestTimerRef.current = window.setTimeout(() => {
      setNewRequestNotice(null);
      newRequestTimerRef.current = null;
      showNextNewRequestNotice();
    }, NEW_REQUEST_NOTICE_MS);
  };

  // Starts (or resumes) filler playback when nothing is requested: the
  // admin-curated playlist takes priority when non-empty, resuming at
  // playlistPositionRef; otherwise a random World/Japan Top 100 (or static)
  // fallback video plays instead.
  const playFiller = () => {
    const pool = playlistPoolRef.current;
    if (pool.length > 0) {
      const idx = Math.min(playlistIndexRef.current, pool.length - 1);
      playlistIndexRef.current = idx;
      const track = pool[idx];
      isPlaylistActiveRef.current = true;
      setIsFallbackPlaying(true);
      loadedVideoIdRef.current = track.videoId;
      currentRequestIdRef.current = null;
      endedHandledRef.current = false;
      setFallbackNowPlayingId(track.videoId);
      resetSeekGuard(playlistPositionRef.current);
      playerRef.current?.loadVideoById({ videoId: track.videoId, startSeconds: playlistPositionRef.current });
      startNowPlayingIntro(track.title, track.channelTitle, () => playerRef.current?.getDuration() ?? null);
      return;
    }

    isPlaylistActiveRef.current = false;
    setIsFallbackPlaying(true);
    const videoId = pickRandomFallbackVideoId(fallbackPoolRef.current, null);
    loadedVideoIdRef.current = videoId;
    currentRequestIdRef.current = null;
    endedHandledRef.current = false;
    setFallbackNowPlayingId(videoId);
    resetSeekGuard();
    playerRef.current?.loadVideoById(videoId);
    const fallbackInfo = fallbackTracks.find((t) => t.videoId === videoId);
    startNowPlayingIntro(
      fallbackInfo?.title ?? "自動再生",
      fallbackInfo?.channelTitle ?? "",
      () => playerRef.current?.getDuration() ?? null,
    );
  };

  // Shared by handleEnded (the player naturally reaching the end) and
  // handleSkip (the admin cutting the current video short): a real request
  // finishing plays the next queued one (handled by the effects below). A
  // playlist track finishing advances to the next one in order (looping
  // back to the start); a random fallback video finishing just picks
  // another random one — either way the screen never goes idle while
  // nothing is requested. finishRequest differs between the two callers:
  // the natural-end path enforces MinPlaybackBeforeFinish server-side, the
  // admin skip doesn't.
  const advanceQueue = (finishRequest: (id: string) => Promise<unknown>) => {
    if (endedHandledRef.current) return;
    endedHandledRef.current = true;
    clearNonYouTubeTimer();
    setNonYouTubeEmbedUrl(null);
    if (voteStatusHideTimerRef.current !== null) {
      window.clearTimeout(voteStatusHideTimerRef.current);
      voteStatusHideTimerRef.current = null;
    }
    setVoteStatusVisible(false);

    const finishedRequestId = currentRequestIdRef.current;
    if (finishedRequestId) {
      loadedVideoIdRef.current = null;
      currentRequestIdRef.current = null;
      playerRef.current?.stopVideo();
      finishRequest(finishedRequestId).catch(() => {}).finally(refresh);
      return;
    }

    if (isPlaylistActiveRef.current) {
      const pool = playlistPoolRef.current;
      if (pool.length > 0) {
        playlistIndexRef.current = (playlistIndexRef.current + 1) % pool.length;
        playlistPositionRef.current = 0;
        const track = pool[playlistIndexRef.current];
        loadedVideoIdRef.current = track.videoId;
        endedHandledRef.current = false;
        setFallbackNowPlayingId(track.videoId);
        resetSeekGuard();
        playerRef.current?.loadVideoById(track.videoId);
        startNowPlayingIntro(track.title, track.channelTitle, () => playerRef.current?.getDuration() ?? null);
        return;
      }
      isPlaylistActiveRef.current = false;
    }

    const nextVideoId = pickRandomFallbackVideoId(fallbackPoolRef.current, loadedVideoIdRef.current);
    loadedVideoIdRef.current = nextVideoId;
    endedHandledRef.current = false;
    setFallbackNowPlayingId(nextVideoId);
    resetSeekGuard();
    playerRef.current?.loadVideoById(nextVideoId);
    const fallbackInfo = fallbackTracks.find((t) => t.videoId === nextVideoId);
    startNowPlayingIntro(
      fallbackInfo?.title ?? "自動再生",
      fallbackInfo?.channelTitle ?? "",
      () => playerRef.current?.getDuration() ?? null,
    );
  };

  const handleEnded = () => advanceQueue(api.finishRequest);

  // Manual admin skip button (hidden in solo/OBS-capture mode): unlike the
  // natural-end path, this bypasses the server's MinPlaybackBeforeFinish
  // floor via doneRequest instead of finishRequest, since it's a deliberate
  // admin action rather than something anyone could trigger.
  const handleSkip = () => advanceQueue(api.doneRequest);

  const playing = requests.find((r) => r.status === "playing") ?? null;
  const pendingList = requests.filter((r) => r.status === "pending");
  const nextPending = pendingList[0] ?? null;
  const target = playing ?? nextPending;

  // If the request that's currently loaded disappears from the queue (e.g.
  // deleted by the admin), stop it immediately instead of waiting for it to
  // play out, so the claim effect can advance.
  useEffect(() => {
    if (!started || !currentRequestIdRef.current) return;
    const stillQueued = requests.some((r) => r.id === currentRequestIdRef.current);
    if (stillQueued) return;
    playerRef.current?.stopVideo();
    clearNonYouTubeTimer();
    setNonYouTubeEmbedUrl(null);
    if (voteStatusHideTimerRef.current !== null) {
      window.clearTimeout(voteStatusHideTimerRef.current);
      voteStatusHideTimerRef.current = null;
    }
    setVoteStatusVisible(false);
    loadedVideoIdRef.current = null;
    currentRequestIdRef.current = null;
  }, [started, requests]);

  // Vote-status badge: whenever the currently playing real request's
  // cancel-vote or like count changes. A different id than last time means
  // a new video just started — show its starting tally right away if it's
  // not zero (a video can arrive already liked/cancel-voted from before it
  // was picked up); the same id with a higher count means a vote came in
  // during playback, which should surface immediately regardless of the
  // starting tally.
  useEffect(() => {
    const requestId = currentRequestIdRef.current;
    if (!requestId) return;
    const current = requests.find((r) => r.id === requestId);
    if (!current) return;

    const last = lastShownVoteCountsRef.current;
    if (!last || last.id !== requestId) {
      lastShownVoteCountsRef.current = { id: requestId, cancelVotes: current.cancelVotes, likes: current.likes };
      if (current.cancelVotes > 0 || current.likes > 0) {
        showVoteStatus(current.cancelVotes, current.likes);
      }
      return;
    }
    if (current.cancelVotes > last.cancelVotes || current.likes > last.likes) {
      lastShownVoteCountsRef.current = { id: requestId, cancelVotes: current.cancelVotes, likes: current.likes };
      showVoteStatus(current.cancelVotes, current.likes);
    }
  }, [requests]);

  // Caps the currently playing request's remaining runtime once any
  // applicable condition is met, instead of letting it run to the end:
  // enough cancel votes (SHORTENED_PLAYBACK_SECONDS at cancelVoteThreshold,
  // or the shorter cancelVoteSevereCapSeconds at cancelVoteSevereThreshold),
  // or the queue being in a backlog fast-forward window
  // (fastForwardCapSeconds — see AppConfig). Whichever applicable cap is
  // smallest wins. Requests are never removed from the queue outright; this
  // cap is the only consequence. Runs off the same poll that refreshes
  // `requests`, so the cutoff lands within one POLL_INTERVAL_MS of the cap
  // rather than exactly on it. YouTube-only: there's no getCurrentTime
  // equivalent for the non-YouTube platforms (see nonYouTubeEmbedUrl),
  // whose advance is a plain duration timer set when they start instead.
  useEffect(() => {
    if (!started || !playerReady || endedHandledRef.current || nonYouTubeEmbedUrl) return;
    const requestId = currentRequestIdRef.current;
    if (!requestId) return;
    const current = requests.find((r) => r.id === requestId);
    if (!current) return;

    const caps: number[] = [];
    if (fastForwardActive) caps.push(fastForwardCapSeconds);
    if (current.cancelVotes >= cancelVoteSevereThreshold) caps.push(cancelVoteSevereCapSeconds);
    if (current.cancelVotes >= cancelVoteThreshold) caps.push(SHORTENED_PLAYBACK_SECONDS);
    if (caps.length === 0) return;
    const capSeconds = Math.min(...caps);

    const elapsed = playerRef.current?.getCurrentTime();
    if (typeof elapsed !== "number" || elapsed < capSeconds) return;

    endedHandledRef.current = true;
    loadedVideoIdRef.current = null;
    currentRequestIdRef.current = null;
    playerRef.current?.stopVideo();
    api.finishRequest(requestId).catch(() => {}).finally(refresh);
  }, [
    started,
    playerReady,
    requests,
    cancelVoteThreshold,
    cancelVoteSevereThreshold,
    cancelVoteSevereCapSeconds,
    fastForwardActive,
    fastForwardCapSeconds,
    nonYouTubeEmbedUrl,
    refresh,
  ]);

  // Actively reverts any jump away from the expected playback position —
  // whether from the (visually hidden, but still reachable via keyboard
  // media keys, touch gestures, or OS-level media controls) seek bar, or any
  // other way of scrubbing the player — so nobody can skip ahead (or back)
  // in whatever's currently playing. This is enforced independently of the
  // disablekb/controls playerVars and the click-absorbing overlay below,
  // which only block the obvious on-screen interactions; this effect is the
  // backstop that catches everything else by comparing the player's own
  // clock against how much real time has actually passed.
  useEffect(() => {
    if (!started || !playerReady) return;
    const TICK_MS = 300;
    const TOLERANCE_SECONDS = 1.5;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const current = player.getCurrentTime();
      if (typeof current !== "number" || !Number.isFinite(current)) return;

      const now = performance.now();
      if (seekGuardTickRef.current === null) {
        seekGuardTickRef.current = now;
        expectedTimeRef.current = current;
        return;
      }
      const elapsedSeconds = (now - seekGuardTickRef.current) / 1000;
      seekGuardTickRef.current = now;

      const allowedMax = expectedTimeRef.current + elapsedSeconds + TOLERANCE_SECONDS;
      const allowedMin = expectedTimeRef.current - TOLERANCE_SECONDS;

      if (current > allowedMax || current < allowedMin) {
        player.seekTo(expectedTimeRef.current, true);
        return;
      }

      expectedTimeRef.current = current;
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [started, playerReady]);

  // Claim the next pending request when nothing is marked as playing yet.
  useEffect(() => {
    if (!started || playing || !nextPending) return;
    if (claimedIdsRef.current.has(nextPending.id)) return;
    claimedIdsRef.current.add(nextPending.id);
    api.playRequest(nextPending.id).catch(() => {}).finally(refresh);
  }, [started, playing, nextPending, refresh]);

  // Load whatever should be showing: a real request takes priority and
  // interrupts filler playback (remembering the playlist's position so it
  // can resume later); with nothing queued, start (and only start — looping
  // and advancing is handled by handleEnded) filler playback via playFiller.
  // A non-YouTube request (platform !== "youtube") is shown as a plain
  // iframe instead of driving the YouTube player, and its queue advance is
  // a one-shot duration timer rather than a real ended event — see
  // nonYouTubeEmbedUrl.
  useEffect(() => {
    if (!started || !playerReady || !playerRef.current) return;

    if (target) {
      if (isPlaylistActiveRef.current && currentRequestIdRef.current === null) {
        const elapsed = playerRef.current.getCurrentTime();
        if (typeof elapsed === "number" && Number.isFinite(elapsed)) {
          playlistPositionRef.current = elapsed;
        }
        isPlaylistActiveRef.current = false;
      }
      setIsFallbackPlaying(false);
      if (loadedVideoIdRef.current === target.videoId && currentRequestIdRef.current === target.id) return;
      loadedVideoIdRef.current = target.videoId;
      currentRequestIdRef.current = target.id;
      endedHandledRef.current = false;
      clearNonYouTubeTimer();

      if (target.platform !== "youtube" && target.embedUrl) {
        playerRef.current.stopVideo();
        resetSeekGuard();
        nonYouTubePlatformRef.current = target.platform;
        setNonYouTubeEmbedUrl(target.embedUrl);
        const timerSeconds = Math.min(
          Math.max(target.durationSeconds || NON_YOUTUBE_DEFAULT_DURATION_SECONDS, SHORTENED_PLAYBACK_SECONDS),
          NON_YOUTUBE_MAX_DURATION_SECONDS,
        );
        nonYouTubeTimerRef.current = window.setTimeout(() => {
          advanceQueue(api.finishRequest);
        }, timerSeconds * 1000);
        startNowPlayingIntro(target.title, target.channelTitle, () => target.durationSeconds ?? null);
        return;
      }

      setNonYouTubeEmbedUrl(null);
      resetSeekGuard();
      playerRef.current.loadVideoById(target.videoId);
      startNowPlayingIntro(target.title, target.channelTitle, () => playerRef.current?.getDuration() ?? null);
      return;
    }

    setNonYouTubeEmbedUrl(null);
    if (loadedVideoIdRef.current === null) {
      playFiller();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, playerReady, target]);

  const playlistNowPlaying = playlistTracks.find((t) => t.videoId === fallbackNowPlayingId) ?? null;
  const fallbackNowPlaying = fallbackTracks.find((t) => t.videoId === fallbackNowPlayingId) ?? null;

  const handleVoteCancel = async (id: string) => {
    await api.voteCancel(id);
    markVoted(id);
    await refresh();
  };

  const handleLike = async (id: string) => {
    await api.likeRequest(id);
    markLiked(id);
    await refresh();
  };

  const handleCreateRequest = async (url: string) => {
    await api.createRequest(url, "");
    await refresh();
  };

  return (
    <Box sx={{ position: "fixed", inset: 0, bgcolor: "black", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
        <Box sx={{ flex: solo ? "1 1 0%" : "4 1 0%", position: "relative", bgcolor: "black" }}>
          {!started ? (
            <Stack
              spacing={3}
              sx={{
                position: "absolute",
                inset: 0,
                alignItems: "center",
                justifyContent: "center",
                px: 3,
                textAlign: "center",
              }}
            >
              <Typography variant="h5" color="white">
                動画リクエストキュー
              </Typography>
              <Typography color="grey.400">タップして再生を開始します</Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayCircleIcon />}
                onClick={() => setStarted(true)}
              >
                再生を開始
              </Button>
            </Stack>
          ) : (
            <>
              <Box id={PLAYER_ELEMENT_ID} sx={{ width: "100%", height: "100%" }} />
              {/* Absorbs clicks/drags so visitors can't reach the player under it (see the playerVars comment above). */}
              <Box sx={{ position: "absolute", inset: 0 }} onContextMenu={(e) => e.preventDefault()} />
              {/* niconico/bilibili/vimeo: plain embed layered over the (stopped) YouTube player, with no seek-guard/click-blocking equivalent — see nonYouTubeEmbedUrl. */}
              {nonYouTubeEmbedUrl && (
                <Box
                  component="iframe"
                  ref={nonYouTubeIframeRef}
                  src={nonYouTubeEmbedUrl}
                  allow="autoplay; fullscreen"
                  onLoad={() => {
                    if (nonYouTubePlatformRef.current === "niconico") sendNiconicoPlayCommand();
                  }}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    border: 0,
                    bgcolor: "black",
                  }}
                />
              )}
              {isFallbackPlaying && (
                <Chip
                  label={
                    playlistNowPlaying
                      ? `リクエスト待ち・プレイリスト再生中: ${playlistNowPlaying.title}`
                      : fallbackNowPlaying
                        ? `リクエスト待ち・${fallbackNowPlaying.region === "japan" ? "日本" : "世界"}Top100自動再生中: ${fallbackNowPlaying.title}`
                        : "リクエスト待ち・自動再生中"
                  }
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    maxWidth: "calc(100% - 32px)",
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "white",
                    "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
                  }}
                />
              )}

              {/* Music-program-style title card: pops in when a video starts, pops out after NOW_PLAYING_INTRO_MS. */}
              <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 24, display: "flex", justifyContent: "center", px: 3, pointerEvents: "none" }}>
                <Zoom in={introVisible} timeout={{ enter: 350, exit: 250 }} style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{
                      alignItems: "center",
                      maxWidth: "90%",
                      bgcolor: "rgba(20,20,20,0.85)",
                      border: "2px solid",
                      borderColor: "primary.main",
                      borderRadius: 3,
                      px: 2.5,
                      py: 1.5,
                      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                    }}
                  >
                    <MusicNoteIcon color="primary" fontSize="large" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" noWrap sx={{ color: "white", fontWeight: 700, lineHeight: 1.25 }}>
                        {introContent?.title ?? ""}
                      </Typography>
                      {introContent?.channelTitle && (
                        <Typography variant="body2" noWrap sx={{ color: "grey.400" }}>
                          {introContent.channelTitle}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Zoom>
              </Box>

              {/* Duration badge: shows DURATION_BADGE_VISIBLE_MS starting DURATION_BADGE_DELAY_MS after the video started. */}
              <Box sx={{ position: "absolute", top: 16, right: 16, pointerEvents: "none" }}>
                <Grow in={durationBadgeVisible} timeout={250}>
                  <Chip
                    icon={<ScheduleIcon sx={{ color: "white !important" }} />}
                    label={durationBadgeSeconds !== null ? formatDuration(durationBadgeSeconds) : ""}
                    size="small"
                    sx={{ bgcolor: "rgba(0,0,0,0.7)", color: "white", fontWeight: 600 }}
                  />
                </Grow>
              </Box>

              {/* Vote-status badge: current cancel-vote/like tally for the playing request, shown on start (if non-zero) and again on every increase — see the effect watching `requests` above. */}
              <Box sx={{ position: "absolute", top: 16, left: 16, pointerEvents: "none" }}>
                <Grow in={voteStatusVisible} timeout={250}>
                  <Stack direction="row" spacing={0.75}>
                    {voteStatusContent && voteStatusContent.cancelVotes > 0 && (
                      <Chip
                        label={`😨+${voteStatusContent.cancelVotes}`}
                        size="small"
                        sx={{ bgcolor: "rgba(0,0,0,0.7)", color: "white", fontWeight: 700 }}
                      />
                    )}
                    {voteStatusContent && voteStatusContent.likes > 0 && (
                      <Chip
                        label={`😊+${voteStatusContent.likes}`}
                        size="small"
                        sx={{ bgcolor: "rgba(0,0,0,0.7)", color: "white", fontWeight: 700 }}
                      />
                    )}
                  </Stack>
                </Grow>
              </Box>

              {/* New-request toast: fires once per request as it's added to the queue (see refresh/enqueue logic above). */}
              <Box sx={{ position: "absolute", top: 16, left: 0, right: 0, display: "flex", justifyContent: "center", px: 3, pointerEvents: "none" }}>
                <Slide in={newRequestNotice !== null} direction="down" timeout={{ enter: 300, exit: 200 }}>
                  <Chip
                    color="primary"
                    label={newRequestNotice ? `🎵 新しいリクエスト: ${newRequestNotice.title}` : ""}
                    sx={{
                      maxWidth: "90%",
                      fontWeight: 600,
                      "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
                    }}
                  />
                </Slide>
              </Box>
            </>
          )}
        </Box>

        {!solo && (
          <Box
            sx={{
              flex: "1 1 0%",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              bgcolor: "#141414",
              borderLeft: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <Typography variant="subtitle2" sx={{ color: "grey.400", px: 1.5, py: 1, flexShrink: 0 }}>
              キュー {pendingList.length > 0 && `(${pendingList.length})`}
            </Typography>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              {pendingList.length === 0 ? (
                <Typography variant="body2" sx={{ color: "grey.600", p: 2, textAlign: "center" }}>
                  リクエストはありません
                </Typography>
              ) : (
                pendingList.map((r) => (
                  <QueueRow
                    key={r.id}
                    request={r}
                    threshold={cancelVoteThreshold}
                    likeThreshold={likePriorityThreshold}
                    onVoteCancel={handleVoteCancel}
                    onLike={handleLike}
                  />
                ))
              )}
            </Box>
          </Box>
        )}
      </Box>

      {!solo && <RequestBar onSubmit={handleCreateRequest} />}
    </Box>
  );
}

interface QueueRowProps {
  request: VideoRequest;
  threshold: number;
  likeThreshold: number;
  onVoteCancel: (id: string) => Promise<void>;
  onLike: (id: string) => Promise<void>;
}

function QueueRow({ request, threshold, likeThreshold, onVoteCancel, onLike }: QueueRowProps) {
  const [voting, setVoting] = useState(false);
  const [liking, setLiking] = useState(false);
  const voted = hasVoted(request.id);
  const liked = hasLiked(request.id);

  const handleClick = async () => {
    setVoting(true);
    try {
      await onVoteCancel(request.id);
    } finally {
      setVoting(false);
    }
  };

  const handleLikeClick = async () => {
    setLiking(true);
    try {
      await onLike(request.id);
    } finally {
      setLiking(false);
    }
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: "center", px: 1.5, py: 1, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <Avatar variant="rounded" src={request.thumbnailUrl} sx={{ width: 44, height: 32, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          {request.likes >= likeThreshold && (
            <Chip
              label="優先"
              size="small"
              color="primary"
              sx={{ height: 16, fontSize: "0.6rem", flexShrink: 0, "& .MuiChip-label": { px: 0.6 } }}
            />
          )}
          <Typography variant="body2" noWrap sx={{ color: "white", lineHeight: 1.3 }}>
            {request.title}
          </Typography>
        </Stack>
        <Typography variant="caption" noWrap sx={{ color: "grey.500" }}>
          {request.channelTitle}
        </Typography>
      </Box>
      <Tooltip title={liked ? "いいね済み" : `いいね (${request.likes}/${likeThreshold}で優先再生)`}>
        <span>
          <IconButton
            size="small"
            onClick={handleLikeClick}
            disabled={liking || liked}
            sx={{ color: liked ? "primary.main" : "grey.500", flexShrink: 0 }}
          >
            <Badge badgeContent={request.likes} color="primary">
              <ThumbUpAltIcon fontSize="small" />
            </Badge>
          </IconButton>
        </span>
      </Tooltip>
      <Box sx={{ width: 12, flexShrink: 0 }} />
      <Tooltip title={voted ? "投票済み" : `1:30に短縮へ投票 (${request.cancelVotes}/${threshold})`}>
        <span>
          <IconButton
            size="small"
            onClick={handleClick}
            disabled={voting || voted}
            sx={{ color: voted ? "grey.700" : "error.main", flexShrink: 0 }}
          >
            <Badge badgeContent={request.cancelVotes} color="error">
              <ThumbDownAltIcon fontSize="small" />
            </Badge>
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

function RequestBar({ onSubmit }: { onSubmit: (url: string) => Promise<void> }) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(url.trim());
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        flexShrink: 0,
        bgcolor: "#181818",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        px: 2,
        py: 1.5,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <TextField
          placeholder="動画のURL(YouTube・ニコニコ動画・bilibili・Vimeo)を貼り付けてリクエスト"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          size="small"
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.06)", color: "white" },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={submitting || !url.trim()}
          startIcon={<AddCircleIcon />}
          sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
        >
          リクエスト
        </Button>
      </Stack>
      {error && (
        <Typography variant="caption" sx={{ color: "error.main", display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default ViewerPage;
