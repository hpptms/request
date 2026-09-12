import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import { hasVoted, markVoted } from "../lib/cancelVoteStorage";
import { formatDuration } from "../lib/formatDuration";
import { hasLiked, markLiked } from "../lib/likeStorage";
import { isMyRequest } from "../lib/myRequestStorage";
import type { CancelVoteTier, VideoRequest } from "../types";

// Watch-page URL for the request's original video, by platform. videoId is
// the bare id the backend extracted from whatever URL the requester
// submitted (see backend/internal/{niconico,vimeo}.ExtractVideoID) —
// not the embed URL, which points at the player, not the watch page.
function originalVideoUrl({ platform, videoId }: VideoRequest): string {
  switch (platform) {
    case "niconico":
      return `https://www.nicovideo.jp/watch/${videoId}`;
    case "vimeo":
      return `https://vimeo.com/${videoId}`;
    default:
      return `https://www.youtube.com/watch?v=${videoId}`;
  }
}

interface Props {
  nowPlaying: VideoRequest | null;
  // Ordered by ascending votes (see AppConfig.cancelVoteTiers). The vote
  // button's label/progress tracks whichever rung hasn't been reached yet,
  // so it advances as votes come in instead of only ever showing the first.
  cancelVoteTiers: CancelVoteTier[];
  likePriorityThreshold: number;
  isAdmin: boolean;
  onMarkDone: (id: string) => void;
  onVoteCancel: (id: string) => Promise<void>;
  onLike: (id: string) => Promise<void>;
  onCancelMine: (id: string) => Promise<void>;
}

export function NowPlaying({
  nowPlaying,
  cancelVoteTiers,
  likePriorityThreshold,
  isAdmin,
  onMarkDone,
  onVoteCancel,
  onLike,
  onCancelMine,
}: Props) {
  const [voting, setVoting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!nowPlaying) {
    return (
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
        <Typography color="text.secondary">再生中の動画はありません</Typography>
      </Paper>
    );
  }

  const voted = hasVoted(nowPlaying.id);
  const liked = hasLiked(nowPlaying.id);

  // The next not-yet-reached rung, so the button counts up through 2:00 →
  // 1:30 → 1:00 → 0:30 as votes come in instead of freezing on the first
  // one; once every rung is reached, keep showing the last (tightest) one.
  const nextTier =
    cancelVoteTiers.find((tier) => nowPlaying.cancelVotes < tier.votes) ??
    cancelVoteTiers[cancelVoteTiers.length - 1];

  const handleVote = async () => {
    setVoting(true);
    try {
      await onVoteCancel(nowPlaying.id);
      markVoted(nowPlaying.id);
    } finally {
      setVoting(false);
    }
  };

  const handleLike = async () => {
    setLiking(true);
    try {
      await onLike(nowPlaying.id);
      markLiked(nowPlaying.id);
    } finally {
      setLiking(false);
    }
  };

  const handleCancelMine = async () => {
    setCancelling(true);
    try {
      await onCancelMine(nowPlaying.id);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Paper elevation={2}>
      <Box sx={{ p: 2 }}>
        <Stack direction="column" spacing={1.5}>
          <Box>
            <Chip label="NOW PLAYING" color="primary" size="small" sx={{ mb: 1 }} />
            <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
              {nowPlaying.title}
              {nowPlaying.durationSeconds != null &&
                `・ ${formatDuration(nowPlaying.durationSeconds)}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {nowPlaying.channelTitle}
              {nowPlaying.requesterName && ` ・ リクエスト: ${nowPlaying.requesterName}`}
            </Typography>
          </Box>
          <Stack
            useFlexGap
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap" }}
          >
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<OpenInNewIcon />}
              component="a"
              href={originalVideoUrl(nowPlaying)}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
            >
              元の動画に飛ぶ
            </Button>
            <Button
              variant="outlined"
              color={liked ? "primary" : "inherit"}
              startIcon={<ThumbUpAltIcon />}
              onClick={handleLike}
              disabled={liking || liked}
              sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
            >
              {liked ? "いいね済み" : "いいね"} ({nowPlaying.likes}/{likePriorityThreshold})
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ThumbDownAltIcon />}
              onClick={handleVote}
              disabled={voting || voted}
              sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
            >
              {voted ? "投票済み" : `${formatDuration(nextTier.capSeconds)}に短縮へ投票`} (
              {nowPlaying.cancelVotes}/{nextTier.votes})
            </Button>
            {isMyRequest(nowPlaying.id) && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<DeleteOutlineIcon />}
                onClick={handleCancelMine}
                disabled={cancelling}
                sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
              >
                自分のリクエストをキャンセル
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outlined"
                startIcon={<CheckCircleIcon />}
                onClick={() => onMarkDone(nowPlaying.id)}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                完了にする
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}
