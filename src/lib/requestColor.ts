// Deterministic accent color per video, so the now-playing title card and
// the new-request toast (PlayerOverlays.tsx) show a variety of colors
// instead of always the same theme red — while the same video still always
// gets the same color, so a toast and the title card that follows it match.

// 256 evenly spaced hues around the color wheel, at a fixed
// saturation/lightness tuned to stay legible both as a border against the
// title card's near-black background and as a filled chip background (text
// color there is chosen per-color via theme.palette.getContrastText, which
// accepts hsl() strings directly).
const PALETTE_SIZE = 256;
const SATURATION = 70;
const LIGHTNESS = 55;

// FNV-1a: same small non-cryptographic hash as deviceFingerprint.ts, good
// enough here since it only has to spread videoIds across PALETTE_SIZE
// buckets, not resist collisions.
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function requestAccentColor(videoId: string): string {
  const hue = videoId ? (fnv1a(videoId) % PALETTE_SIZE) * (360 / PALETTE_SIZE) : 0;
  return `hsl(${hue.toFixed(1)}, ${SATURATION}%, ${LIGHTNESS}%)`;
}
