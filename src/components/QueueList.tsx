import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import { hasVoted, markVoted } from "../lib/cancelVoteStorage";
import { hasLiked, hasSuperLiked, markLiked, markSuperLiked } from "../lib/likeStorage";
import { hasSuberu, markSuberu } from "../lib/suberuStorage";
import { useUnlimitedLikes, FREE_PLAN_UNAVAILABLE, useCanSuperLike, useFreePlanRestricted } from "../lib/voteQuota";
import { isMyRequest } from "../lib/myRequestStorage";
import { listThumbnail } from "../lib/listThumbnail";
import { ChannelAndRequester } from "./ChannelAndRequester";
import type { VideoRequest } from "../types";

interface Props {
  requests: VideoRequest[];
  isAdmin: boolean;
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onVoteCancel: (id: string) => Promise<boolean>;
  onLike: (id: string, isSuper?: boolean) => Promise<boolean>;
  onCancelMine: (id: string) => Promise<void>;
}

export function QueueList({
  requests,
  isAdmin,
  onPlay,
  onDelete,
  onVoteCancel,
  onLike,
  onCancelMine,
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
                <LikeIconButton request={r} onLike={onLike} />
                <SuperLikeIconButton request={r} onLike={onLike} />
                <Box sx={{ width: { xs: 12, sm: 16 } }} />
                <CancelVoteIconButton request={r} onVoteCancel={onVoteCancel} />
                {isMyRequest(r.id) && (
                  <Tooltip title="自分のリクエストをキャンセル">
                    <IconButton edge="end" color="warning" onClick={() => onCancelMine(r.id)} aria-label="自分のリクエストをキャンセル">
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {isAdmin && (
                  <Tooltip title="再生する">
                    <IconButton edge="end" color="primary" onClick={() => onPlay(r.id)} aria-label="再生する">
                      <PlayArrowIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {isAdmin && (
                  <Tooltip title="削除">
                    <IconButton edge="end" onClick={() => onDelete(r.id)} aria-label="削除">
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
                src={listThumbnail(r.thumbnailUrl)}
                alt=""
                sx={{ width: { xs: 48, sm: 64 }, height: { xs: 36, sm: 48 }, mr: 1 }}
              />
            </ListItemAvatar>
            <ListItemText
              sx={{ pr: { xs: 10, sm: 13 } }}
              primary={
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
                  {isMyRequest(r.id) && (
                    // Your own request's place in line, so you know roughly
                    // when to come back (see useMyRequestAlerts).
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        flexShrink: 0,
                        px: 0.75,
                        borderRadius: 1,
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {i === 0 ? "あなた・次に再生" : `あなた・${i + 1}番目`}
                    </Typography>
                  )}
                  <Typography component="span" noWrap translate="no">
                    {r.title}
                  </Typography>
                </Stack>
              }
              secondary={<ChannelAndRequester channelTitle={r.channelTitle} requesterName={r.requesterName} />}
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
  onLike: (id: string, isSuper?: boolean) => Promise<boolean>;
}

export function LikeIconButton({ request, onLike }: LikeIconButtonProps) {
  const [liking, setLiking] = useState(false);
  const unlimited = useUnlimitedLikes();
  const liked = !unlimited && hasLiked(request.id);
  const own = !unlimited && isMyRequest(request.id);

  const handleClick = async () => {
    setLiking(true);
    try {
      if (await onLike(request.id)) markLiked(request.id);
    } finally {
      setLiking(false);
    }
  };

  return (
    <Tooltip describeChild title={own ? "自分のリクエストにはいいねできません" : liked ? "いいね済み" : "いいね"}>
      <span>
        <IconButton
          edge="end"
          aria-label="いいね"
          color={liked ? "primary" : "default"}
          onClick={handleClick}
          disabled={liking || liked || own}
        >
          <ThumbUpAltIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );
}

// 超いいね: いいね2票分(1時間の上限も2票消費)。
export function SuperLikeIconButton({ request, onLike }: LikeIconButtonProps) {
  const [liking, setLiking] = useState(false);
  const unlimited = useUnlimitedLikes();
  const superLiked = !unlimited && hasSuperLiked(request.id);
  const own = !unlimited && isMyRequest(request.id);
  const unavailable = !useCanSuperLike();

  const handleClick = async () => {
    setLiking(true);
    try {
      if (await onLike(request.id, true)) markSuperLiked(request.id);
    } finally {
      setLiking(false);
    }
  };

  return (
    <Tooltip
      describeChild
      title={
        own ? "自分のリクエストにはいいねできません" : superLiked ? "超いいね済み" : unavailable ? FREE_PLAN_UNAVAILABLE : "超いいね"
      }
    >
      <span>
        <IconButton edge="end" onClick={handleClick} disabled={liking || superLiked || own || unavailable} sx={{ fontSize: "1.1rem" }}>
          <span role="img" aria-label="超いいね">
            😍
          </span>
        </IconButton>
      </span>
    </Tooltip>
  );
}

interface SuberuIconButtonProps {
  request: VideoRequest;
  onSuberu: (id: string) => Promise<boolean>;
}

// スベってる(😒): badに近いがペナルティ無しの集計のみ。1リクエスト1人1回。
export function SuberuIconButton({ request, onSuberu }: SuberuIconButtonProps) {
  const [pressing, setPressing] = useState(false);
  const pressed = hasSuberu(request.id);
  const unavailable = useFreePlanRestricted();

  const handleClick = async () => {
    setPressing(true);
    try {
      if (await onSuberu(request.id)) markSuberu(request.id);
    } finally {
      setPressing(false);
    }
  };

  return (
    <Tooltip describeChild title={pressed ? "スベってる済み" : unavailable ? FREE_PLAN_UNAVAILABLE : "スベってる"}>
      <span>
        <IconButton edge="end" onClick={handleClick} disabled={pressing || pressed || unavailable} sx={{ fontSize: "1.1rem" }}>
          <span role="img" aria-label="スベってる">
            😒
          </span>
        </IconButton>
      </span>
    </Tooltip>
  );
}

interface CancelVoteIconButtonProps {
  request: VideoRequest;
  onVoteCancel: (id: string) => Promise<boolean>;
}

export function CancelVoteIconButton({ request, onVoteCancel }: CancelVoteIconButtonProps) {
  const [voting, setVoting] = useState(false);
  const unlimited = useUnlimitedLikes();
  const voted = !unlimited && hasVoted(request.id);
  const unavailable = useFreePlanRestricted();

  const handleClick = async () => {
    setVoting(true);
    try {
      if (await onVoteCancel(request.id)) markVoted(request.id);
    } finally {
      setVoting(false);
    }
  };

  return (
    <Tooltip describeChild title={voted ? "投票済み" : unavailable ? FREE_PLAN_UNAVAILABLE : "キャンセルに投票"}>
      <span>
        <IconButton edge="end" aria-label="キャンセルに投票" color={voted ? "default" : "error"} onClick={handleClick} disabled={voting || voted || unavailable}>
          <ThumbDownAltIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );
}
