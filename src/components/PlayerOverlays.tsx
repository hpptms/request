import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Grow from "@mui/material/Grow";
import Slide from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Zoom from "@mui/material/Zoom";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { formatDuration } from "../lib/formatDuration";

interface Props {
  // Music-program-style title card, shown while a video starts.
  introVisible: boolean;
  introContent: { title: string; channelTitle: string } | null;
  // Duration badge, shown a few seconds after the title card.
  durationBadgeVisible: boolean;
  durationBadgeSeconds: number | null;
  // New-request toast: fires once per request as it's added to the queue.
  newRequestNotice: { id: string; title: string } | null;
  // Vote-status badge (😨 cancel votes / 😊 likes) for whatever's playing.
  voteStatusVisible: boolean;
  voteStatusContent: { cancelVotes: number; likes: number } | null;
}

// The "now playing" overlay pieces shared by the admin ViewerPage player and
// the public-facing RequestSidePlayer, so both present the same view.
export function PlayerOverlays({
  introVisible,
  introContent,
  durationBadgeVisible,
  durationBadgeSeconds,
  newRequestNotice,
  voteStatusVisible,
  voteStatusContent,
}: Props) {
  return (
    <>
      {/* Music-program-style title card: pops in when a video starts, pops out after NOW_PLAYING_INTRO_MS. */}
      <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 24, display: "flex", justifyContent: "center", px: 3, pointerEvents: "none" }}>
        <Zoom in={introVisible} timeout={{ enter: 350, exit: 250 }} style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
              maxWidth: "90%",
              bgcolor: "rgba(20,20,20,0.85)",
              border: "2px solid",
              borderColor: "primary.main",
              borderRadius: 3,
              px: 2.5,
              py: 1.5,
              boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            }}
          >
            <MusicNoteIcon color="primary" fontSize="large" />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                noWrap
                sx={{ color: "white", fontWeight: 700, lineHeight: 1.25, fontSize: "2.5rem" }}
              >
                {introContent?.title ?? ""}
              </Typography>
              {introContent?.channelTitle && (
                <Typography variant="body2" noWrap sx={{ color: "grey.400" }}>
                  {introContent.channelTitle}
                </Typography>
              )}
            </Box>
          </Stack>
        </Zoom>
      </Box>

      {/* Duration badge: shows DURATION_BADGE_VISIBLE_MS starting DURATION_BADGE_DELAY_MS after the video started. ~3x a normal small Chip. */}
      <Box sx={{ position: "absolute", top: 16, right: 16, pointerEvents: "none" }}>
        <Grow in={durationBadgeVisible} timeout={250}>
          <Chip
            icon={<ScheduleIcon sx={{ color: "white !important", fontSize: "2.4rem !important" }} />}
            label={durationBadgeSeconds !== null ? formatDuration(durationBadgeSeconds) : ""}
            sx={{
              bgcolor: "rgba(0,0,0,0.7)",
              color: "white",
              fontWeight: 600,
              height: 72,
              borderRadius: 4,
              "& .MuiChip-label": { fontSize: "2.4rem", px: 2 },
            }}
          />
        </Grow>
      </Box>

      {/* New-request toast: fires once per request as it's added to the
          queue. Below it sits the vote-status badge, so both transient
          notices share one column instead of competing for space. */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          px: 3,
        }}
      >
        <Slide
          in={newRequestNotice !== null}
          direction="down"
          timeout={{ enter: 300, exit: 200 }}
          style={{ pointerEvents: "none" }}
        >
          <Chip
            color="primary"
            label={newRequestNotice ? `🎵 新しいリクエスト: ${newRequestNotice.title}` : ""}
            sx={{
              maxWidth: "90%",
              height: 64,
              fontSize: "1.625rem",
              fontWeight: 600,
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                px: 2,
              },
            }}
          />
        </Slide>

        {/* Vote-status badge: current cancel-vote/like tally for the
            playing request, shown on start (if non-zero) and again on
            every increase. ~6x a normal small Chip. */}
        <Grow in={voteStatusVisible} timeout={250} style={{ pointerEvents: "none" }}>
          <Stack direction="row" spacing={1.5}>
            {voteStatusContent && voteStatusContent.cancelVotes > 0 && (
              <Chip
                label={`😨+${voteStatusContent.cancelVotes}`}
                sx={{
                  bgcolor: "rgba(0,0,0,0.7)",
                  color: "white",
                  fontWeight: 700,
                  height: 144,
                  borderRadius: 6,
                  "& .MuiChip-label": { fontSize: "4.8rem", px: 5 },
                }}
              />
            )}
            {voteStatusContent && voteStatusContent.likes > 0 && (
              <Chip
                label={`😊+${voteStatusContent.likes}`}
                sx={{
                  bgcolor: "rgba(0,0,0,0.7)",
                  color: "white",
                  fontWeight: 700,
                  height: 144,
                  borderRadius: 6,
                  "& .MuiChip-label": { fontSize: "4.8rem", px: 5 },
                }}
              />
            )}
          </Stack>
        </Grow>
      </Box>
    </>
  );
}
