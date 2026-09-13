// Shared timing for the "now playing" overlay pieces (title/duration card,
// new-request toast, vote-status badge) used by both the admin ViewerPage
// player and the public-facing RequestSidePlayer — kept in one place so the
// two stay visually in sync.

// How long the music-program-style title card stays up when a video starts,
// and how long after that the duration badge shows.
export const NOW_PLAYING_INTRO_MS = 20000;
export const DURATION_BADGE_DELAY_MS = 5000;
// Kept equal to the title card's own visible time, per that request.
export const DURATION_BADGE_VISIBLE_MS = NOW_PLAYING_INTRO_MS;
export const NEW_REQUEST_NOTICE_MS = 4000;
export const VOTE_STATUS_VISIBLE_MS = 4000;
