import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
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
import { hasVoted, markVoted } from "../lib/cancelVoteStorage";
import type { VideoRequest } from "../types";

interface Props {
  requests: VideoRequest[];
  cancelVoteThreshold: number;
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onVoteCancel: (id: string) => Promise<void>;
}

export function QueueList({ requests, cancelVoteThreshold, onPlay, onDelete, onVoteCancel }: Props) {
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
                <Tooltip title="削除">
                  <IconButton edge="end" onClick={() => onDelete(r.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
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
              primary={r.title}
              secondary={
                r.channelTitle + (r.requesterName ? ` ・ リクエスト: ${r.requesterName}` : "")
              }
              slotProps={{
                primary: { noWrap: true },
                secondary: { noWrap: true },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
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
