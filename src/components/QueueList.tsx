import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import { hasVoted, markVoted } from "../lib/cancelVoteStorage";
import { hasLiked, markLiked } from "../lib/likeStorage";
import type { VideoRequest } from "../types";

interface Props {
  requests: VideoRequest[];
  cancelVoteThreshold: number;
  likePriorityThreshold: number;
  isAdmin: boolean;
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onVoteCancel: (id: string) => Promise<void>;
  onLike: (id: string) => Promise<void>;
}

export function QueueList({
  requests,
  cancelVoteThreshold,
  likePriorityThreshold,
  isAdmin,
  onPlay,
  onDelete,
  onVoteCancel,
  onLike,
}: Props) {
  if (requests.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
        <Typography color="text.secondary">キューは空です。上のフォームから動画をリクエストしてください。</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2}>
      <List disablePadding>
        {requests.map((r, i) => (
          <ListItem
            key={r.id}
            divider={i < requests.length - 1}
            sx={{ px: { xs: 1.5, sm: 2 } }}
            secondaryAction={
              <Stack direction="row" spacing={0}>
                <LikeIconButton request={r} threshold={likePriorityThreshold} onLike={onLike} />
                <CancelVoteIconButton
                  request={r}
                  threshold={cancelVoteThreshold}
                  onVoteCancel={onVoteCancel}
                />
                <Tooltip title="再生する">
                  <IconButton edge="end" color="primary" onClick={() => onPlay(r.id)}>
                    <PlayArrowIcon />
                  </IconButton>
                </Tooltip>
                {isAdmin && (
                  <Tooltip title="削除">
                    <IconButton edge="end" onClick={() => onDelete(r.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            }
          >
            <ListItemAvatar sx={{ minWidth: { xs: 56, sm: 72 } }}>
              <Avatar
                variant="rounded"
                src={r.thumbnailUrl}
                sx={{ width: { xs: 48, sm: 64 }, height: { xs: 36, sm: 48 }, mr: 1 }}
              />
            </ListItemAvatar>
            <ListItemText
              sx={{ pr: { xs: 10, sm: 13 } }}
              primary={
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
                  {r.likes >= likePriorityThreshold && (
                    <Chip
                      label="優先"
                      size="small"
                      color="primary"
                      sx={{ height: 18, fontSize: "0.65rem", flexShrink: 0, "& .MuiChip-label": { px: 0.75 } }}
                    />
                  )}
                  <Typography component="span" noWrap>
                    {r.title}
                  </Typography>
                </Stack>
              }
              secondary={
                r.channelTitle + (r.requesterName ? ` ・ リクエスト: ${r.requesterName}` : "")
              }
              slotProps={{
                secondary: { noWrap: true },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

interface LikeIconButtonProps {
  request: VideoRequest;
  threshold: number;
  onLike: (id: string) => Promise<void>;
}

function LikeIconButton({ request, threshold, onLike }: LikeIconButtonProps) {
  const [liking, setLiking] = useState(false);
  const liked = hasLiked(request.id);

  const handleClick = async () => {
    setLiking(true);
    try {
      await onLike(request.id);
      markLiked(request.id);
    } finally {
      setLiking(false);
    }
  };

  return (
    <Tooltip title={liked ? "いいね済み" : `いいね (${request.likes}/${threshold}で優先再生)`}>
      <span>
        <IconButton edge="end" color={liked ? "primary" : "default"} onClick={handleClick} disabled={liking || liked}>
          <Badge badgeContent={request.likes} color="primary">
            <ThumbUpAltIcon fontSize="small" />
          </Badge>
        </IconButton>
      </span>
    </Tooltip>
  );
}

interface CancelVoteIconButtonProps {
  request: VideoRequest;
  threshold: number;
  onVoteCancel: (id: string) => Promise<void>;
}

function CancelVoteIconButton({ request, threshold, onVoteCancel }: CancelVoteIconButtonProps) {
  const [voting, setVoting] = useState(false);
  const voted = hasVoted(request.id);

  const handleClick = async () => {
    setVoting(true);
    try {
      await onVoteCancel(request.id);
      markVoted(request.id);
    } finally {
      setVoting(false);
    }
  };

  return (
    <Tooltip title={voted ? "投票済み" : `キャンセルに投票 (${request.cancelVotes}/${threshold})`}>
      <span>
        <IconButton edge="end" color={voted ? "default" : "error"} onClick={handleClick} disabled={voting || voted}>
          <Badge badgeContent={request.cancelVotes} color="error">
            <ThumbDownAltIcon fontSize="small" />
          </Badge>
        </IconButton>
      </span>
    </Tooltip>
  );
}
