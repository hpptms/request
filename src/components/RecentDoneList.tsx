import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import type { VideoRequest } from "../types";
import { searchKeyword } from "../lib/affiliate";
import { AffiliateNotice, StoreLinksInline } from "./MusicLinks";
import { CancelVoteIconButton, LikeIconButton } from "./QueueList";

interface Props {
  requests: VideoRequest[];
  onVoteCancel: (id: string) => Promise<void>;
  onLike: (id: string) => Promise<void>;
}

// The watch-page URL of the video a request was made for.
function sourceUrl(r: VideoRequest): string {
  const id = encodeURIComponent(r.videoId);
  switch (r.platform) {
    case "niconico":
      return `https://www.nicovideo.jp/watch/${id}`;
    case "vimeo":
      return `https://vimeo.com/${id}`;
    default:
      return `https://www.youtube.com/watch?v=${id}`;
  }
}

// The most recently finished requests, still open to like/bad, each with a
// link out to the original video.
export function RecentDoneList({ requests, onVoteCancel, onLike }: Props) {
  if (requests.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
        <Typography color="text.secondary">再生が終わった動画はまだありません。</Typography>
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
            sx={{ px: { xs: 1.5, sm: 2 }, alignItems: "flex-start", flexWrap: "wrap", rowGap: 0.5 }}
          >
            <ListItemAvatar sx={{ minWidth: { xs: 56, sm: 72 } }}>
              <Avatar
                variant="rounded"
                src={r.thumbnailUrl}
                sx={{ width: { xs: 48, sm: 64 }, height: { xs: 36, sm: 48 }, mr: 1 }}
              />
            </ListItemAvatar>
            <ListItemText
              sx={{ flex: "1 1 0", minWidth: 0 }}
              primary={r.title}
              secondary={r.channelTitle + (r.requesterName ? ` ・ リクエスト: ${r.requesterName}` : "")}
              slotProps={{ primary: { noWrap: true }, secondary: { noWrap: true } }}
            />
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ alignItems: "center", flexShrink: 0, width: { xs: "100%", sm: "auto" }, justifyContent: "flex-end" }}
            >
              <Button
                component="a"
                href={sourceUrl(r)}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<OpenInNewIcon fontSize="small" />}
                sx={{ whiteSpace: "nowrap", borderRadius: 999, px: 2 }}
              >
                元の動画に飛ぶ
              </Button>
              <LikeIconButton request={r} onLike={onLike} />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }} aria-label="いいね数">
                {r.likes}
              </Typography>
              <CancelVoteIconButton request={r} onVoteCancel={onVoteCancel} />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }} aria-label="bad数">
                {r.cancelVotes}
              </Typography>
            </Stack>
            <Box sx={{ width: "100%", pl: { xs: 7.5, sm: 9.5 } }}>
              <StoreLinksInline keyword={searchKeyword(r.title)} withStreaming />
            </Box>
          </ListItem>
        ))}
      </List>
      <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1 }}>
        <AffiliateNotice />
      </Box>
    </Paper>
  );
}
