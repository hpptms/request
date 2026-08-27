// Last-resort videos played by the viewer when the request queue is empty
// AND the backend's World/Japan Top 100 fallback playlist (see api.ts's
// getFallbackPlaylist) isn't available yet — e.g. no YouTube API key
// configured, or the very first refresh hasn't completed. Purely
// client-side; the backend is never involved.
export const FALLBACK_VIDEO_IDS = [
  "dQw4w9WgXcQ", // Rick Astley - Never Gonna Give You Up
  "9bZkp7q19f0", // PSY - Gangnam Style
  "kJQP7kiw5Fk", // Luis Fonsi - Despacito
  "fJ9rUzIMcZQ", // Queen - Bohemian Rhapsody
  "JGwWNGJdvx8", // Ed Sheeran - Shape of You
  "OPf0YbXqDm0", // Mark Ronson ft. Bruno Mars - Uptown Funk
];

// Picks a random video id from candidates, avoiding an immediate repeat of
// excludeId when there's more than one option.
export function pickRandomFallbackVideoId(candidates: string[], excludeId: string | null): string {
  const pool = candidates.length > 1 ? candidates.filter((id) => id !== excludeId) : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}
