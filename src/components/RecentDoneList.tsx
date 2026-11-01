import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import type { VideoRequest } from "../types";
import { trackEvent } from "../lib/analytics";
import { searchKeyword } from "../lib/affiliate";
import { AffiliateNotice, StoreLinksInline } from "./MusicLinks";
import { wideListThumbnail } from "../lib/listThumbnail";
import { ChannelAndRequester } from "./ChannelAndRequester";
import { CancelVoteIconButton, LikeIconButton, SuberuIconButton, SuperLikeIconButton } from "./QueueList";

interface Props {
  requests: VideoRequest[];
  onVoteCancel: (id: string) => Promise<boolean>;
  onLike: (id: string, isSuper?: boolean) => Promise<boolean>;
  onSuberu: (id: string) => Promise<boolean>;
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
export function RecentDoneList({ requests, onVoteCancel, onLike, onSuberu }: Props) {
  if (requests.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
        <Typography color="text.secondary">再生が終わった動画はまだありません。</Typography>
      </Paper>
    );
  }

  return (
    // Thumbnail on the left; title, actions and store links stacked beside
    // it, so a wide row isn't a small thumbnail with empty space to its right.
    <Paper elevation={2}>
      <List disablePadding>
        {requests.map((r, i) => (
          <ListItem
            key={r.id}
            divider={i < requests.length - 1}
            sx={{ px: { xs: 1.5, sm: 2 }, alignItems: "flex-start", gap: { xs: 1.5, sm: 2 } }}
          >
            <Avatar
              variant="rounded"
              src={wideListThumbnail(r.thumbnailUrl)}
              alt=""
              sx={{ width: { xs: 96, sm: 160 }, height: { xs: 54, sm: 90 }, flexShrink: 0 }}
            />
            <Box sx={{ flex: "1 1 0", minWidth: 0 }}>
              <ListItemText
                sx={{ my: 0 }}
                primary={<span translate="no">{r.title}</span>}
                secondary={<ChannelAndRequester channelTitle={r.channelTitle} requesterName={r.requesterName} />}
                slotProps={{ primary: { noWrap: true }, secondary: { noWrap: true } }}
              />
              <Stack direction="row" spacing={0.5} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap", mt: 0.75 }}>
                <Button
                  component="a"
                  href={sourceUrl(r)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<OpenInNewIcon fontSize="small" />}
                  onClick={() =>
                    trackEvent("video_request_open_original", {
                      request_id: r.id,
                      video_title: r.title,
                      platform: r.platform,
                      source: "recent_done",
                    })
                  }
                  sx={{ whiteSpace: "nowrap", borderRadius: 999, px: 2 }}
                >
                  元の動画に飛ぶ
                </Button>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <LikeIconButton request={r} onLike={onLike} />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }} aria-label="いいね数">
                    {r.likes - r.superLikes * 2}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <SuperLikeIconButton request={r} onLike={onLike} />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }} aria-label="超いいね数">
                    {r.superLikes}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CancelVoteIconButton request={r} onVoteCancel={onVoteCancel} />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }} aria-label="bad数">
                    {r.cancelVotes}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <SuberuIconButton request={r} onSuberu={onSuberu} />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }} aria-label="スベってる数">
                    {r.suberu ?? 0}
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ mt: 0.5 }}>
                <StoreLinksInline keyword={searchKeyword(r.title)} withStreaming />
              </Box>
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
