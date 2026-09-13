import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PlayerOverlays } from "./PlayerOverlays";
import {
  DURATION_BADGE_DELAY_MS,
  DURATION_BADGE_VISIBLE_MS,
  NEW_REQUEST_NOTICE_MS,
  NOW_PLAYING_INTRO_MS,
  VOTE_STATUS_VISIBLE_MS,
} from "../lib/playerOverlayTiming";
import type { VideoRequest } from "../types";

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
export function RequestSidePlayer({ requests }: { requests: VideoRequest[] }) {
  const [introVisible, setIntroVisible] = useState(false);
  const [introContent, setIntroContent] = useState<{ title: string; channelTitle: string } | null>(null);
  const [durationBadgeVisible, setDurationBadgeVisible] = useState(false);
  const [durationBadgeSeconds, setDurationBadgeSeconds] = useState<number | null>(null);
  const [newRequestNotice, setNewRequestNotice] = useState<{ id: string; title: string } | null>(null);
  const [voteStatusVisible, setVoteStatusVisible] = useState(false);
  const [voteStatusContent, setVoteStatusContent] = useState<{ cancelVotes: number; likes: number } | null>(null);

  // Which request's title/duration card has already been shown, so a poll
  // that just re-confirms the same one playing doesn't replay the intro.
  const loadedRequestIdRef = useRef<string | null>(null);
  const introHideTimerRef = useRef<number | null>(null);
  const durationBadgeShowTimerRef = useRef<number | null>(null);
  const durationBadgeHideTimerRef = useRef<number | null>(null);
  // Seeded on the first poll only, so the pre-existing backlog on page load
  // doesn't fire a notice per request — see ViewerPage's identical pattern.
  const knownRequestIdsRef = useRef<Set<string> | null>(null);
  const newRequestQueueRef = useRef<{ id: string; title: string }[]>([]);
  const newRequestTimerRef = useRef<number | null>(null);
  const lastShownVoteCountsRef = useRef<{ id: string; cancelVotes: number; likes: number } | null>(null);
  const voteStatusHideTimerRef = useRef<number | null>(null);

  const nowPlaying = requests.find((r) => r.status === "playing") ?? null;

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
    newRequestTimerRef.current = window.setTimeout(() => {
      setNewRequestNotice(null);
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
        newRequestQueueRef.current.push({ id: r.id, title: r.title });
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

    setIntroContent({ title: nowPlaying.title, channelTitle: nowPlaying.channelTitle });
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
        aspectRatio: "16 / 9",
        bgcolor: "black",
        borderRadius: 2,
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
        newRequestNotice={newRequestNotice}
        voteStatusVisible={voteStatusVisible}
        voteStatusContent={voteStatusContent}
      />
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
