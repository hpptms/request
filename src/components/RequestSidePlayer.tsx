import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import { PlayerOverlays } from "./PlayerOverlays";
import { hasVoted, markVoted } from "../lib/cancelVoteStorage";
import { formatDuration } from "../lib/formatDuration";
import { hasLiked, markLiked } from "../lib/likeStorage";
import {
  DURATION_BADGE_DELAY_MS,
  DURATION_BADGE_VISIBLE_MS,
  NEW_REQUEST_NOTICE_MS,
  NOW_PLAYING_INTRO_MS,
  VOTE_STATUS_VISIBLE_MS,
} from "../lib/playerOverlayTiming";
import { useBroadcastOverlay } from "../lib/useBroadcastOverlay";
import { useFastForwardPacingPopups } from "../lib/useFastForwardPacingPopups";
import type { CancelVoteTier, VideoRequest } from "../types";

interface Props {
  requests: VideoRequest[];
  likePriorityThreshold: number;
  // Ordered by ascending votes — see NowPlaying's identical use.
  cancelVoteTiers: CancelVoteTier[];
  // Used instead of cancelVoteTiers while fastForwardActive is true — see
  // NowPlaying's identical use.
  fastForwardActive: boolean;
  fastForwardCancelVoteTiers: CancelVoteTier[];
  // Current per-video pacing target while fastForwardActive — see
  // useFastForwardPacingPopups.
  fastForwardCapSeconds: number;
  onLike: (id: string) => Promise<void>;
  onVoteCancel: (id: string) => Promise<void>;
}

// The public request board's own video screen: shows the same title/duration
// card, new-request toast and like/bad badges as the admin ViewerPage
// player, but is otherwise completely unrelated to the queue it's just
// reflecting — no seek-guard, no cancel-vote/duration-cap enforcement, no
// auto-advance on end, and no admin auth gate. It only ever watches
// `requests` and renders whatever's currently playing; it never calls any
// queue-control API itself. Autoplay is deliberately left off (unlike
// ViewerPage's OBS/admin screen) since this loads on every visitor's own
// device — forcing sound-on video for everyone who opens the board page
// would be intrusive, and most browsers would just block it anyway.
export function RequestSidePlayer({
  requests,
  likePriorityThreshold,
  cancelVoteTiers,
  fastForwardActive,
  fastForwardCancelVoteTiers,
  fastForwardCapSeconds,
  onLike,
  onVoteCancel,
}: Props) {
  const [introVisible, setIntroVisible] = useState(false);
  const [introContent, setIntroContent] = useState<{ title: string; channelTitle: string; videoId: string } | null>(null);
  const [durationBadgeVisible, setDurationBadgeVisible] = useState(false);
  const [durationBadgeSeconds, setDurationBadgeSeconds] = useState<number | null>(null);
  // newRequestNotice only ever updates when showing a new one (same
  // pattern as introContent/introVisible above) — newRequestVisible alone
  // drives the Slide in/out, so the exit animation still shows the same
  // title/color it just displayed instead of flashing back to the default
  // color as content briefly went null mid-animation.
  const [newRequestVisible, setNewRequestVisible] = useState(false);
  const [newRequestNotice, setNewRequestNotice] = useState<{ id: string; title: string; videoId: string } | null>(null);
  const [voteStatusVisible, setVoteStatusVisible] = useState(false);
  const [voteStatusContent, setVoteStatusContent] = useState<{ cancelVotes: number; likes: number } | null>(null);
  const broadcastState = useBroadcastOverlay();

  // Which request's title/duration card has already been shown, so a poll
  // that just re-confirms the same one playing doesn't replay the intro.
  const loadedRequestIdRef = useRef<string | null>(null);
  const introHideTimerRef = useRef<number | null>(null);
  const durationBadgeShowTimerRef = useRef<number | null>(null);
  const durationBadgeHideTimerRef = useRef<number | null>(null);
  // Seeded on the first poll only, so the pre-existing backlog on page load
  // doesn't fire a notice per request — see ViewerPage's identical pattern.
  const knownRequestIdsRef = useRef<Set<string> | null>(null);
  const newRequestQueueRef = useRef<{ id: string; title: string; videoId: string }[]>([]);
  const newRequestTimerRef = useRef<number | null>(null);
  const lastShownVoteCountsRef = useRef<{ id: string; cancelVotes: number; likes: number } | null>(null);
  const voteStatusHideTimerRef = useRef<number | null>(null);

  const nowPlaying = requests.find((r) => r.status === "playing") ?? null;
  const { scheduledVisible, scheduledSeconds, oneMinuteLeftVisible } = useFastForwardPacingPopups(
    nowPlaying?.id ?? null,
    fastForwardActive,
    fastForwardCapSeconds,
  );

  // Like/bad buttons overlaid on the video itself — same storage-backed
  // "already voted" tracking as NowPlaying/QueueList's buttons.
  const [liking, setLiking] = useState(false);
  const [voting, setVoting] = useState(false);
  const liked = nowPlaying !== null && hasLiked(nowPlaying.id);
  const voted = nowPlaying !== null && hasVoted(nowPlaying.id);
  const activeTiers = fastForwardActive ? fastForwardCancelVoteTiers : cancelVoteTiers;
  const nextTier = nowPlaying
    ? (activeTiers.find((tier) => nowPlaying.cancelVotes < tier.votes) ?? activeTiers[activeTiers.length - 1])
    : null;

  const handleLikeClick = async () => {
    if (!nowPlaying) return;
    setLiking(true);
    try {
      await onLike(nowPlaying.id);
      markLiked(nowPlaying.id);
    } finally {
      setLiking(false);
    }
  };

  const handleVoteClick = async () => {
    if (!nowPlaying) return;
    setVoting(true);
    try {
      await onVoteCancel(nowPlaying.id);
      markVoted(nowPlaying.id);
    } finally {
      setVoting(false);
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

  const showNextNewRequestNotice = () => {
    if (newRequestTimerRef.current !== null) return;
    const next = newRequestQueueRef.current.shift();
    if (!next) return;
    setNewRequestNotice(next);
    setNewRequestVisible(true);
    newRequestTimerRef.current = window.setTimeout(() => {
      setNewRequestVisible(false);
      newRequestTimerRef.current = null;
      showNextNewRequestNotice();
    }, NEW_REQUEST_NOTICE_MS);
  };

  // New-request toast.
  useEffect(() => {
    const currentIds = new Set(requests.map((r) => r.id));
    if (knownRequestIdsRef.current === null) {
      knownRequestIdsRef.current = currentIds;
      return;
    }
    const known = knownRequestIdsRef.current;
    for (const r of requests) {
      if (!known.has(r.id)) {
        newRequestQueueRef.current.push({ id: r.id, title: r.title, videoId: r.videoId });
      }
    }
    knownRequestIdsRef.current = currentIds;
    showNextNewRequestNotice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  // Title/duration intro card: fires whenever a different request starts
  // playing. Unlike ViewerPage, durationSeconds comes straight off the
  // request instead of a live player instance.
  useEffect(() => {
    if (!nowPlaying) {
      loadedRequestIdRef.current = null;
      return;
    }
    if (loadedRequestIdRef.current === nowPlaying.id) return;
    loadedRequestIdRef.current = nowPlaying.id;

    if (introHideTimerRef.current !== null) window.clearTimeout(introHideTimerRef.current);
    if (durationBadgeShowTimerRef.current !== null) window.clearTimeout(durationBadgeShowTimerRef.current);
    if (durationBadgeHideTimerRef.current !== null) window.clearTimeout(durationBadgeHideTimerRef.current);
    setDurationBadgeVisible(false);

    setIntroContent({ title: nowPlaying.title, channelTitle: nowPlaying.channelTitle, videoId: nowPlaying.videoId });
    setIntroVisible(true);
    introHideTimerRef.current = window.setTimeout(() => {
      setIntroVisible(false);
      introHideTimerRef.current = null;
    }, NOW_PLAYING_INTRO_MS);

    const duration = nowPlaying.durationSeconds;
    if (duration) {
      durationBadgeShowTimerRef.current = window.setTimeout(() => {
        durationBadgeShowTimerRef.current = null;
        setDurationBadgeSeconds(duration);
        setDurationBadgeVisible(true);
        durationBadgeHideTimerRef.current = window.setTimeout(() => {
          setDurationBadgeVisible(false);
          durationBadgeHideTimerRef.current = null;
        }, DURATION_BADGE_VISIBLE_MS);
      }, DURATION_BADGE_DELAY_MS);
    }
  }, [nowPlaying]);

  // Vote-status badge: shown on start (if already non-zero) and again on
  // every increase while the same request keeps playing.
  useEffect(() => {
    if (!nowPlaying) return;
    const last = lastShownVoteCountsRef.current;
    if (!last || last.id !== nowPlaying.id) {
      lastShownVoteCountsRef.current = { id: nowPlaying.id, cancelVotes: nowPlaying.cancelVotes, likes: nowPlaying.likes };
      if (nowPlaying.cancelVotes > 0 || nowPlaying.likes > 0) {
        showVoteStatus(nowPlaying.cancelVotes, nowPlaying.likes);
      }
      return;
    }
    if (nowPlaying.cancelVotes > last.cancelVotes || nowPlaying.likes > last.likes) {
      lastShownVoteCountsRef.current = { id: nowPlaying.id, cancelVotes: nowPlaying.cancelVotes, likes: nowPlaying.likes };
      showVoteStatus(nowPlaying.cancelVotes, nowPlaying.likes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying]);

  useEffect(() => {
    return () => {
      if (introHideTimerRef.current !== null) window.clearTimeout(introHideTimerRef.current);
      if (durationBadgeShowTimerRef.current !== null) window.clearTimeout(durationBadgeShowTimerRef.current);
      if (durationBadgeHideTimerRef.current !== null) window.clearTimeout(durationBadgeHideTimerRef.current);
      if (newRequestTimerRef.current !== null) window.clearTimeout(newRequestTimerRef.current);
      if (voteStatusHideTimerRef.current !== null) window.clearTimeout(voteStatusHideTimerRef.current);
    };
  }, []);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        // Fills whatever the parent layout gives it (PlayPage sizes this to
        // dominate the screen) instead of a fixed aspect ratio, matching how
        // ViewerPage's own OBS video box is sized.
        height: { xs: "56vh", md: "100%" },
        bgcolor: "black",
        overflow: "hidden",
      }}
    >
      {nowPlaying ? (
        <Box
          component="iframe"
          key={nowPlaying.id}
          src={embedSrc(nowPlaying)}
          allow="autoplay; fullscreen"
          allowFullScreen
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      ) : (
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ color: "grey.500" }}>再生中の動画はありません</Typography>
        </Box>
      )}

      <PlayerOverlays
        introVisible={introVisible}
        introContent={introContent}
        durationBadgeVisible={durationBadgeVisible}
        durationBadgeSeconds={durationBadgeSeconds}
        newRequestVisible={newRequestVisible}
        newRequestNotice={newRequestNotice}
        voteStatusVisible={voteStatusVisible}
        voteStatusContent={voteStatusContent}
        broadcastState={broadcastState}
        scheduledVisible={scheduledVisible}
        scheduledSeconds={scheduledSeconds}
        oneMinuteLeftVisible={oneMinuteLeftVisible}
      />

      {/* Vertically centered on the right edge (Shorts/Reels-style reaction
          rail) so these permanent controls never collide with the title
          card (bottom-center) or the toast/vote-status popups (top-center) —
          both of which can grow fairly wide/tall on top of a phone-sized
          video. */}
      {nowPlaying && (
        <Stack
          direction="column"
          spacing={{ xs: 1, sm: 1.5 }}
          sx={{ position: "absolute", right: { xs: 8, sm: 12 }, top: "50%", transform: "translateY(-50%)", zIndex: 1 }}
        >
          <Tooltip title={liked ? "いいね済み" : `いいね (${nowPlaying.likes}/${likePriorityThreshold}で優先再生)`}>
            <span>
              {/* minHeight/minWidth keep this at (or above) the ~44px touch
                  target Apple/Google guidelines recommend, even though the
                  visual size stays compact — MUI's own "small" padding
                  alone falls short of that on a phone. */}
              <Button
                variant="contained"
                size="small"
                startIcon={<ThumbUpAltIcon />}
                onClick={handleLikeClick}
                disabled={liking || liked}
                sx={{
                  minWidth: 44,
                  minHeight: 44,
                  px: 1.5,
                  bgcolor: liked ? "primary.main" : "rgba(0,0,0,0.6)",
                  color: "white",
                  "&:hover": { bgcolor: liked ? "primary.main" : "rgba(0,0,0,0.75)" },
                  "&.Mui-disabled": { color: "white", opacity: liked ? 1 : 0.5 },
                }}
              >
                {nowPlaying.likes}
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            title={
              voted
                ? "投票済み"
                : `${nextTier ? formatDuration(nextTier.capSeconds) : ""}に短縮へ投票 (${nowPlaying.cancelVotes}/${nextTier?.votes ?? 0})`
            }
          >
            <span>
              <Button
                variant="contained"
                size="small"
                color="error"
                startIcon={<ThumbDownAltIcon />}
                onClick={handleVoteClick}
                disabled={voting || voted}
                sx={{
                  minWidth: 44,
                  minHeight: 44,
                  px: 1.5,
                  bgcolor: voted ? "rgba(255,255,255,0.2)" : undefined,
                  color: "white",
                  "&.Mui-disabled": { color: "white", opacity: voted ? 1 : 0.5 },
                }}
              >
                {nowPlaying.cancelVotes}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      )}
    </Box>
  );
}

// Builds this player's own (non-autoplaying) embed src, instead of reusing
// admin ViewerPage's `request.embedUrl` as-is: that URL is built for the
// autoplay-with-sound OBS/admin screen (see backend/internal/vimeo.EmbedURL),
// which would be intrusive here since it loads on every visitor's device.
// niconico's embed never autoplays from a URL flag alone anyway (it needs an
// explicit postMessage — see ViewerPage's sendNiconicoPlayCommand), so it's
// used unmodified and simply stays paused until a visitor presses its own
// on-screen play button.
function embedSrc(request: VideoRequest): string | undefined {
  if (request.platform === "youtube") {
    return `https://www.youtube.com/embed/${request.videoId}?rel=0&modestbranding=1`;
  }
  return request.embedUrl?.replace("autoplay=1", "autoplay=0");
}
