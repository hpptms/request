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
import type { VoteStatus } from "../lib/voteStatus";

interface Props {
  // Music-program-style title card, shown while a video starts.
  introVisible: boolean;
  introContent: { title: string; channelTitle: string; videoId: string; requesterName?: string } | null;
  // 今日のテーマ (see useTodayTheme): shown just above the title card, popping
  // in and out together with it. Nothing extra is shown while empty.
  todayThemes: string[];
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
  // Vote-status badge (😊 likes / 😒 スベってる) for whatever's playing.
  voteStatusVisible: boolean;
  voteStatusContent: VoteStatus | null;
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
  todayThemes,
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
      {/* Music-program-style title card (with 今日のテーマ stacked above it): pops in when a video starts, pops out after NOW_PLAYING_INTRO_MS. Border color varies per video (requestAccentColor) instead of always the theme red. */}
      <Box sx={{ position: "absolute", left: 0, right: 0, bottom: { xs: 8, sm: 16, md: 24 }, display: "flex", flexDirection: "column", alignItems: "center", gap: { xs: 0.5, sm: 1, md: 1.5 }, px: { xs: 1.5, sm: 3 }, pointerEvents: "none" }}>
        {/* Requester name stacked above 今日のテーマ (side by side they didn't fit next to two themes): same introVisible as the title card below, so they show and hide together. The name badge only appears when the requester filled one in. */}
        {(todayThemes.length > 0 || introContent?.requesterName) && (
          <Fade in={introVisible} timeout={{ enter: 200, exit: 250 }}>
            <Box sx={{ maxWidth: "90%", display: "flex", flexDirection: "column", alignItems: "center", gap: { xs: 0.5, sm: 1, md: 1.5 }, px: { xs: 1, md: 2 }, "& > *": { maxWidth: "100%" } }}>
              {introContent?.requesterName && <RequesterBadge name={introContent.requesterName} animate={introVisible} />}
              {todayThemes.length > 0 && <TodayThemeBadge texts={todayThemes} animate={introVisible} />}
            </Box>
          </Fade>
        )}
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
          queue.
          pointerEvents "none" on the column itself too: its hidden (but
          still laid-out) children keep it full-width and ~200px tall, which
          otherwise swallows clicks on the YouTube player's own top bar. */}
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
          pointerEvents: "none",
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
      </Box>

      {/* Vote-status badge: current like/スベってる tally for the
          playing request, shown on start (if non-zero) and again on
          every increase. ~6x a normal small Chip on the md+ TV screen.
          Pinned to the left edge, just below the centered new-request
          toast's row so a long toast title can't overlap it. */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: 44, sm: 72, md: 96 },
          left: { xs: 8, sm: 16 },
          pointerEvents: "none",
        }}
      >
        <Grow in={voteStatusVisible} timeout={250} style={{ pointerEvents: "none" }}>
          <Stack direction="row" spacing={{ xs: 0.75, sm: 1.5 }}>
            {/* voteStatusContent.likes is the total (super likes count as two in
                it), so subtract the super-like share to show only plain likes
                here — otherwise a super-liker shows up in both chips at once. */}
            {voteStatusContent && voteStatusContent.likes - voteStatusContent.superLikes * 2 > 0 && (
              <Chip
                label={`😊+${voteStatusContent.likes - voteStatusContent.superLikes * 2}`}
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
            {voteStatusContent && voteStatusContent.superLikes > 0 && (
              <Chip
                label={`😍+${voteStatusContent.superLikes}`}
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
            {voteStatusContent && voteStatusContent.suberu > 0 && (
              <Chip
                label={`😒+${voteStatusContent.suberu}`}
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

// Neon accent shared by the badge's edge bar, glow and label.
const THEME_NEON = "linear-gradient(180deg, #00E5FF, #B14DFF)";

// Animations shared by TodayThemeBadge and RequesterBadge. Spread into each
// badge's sx so they're injected even when only one badge is showing.
const BADGE_KEYFRAMES = {
  "@keyframes todayThemeWipe": {
    "0%": { clipPath: "inset(-40px 100% -40px -40px)" },
    "100%": { clipPath: "inset(-40px -40px -40px -40px)" },
  },
  "@keyframes todayThemeBreathe": {
    "0%, 100%": { opacity: 1, filter: "brightness(1)" },
    "50%": { opacity: 0.65, filter: "brightness(1.6)" },
  },
  "@keyframes todayThemeSweep": {
    "0%": { transform: "translateX(-110%)" },
    "45%, 100%": { transform: "translateX(110%)" },
  },
  "@keyframes todayThemeSlideIn": {
    "0%": { opacity: 0, transform: "translateX(-24px)" },
    "100%": { opacity: 1, transform: "translateX(0)" },
  },
  "@keyframes todayThemeTrack": {
    "0%": { opacity: 0, letterSpacing: "0.8em" },
    "100%": { opacity: 1, letterSpacing: "0.28em" },
  },
} as const;

// 今日のテーマ: a slanted, dark-glass plate with a neon edge, listing each of
// the day's themes on its own line. Its animations
// only run while animate is true, so they restart every time the title card
// comes back: the plate wipes open left-to-right, the label and text slide
// in after it, then a light sweep glints across it and the neon edge
// breathes for as long as it stays up.
function TodayThemeBadge({ texts, animate }: { texts: string[]; animate: boolean }) {
  const run = (value: string) => (animate ? value : "none");
  return (
    <Box
      sx={{
        position: "relative",
        minWidth: 0,
        display: "flex",
        overflow: "hidden",
        transform: "skewX(-14deg)",
        bgcolor: "rgba(6, 8, 18, 0.82)",
        backdropFilter: "blur(6px)",
        borderRadius: { xs: 0.5, md: 1 },
        boxShadow: "0 0 0 1px rgba(0, 229, 255, 0.45), 0 0 22px rgba(0, 229, 255, 0.35), 0 10px 30px rgba(0, 0, 0, 0.55)",
        pl: { xs: 2, sm: 2.75, md: 4 },
        pr: { xs: 1.5, sm: 2.25, md: 3.5 },
        py: { xs: 0.5, sm: 0.75, md: 1.1 },
        animation: run("todayThemeWipe 0.6s cubic-bezier(0.22, 1, 0.36, 1) both"),
        // Neon edge bar on the left.
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: { xs: 5, sm: 7, md: 10 },
          background: THEME_NEON,
          boxShadow: "0 0 14px rgba(0, 229, 255, 0.9)",
          animation: run("todayThemeBreathe 2.2s 0.6s ease-in-out infinite"),
        },
        // Light sweep glinting across the plate.
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: "linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.22) 50%, transparent 65%)",
          transform: "translateX(-110%)",
          animation: run("todayThemeSweep 3.6s 0.7s ease-in-out infinite"),
        },
        // Negative insets leave room for the outer neon glow once fully open.
        ...BADGE_KEYFRAMES,
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
          "&::before, &::after": { animation: "none" },
          "& *": { animation: "none !important" },
        },
      }}
    >
      {/* Undo the plate's skew so the text itself stays upright. */}
      <Box sx={{ transform: "skewX(14deg)", minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Box
          component="span"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "0.5rem", sm: "0.65rem", md: "0.95rem" },
            letterSpacing: "0.28em",
            lineHeight: 1.4,
            whiteSpace: "nowrap",
            background: "linear-gradient(90deg, #00E5FF, #B14DFF)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            animation: run("todayThemeTrack 0.7s 0.25s cubic-bezier(0.22, 1, 0.36, 1) both"),
          }}
        >
          TODAY&apos;S THEME ／ 今日のテーマ
        </Box>
        {/* One line per theme, each sliding in a beat after the one above. */}
        {texts.map((text, i) => (
          <Typography
            key={i}
            component="span"
            noWrap
            sx={{
              minWidth: 0,
              color: "#FFFFFF",
              fontWeight: 900,
              lineHeight: 1.25,
              letterSpacing: "0.04em",
              fontSize: { xs: "0.9rem", sm: "1.3rem", md: "2.1rem" },
              textShadow: "0 0 12px rgba(0, 229, 255, 0.55), 0 2px 4px rgba(0, 0, 0, 0.6)",
              animation: run(`todayThemeSlideIn 0.55s ${0.35 + i * 0.12}s cubic-bezier(0.22, 1, 0.36, 1) both`),
            }}
          >
            {text}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

// Warm counterpart to THEME_NEON, so the requester badge reads as a pair
// with 今日のテーマ without looking like a second theme.
const SELECT_NEON = "linear-gradient(180deg, #FFD54F, #FF4D8D)";

// "SELECT ／ 名前": who requested the playing video. Same slanted glass plate
// and animation sequence as TodayThemeBadge, slightly delayed so it lands
// just after it.
function RequesterBadge({ name, animate }: { name: string; animate: boolean }) {
  const run = (value: string) => (animate ? value : "none");
  return (
    <Box
      sx={{
        position: "relative",
        minWidth: 0,
        flexShrink: 1,
        display: "flex",
        overflow: "hidden",
        transform: "skewX(-14deg)",
        bgcolor: "rgba(18, 8, 12, 0.82)",
        backdropFilter: "blur(6px)",
        borderRadius: { xs: 0.5, md: 1 },
        boxShadow: "0 0 0 1px rgba(255, 77, 141, 0.45), 0 0 22px rgba(255, 77, 141, 0.35), 0 10px 30px rgba(0, 0, 0, 0.55)",
        pl: { xs: 2, sm: 2.75, md: 4 },
        pr: { xs: 1.5, sm: 2.25, md: 3.5 },
        py: { xs: 0.5, sm: 0.75, md: 1.1 },
        animation: run("todayThemeWipe 0.6s 0.15s cubic-bezier(0.22, 1, 0.36, 1) both"),
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: { xs: 5, sm: 7, md: 10 },
          background: SELECT_NEON,
          boxShadow: "0 0 14px rgba(255, 77, 141, 0.9)",
          animation: run("todayThemeBreathe 2.2s 0.75s ease-in-out infinite"),
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: "linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.22) 50%, transparent 65%)",
          transform: "translateX(-110%)",
          animation: run("todayThemeSweep 3.6s 1.1s ease-in-out infinite"),
        },
        ...BADGE_KEYFRAMES,
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
          "&::before, &::after": { animation: "none" },
          "& *": { animation: "none !important" },
        },
      }}
    >
      <Box sx={{ transform: "skewX(14deg)", minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Box
          component="span"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "0.5rem", sm: "0.65rem", md: "0.95rem" },
            letterSpacing: "0.28em",
            lineHeight: 1.4,
            whiteSpace: "nowrap",
            background: "linear-gradient(90deg, #FFD54F, #FF4D8D)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            animation: run("todayThemeTrack 0.7s 0.4s cubic-bezier(0.22, 1, 0.36, 1) both"),
          }}
        >
          SELECT
        </Box>
        <Typography
          component="span"
          noWrap
          sx={{
            minWidth: 0,
            color: "#FFFFFF",
            fontWeight: 900,
            lineHeight: 1.25,
            letterSpacing: "0.04em",
            fontSize: { xs: "0.9rem", sm: "1.3rem", md: "2.1rem" },
            textShadow: "0 0 12px rgba(255, 77, 141, 0.55), 0 2px 4px rgba(0, 0, 0, 0.6)",
            animation: run("todayThemeSlideIn 0.55s 0.5s cubic-bezier(0.22, 1, 0.36, 1) both"),
          }}
        >
          {name}
        </Typography>
      </Box>
    </Box>
  );
}
