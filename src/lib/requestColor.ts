// Deterministic accent color per video, so the now-playing title card and
// the new-request toast (PlayerOverlays.tsx) show a variety of colors
// instead of always the same theme red — while the same video still always
// gets the same color, so a toast and the title card that follows it match.

// A small fixed categorical palette, picked to stay legible as both a
// border against the title card's near-black background and a filled chip
// background (with contrast-aware text — see PlayerOverlays.tsx).
const REQUEST_ACCENT_COLORS = [
  "#ef5350", // red
  "#ff9800", // orange
  "#fbc02d", // amber
  "#43a047", // green
  "#00acc1", // teal
  "#1e88e5", // blue
  "#8e24aa", // purple
  "#d81b60", // pink
];

// FNV-1a: same small non-cryptographic hash as deviceFingerprint.ts, good
// enough here since it only has to spread videoIds across a handful of
// colors, not resist collisions.
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function requestAccentColor(videoId: string): string {
  if (!videoId) return REQUEST_ACCENT_COLORS[0];
  return REQUEST_ACCENT_COLORS[fnv1a(videoId) % REQUEST_ACCENT_COLORS.length];
}
