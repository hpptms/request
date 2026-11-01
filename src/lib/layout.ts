// Phones held sideways: wide enough for MUI's sm/md breakpoints but far too
// short for a stacked video-over-queue layout, so /play switches to a
// side-by-side layout for them (see PlayPage / RequestSidePlayer).
export const LANDSCAPE_PHONE = "@media (orientation: landscape) and (max-height: 500px)";

// Body column of the text pages (guide/FAQ/notice/...). MUI's "sm" container
// caps at 600px, which left a tablet (768–1180px wide) mostly empty margin;
// widen it to 720px from sm up — still a comfortable line length for
// Japanese text — and keep phones edge-to-edge.
export const TEXT_CONTAINER_SX = {
  py: { xs: 2, sm: 4 },
  px: { xs: 1.5, sm: 3 },
  maxWidth: { sm: 720 },
} as const;
