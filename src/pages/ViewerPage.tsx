import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import { api } from "../api";
import { hasVoted, markVoted } from "../lib/cancelVoteStorage";
import { FALLBACK_VIDEO_IDS, pickRandomFallbackVideoId } from "../lib/fallbackPlaylist";
import { loadYouTubeIframeApi } from "../lib/loadYouTubeIframeApi";
import type { FallbackTrack, VideoRequest } from "../types";

const POLL_INTERVAL_MS = 3000;
const PLAYER_ELEMENT_ID = "yt-viewer-player";
const DEFAULT_CANCEL_VOTE_THRESHOLD = 10;

// The OBS capture screen: video on the left (4), a live queue with cancel
// voting on the right (1), and a request bar along the bottom. It plays
// whatever the queue says is current, auto-advances when a video ends, and
// fills silence with a random fallback video when nothing is queued.
function ViewerPage() {
  const [searchParams] = useSearchParams();
  // ?solo=1 : OBSキャプチャ用に動画だけをフルサイズで表示し、キューと入力欄を隠す。
  const solo = searchParams.get("solo") === "1";
  const [requests, setRequests] = useState<VideoRequest[]>([]);
  const [cancelVoteThreshold, setCancelVoteThreshold] = useState(DEFAULT_CANCEL_VOTE_THRESHOLD);
  const [started, setStarted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isFallbackPlaying, setIsFallbackPlaying] = useState(false);
  const [fallbackNowPlayingId, setFallbackNowPlayingId] = useState<string | null>(null);
  // World/Japan Top 100 tracks from the backend; empty until resolved (or
  // permanently, with no YouTube API key configured), in which case the
  // static FALLBACK_VIDEO_IDS list below is used instead.
  const [fallbackTracks, setFallbackTracks] = useState<FallbackTrack[]>([]);

  const playerRef = useRef<YT.Player | null>(null);
  const loadedVideoIdRef = useRef<string | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);
  const endedHandledRef = useRef(false);
  const claimedIdsRef = useRef<Set<string>>(new Set());
  // Mirrors fallbackTracks for the player event handlers below, which are
  // wired up once (see the `started`-only effect) and would otherwise close
  // over a stale empty list.
  const fallbackPoolRef = useRef<string[]>(FALLBACK_VIDEO_IDS);

  const refresh = useCallback(async () => {
    try {
      const data = await api.listRequests();
      setRequests(data);
    } catch {
      // Keep the last known state; the next poll will retry.
    }
  }, []);

  useEffect(() => {
    api.getConfig().then((config) => setCancelVoteThreshold(config.cancelVoteThreshold)).catch(() => {});
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

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // Create the player once, after the user's tap unlocks autoplay-with-sound.
  useEffect(() => {
    if (!started) return;

    let cancelled = false;
    loadYouTubeIframeApi().then((YTApi) => {
      if (cancelled) return;
      playerRef.current = new YTApi.Player(PLAYER_ELEMENT_ID, {
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (event) => {
            if (event.data === YTApi.PlayerState.ENDED) {
              handleEnded();
            }
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

  // A real request finishing plays the next queued one (handled by the
  // effects below); a fallback video finishing just picks another random one
  // so the screen never goes idle while nothing is requested.
  const handleEnded = () => {
    if (endedHandledRef.current) return;
    endedHandledRef.current = true;

    const finishedRequestId = currentRequestIdRef.current;
    if (finishedRequestId) {
      loadedVideoIdRef.current = null;
      currentRequestIdRef.current = null;
      api.finishRequest(finishedRequestId).catch(() => {}).finally(refresh);
      return;
    }

    const nextVideoId = pickRandomFallbackVideoId(fallbackPoolRef.current, loadedVideoIdRef.current);
    loadedVideoIdRef.current = nextVideoId;
    endedHandledRef.current = false;
    setFallbackNowPlayingId(nextVideoId);
    playerRef.current?.loadVideoById(nextVideoId);
  };

  const playing = requests.find((r) => r.status === "playing") ?? null;
  const pendingList = requests.filter((r) => r.status === "pending");
  const nextPending = pendingList[0] ?? null;
  const target = playing ?? nextPending;

  // If the request that's currently loaded disappears from the queue (e.g.
  // cancelled by crowd vote, or deleted by the admin), stop it immediately
  // instead of waiting for it to play out, so the claim effect can advance.
  useEffect(() => {
    if (!started || !currentRequestIdRef.current) return;
    const stillQueued = requests.some((r) => r.id === currentRequestIdRef.current);
    if (stillQueued) return;
    playerRef.current?.stopVideo();
    loadedVideoIdRef.current = null;
    currentRequestIdRef.current = null;
  }, [started, requests]);

  // Claim the next pending request when nothing is marked as playing yet.
  useEffect(() => {
    if (!started || playing || !nextPending) return;
    if (claimedIdsRef.current.has(nextPending.id)) return;
    claimedIdsRef.current.add(nextPending.id);
    api.playRequest(nextPending.id).catch(() => {}).finally(refresh);
  }, [started, playing, nextPending, refresh]);

  // Load whatever should be showing: a real request takes priority; with
  // nothing queued, start (and only start — looping is handled by
  // handleEnded) a random fallback video.
  useEffect(() => {
    if (!started || !playerReady || !playerRef.current) return;

    if (target) {
      setIsFallbackPlaying(false);
      if (loadedVideoIdRef.current === target.videoId && currentRequestIdRef.current === target.id) return;
      loadedVideoIdRef.current = target.videoId;
      currentRequestIdRef.current = target.id;
      endedHandledRef.current = false;
      playerRef.current.loadVideoById(target.videoId);
      return;
    }

    if (loadedVideoIdRef.current === null) {
      setIsFallbackPlaying(true);
      const videoId = pickRandomFallbackVideoId(fallbackPoolRef.current, null);
      loadedVideoIdRef.current = videoId;
      currentRequestIdRef.current = null;
      endedHandledRef.current = false;
      setFallbackNowPlayingId(videoId);
      playerRef.current.loadVideoById(videoId);
    }
  }, [started, playerReady, target]);

  const fallbackNowPlaying = fallbackTracks.find((t) => t.videoId === fallbackNowPlayingId) ?? null;

  const handleVoteCancel = async (id: string) => {
    await api.voteCancel(id);
    markVoted(id);
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
              {isFallbackPlaying && (
                <Chip
                  label={
                    fallbackNowPlaying
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
                    onVoteCancel={handleVoteCancel}
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
  onVoteCancel: (id: string) => Promise<void>;
}

function QueueRow({ request, threshold, onVoteCancel }: QueueRowProps) {
  const [voting, setVoting] = useState(false);
  const voted = hasVoted(request.id);

  const handleClick = async () => {
    setVoting(true);
    try {
      await onVoteCancel(request.id);
    } finally {
      setVoting(false);
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
        <Typography variant="body2" noWrap sx={{ color: "white", lineHeight: 1.3 }}>
          {request.title}
        </Typography>
        <Typography variant="caption" noWrap sx={{ color: "grey.500" }}>
          {request.channelTitle}
        </Typography>
      </Box>
      <Tooltip title={voted ? "投票済み" : `キャンセルに投票 (${request.cancelVotes}/${threshold})`}>
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
          placeholder="YouTubeのURLを貼り付けてリクエスト"
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
