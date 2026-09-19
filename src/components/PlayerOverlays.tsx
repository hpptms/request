import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Fade from "@mui/material/Fade";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Slide from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Zoom from "@mui/material/Zoom";
import { useTheme } from "@mui/material/styles";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { broadcastImageUrl } from "../api";
import { formatDuration } from "../lib/formatDuration";
import { requestAccentColor } from "../lib/requestColor";
import type { BroadcastState } from "../types";

interface Props {
  // Music-program-style title card, shown while a video starts.
  introVisible: boolean;
  introContent: { title: string; channelTitle: string; videoId: string } | null;
  // Duration badge, shown a few seconds after the title card.
  durationBadgeVisible: boolean;
  durationBadgeSeconds: number | null;
  // New-request toast: fires once per request as it's added to the queue.
  // newRequestNotice only ever updates when showing a new one (see
  // introContent above) — newRequestVisible alone drives the Slide in/out,
  // so the exit animation keeps the title/color it just displayed instead
  // of flashing back to the default color as content goes null mid-fade.
  newRequestVisible: boolean;
  newRequestNotice: { id: string; title: string; videoId: string } | null;
  // Vote-status badge (😊 likes) for whatever's playing.
  voteStatusVisible: boolean;
  voteStatusContent: { cancelVotes: number; likes: number } | null;
  // 管理者パネルの「意思表示」機能 (see useBroadcastOverlay) — a one-off
  // message or image shown centered, semi-transparent, for 10 seconds.
  broadcastState: BroadcastState;
  // 早送りタイム中のペーシング通知 (see useFastForwardPacingPopups): a cute
  // pop-out on the right edge, once when a video starts (how long it's
  // scheduled to play) and again with a minute left of that schedule.
  scheduledVisible: boolean;
  scheduledSeconds: number;
  oneMinuteLeftVisible: boolean;
}

// The "now playing" overlay pieces shared by the admin ViewerPage player
// (always a full TV/OBS-sized screen) and the public-facing
// RequestSidePlayer (a phone-sized box most of the time) — so every size
// below scales with the md breakpoint: the md+ values are the original
// TV-tuned sizes, and xs/sm shrink them down for a small screen instead of
// letting these overlays swamp a phone-sized video.
export function PlayerOverlays({
  introVisible,
  introContent,
  durationBadgeVisible,
  durationBadgeSeconds,
  newRequestVisible,
  newRequestNotice,
  voteStatusVisible,
  voteStatusContent,
  broadcastState,
  scheduledVisible,
  scheduledSeconds,
  oneMinuteLeftVisible,
}: Props) {
  const theme = useTheme();
  const introAccent = introContent ? requestAccentColor(introContent.videoId) : theme.palette.primary.main;
  const noticeAccent = newRequestNotice ? requestAccentColor(newRequestNotice.videoId) : theme.palette.primary.main;

  return (
    <>
      {/* Music-program-style title card: pops in when a video starts, pops out after NOW_PLAYING_INTRO_MS. Border color varies per video (requestAccentColor) instead of always the theme red. */}
      <Box sx={{ position: "absolute", left: 0, right: 0, bottom: { xs: 8, sm: 16, md: 24 }, display: "flex", justifyContent: "center", px: { xs: 1.5, sm: 3 }, pointerEvents: "none" }}>
        <Zoom in={introVisible} timeout={{ enter: 350, exit: 250 }} style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
          <Stack
            direction="row"
            spacing={{ xs: 1, sm: 1.5 }}
            sx={{
              alignItems: "center",
              maxWidth: "90%",
              bgcolor: "rgba(20,20,20,0.85)",
              border: "2px solid",
              borderColor: introAccent,
              borderRadius: { xs: 2, sm: 3 },
              px: { xs: 1.25, sm: 2, md: 2.5 },
              py: { xs: 0.75, sm: 1.25, md: 1.5 },
              boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            }}
          >
            <MusicNoteIcon sx={{ color: introAccent, fontSize: { xs: "1.3rem", sm: "1.8rem", md: "2.2rem" } }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                noWrap
                sx={{ color: "white", fontWeight: 700, lineHeight: 1.25, fontSize: { xs: "0.95rem", sm: "1.4rem", md: "2.5rem" } }}
              >
                {introContent?.title ?? ""}
              </Typography>
              {introContent?.channelTitle && (
                <Typography variant="body2" noWrap sx={{ color: "grey.400", fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" } }}>
                  {introContent.channelTitle}
                </Typography>
              )}
            </Box>
          </Stack>
        </Zoom>
      </Box>

      {/* Duration badge: shows DURATION_BADGE_VISIBLE_MS starting DURATION_BADGE_DELAY_MS after the video started. ~3x a normal small Chip on the md+ TV screen. */}
      <Box sx={{ position: "absolute", top: { xs: 8, sm: 16 }, right: { xs: 8, sm: 16 }, pointerEvents: "none" }}>
        <Grow in={durationBadgeVisible} timeout={250}>
          <Chip
            icon={<ScheduleIcon sx={{ color: "white !important", fontSize: { xs: "1.1rem !important", sm: "1.6rem !important", md: "2.4rem !important" } }} />}
            label={durationBadgeSeconds !== null ? formatDuration(durationBadgeSeconds) : ""}
            sx={{
              bgcolor: "rgba(0,0,0,0.7)",
              color: "white",
              fontWeight: 600,
              height: { xs: 28, sm: 44, md: 72 },
              borderRadius: { xs: 2, sm: 3, md: 4 },
              "& .MuiChip-label": { fontSize: { xs: "0.8rem", sm: "1.3rem", md: "2.4rem" }, px: { xs: 0.75, sm: 1.5, md: 2 } },
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
          top: { xs: 8, sm: 16 },
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: { xs: 0.75, sm: 1.5 },
          px: { xs: 1.5, sm: 3 },
        }}
      >
        <Slide
          in={newRequestVisible}
          direction="down"
          timeout={{ enter: 300, exit: 200 }}
          style={{ pointerEvents: "none" }}
        >
          <Chip
            label={newRequestNotice ? `🎵 新しいリクエスト: ${newRequestNotice.title}` : ""}
            sx={{
              maxWidth: "90%",
              height: { xs: 28, sm: 44, md: 64 },
              fontSize: { xs: "0.75rem", sm: "1.1rem", md: "1.625rem" },
              fontWeight: 600,
              bgcolor: noticeAccent,
              color: theme.palette.getContrastText(noticeAccent),
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                px: { xs: 1, sm: 1.5, md: 2 },
              },
            }}
          />
        </Slide>

        {/* Vote-status badge: current like tally for the
            playing request, shown on start (if non-zero) and again on
            every increase. ~6x a normal small Chip on the md+ TV screen. */}
        <Grow in={voteStatusVisible} timeout={250} style={{ pointerEvents: "none" }}>
          <Stack direction="row" spacing={{ xs: 0.75, sm: 1.5 }}>
            {voteStatusContent && voteStatusContent.likes > 0 && (
              <Chip
                label={`😊+${voteStatusContent.likes}`}
                sx={{
                  bgcolor: "rgba(0,0,0,0.7)",
                  color: "white",
                  fontWeight: 700,
                  height: { xs: 36, sm: 64, md: 144 },
                  borderRadius: { xs: 2.5, sm: 4, md: 6 },
                  "& .MuiChip-label": { fontSize: { xs: "1.1rem", sm: "2rem", md: "4.8rem" }, px: { xs: 1, sm: 2, md: 5 } },
                }}
              />
            )}
          </Stack>
        </Grow>
      </Box>

      {/* 意思表示: an admin-triggered message or image, centered and
          semi-transparent, for as long as useBroadcastOverlay reports one
          (10 seconds). pointerEvents "none" so it never blocks the
          video/queue controls underneath. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 4 },
          pointerEvents: "none",
        }}
      >
        <Fade in={broadcastState !== null} timeout={{ enter: 300, exit: 400 }}>
          <Box sx={{ maxWidth: "85%", maxHeight: "85%", display: "flex" }}>
            {broadcastState?.kind === "image" && broadcastState.imageVersion ? (
              <Box
                component="img"
                src={broadcastImageUrl(broadcastState.imageVersion)}
                alt=""
                sx={{ maxWidth: "100%", maxHeight: "100%", opacity: 0.85, borderRadius: 2 }}
              />
            ) : (
              <Paper
                elevation={6}
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.7)",
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h5"
                  align="center"
                  sx={{ color: "white", fontWeight: 600, whiteSpace: "pre-line", wordBreak: "break-word" }}
                >
                  {broadcastState?.text ?? ""}
                </Typography>
              </Paper>
            )}
          </Box>
        </Fade>
      </Box>

      {/* 早送りタイムのペーシング通知: 右端からポップアウトする2種類の
          かわいい通知 — 動画開始時に「予定◯分」、その後残り1分になったら
          再表示。RequestSidePlayerの反応レール(縦中央・右端)と被らないよう
          その少し上に配置。pointerEvents "none" でクリックは透過させる。 */}
      <Box
        sx={{
          position: "absolute",
          right: { xs: 8, sm: 12 },
          top: { xs: "22%", sm: "25%" },
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 1,
          pointerEvents: "none",
        }}
      >
        <Slide in={scheduledVisible} direction="left" timeout={{ enter: 300, exit: 250 }}>
          <Chip
            icon={<span style={{ fontSize: "1.1em" }}>⏱️</span>}
            label={`予定 ${formatDuration(scheduledSeconds)}`}
            sx={{
              height: { xs: 60, sm: 80 },
              fontWeight: 700,
              bgcolor: "#FFD166",
              color: "#5C3D00",
              boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
              "& .MuiChip-label": { fontSize: { xs: "1.5rem", sm: "1.9rem" }, px: 2 },
              "& .MuiChip-icon": { ml: 2, fontSize: "1.6rem" },
            }}
          />
        </Slide>
        <Slide in={oneMinuteLeftVisible} direction="left" timeout={{ enter: 300, exit: 250 }}>
          <Chip
            icon={<span style={{ fontSize: "1.1em" }}>⏰</span>}
            label="残り1分!"
            sx={{
              height: { xs: 60, sm: 80 },
              fontWeight: 700,
              bgcolor: "#FF6F91",
              color: "white",
              boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
              "& .MuiChip-label": { fontSize: { xs: "1.5rem", sm: "1.9rem" }, px: 2 },
              "& .MuiChip-icon": { ml: 2, fontSize: "1.6rem" },
            }}
          />
        </Slide>
      </Box>
    </>
  );
}
