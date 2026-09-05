import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import { hasVoted, markVoted } from "../lib/cancelVoteStorage";
import { isMyRequest } from "../lib/myRequestStorage";
import type { VideoRequest } from "../types";

interface Props {
  nowPlaying: VideoRequest | null;
  cancelVoteThreshold: number;
  isAdmin: boolean;
  onMarkDone: (id: string) => void;
  onVoteCancel: (id: string) => Promise<void>;
  onCancelMine: (id: string) => Promise<void>;
}

export function NowPlaying({ nowPlaying, cancelVoteThreshold, isAdmin, onMarkDone, onVoteCancel, onCancelMine }: Props) {
  const [voting, setVoting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!nowPlaying) {
    return (
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
        <Typography color="text.secondary">再生中の動画はありません</Typography>
      </Paper>
    );
  }

  const voted = hasVoted(nowPlaying.id);

  const handleVote = async () => {
    setVoting(true);
    try {
      await onVoteCancel(nowPlaying.id);
      markVoted(nowPlaying.id);
    } finally {
      setVoting(false);
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
    <Paper elevation={2} sx={{ overflow: "hidden" }}>
      <Box sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
        >
          <Box>
            <Chip label="NOW PLAYING" color="primary" size="small" sx={{ mb: 1 }} />
            <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
              {nowPlaying.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {nowPlaying.channelTitle}
              {nowPlaying.requesterName && ` ・ リクエスト: ${nowPlaying.requesterName}`}
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flexShrink: 0 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ThumbDownAltIcon />}
              onClick={handleVote}
              disabled={voting || voted}
              sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
            >
              {voted ? "投票済み" : "1:30に短縮へ投票"} ({nowPlaying.cancelVotes}/{cancelVoteThreshold})
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
