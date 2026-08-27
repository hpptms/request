// Played by the viewer when the request queue is empty, so there's always
// something on screen. Purely client-side — edit this list to change what
// plays during idle time; the backend is never involved.
export const FALLBACK_VIDEO_IDS = [
  "dQw4w9WgXcQ", // Rick Astley - Never Gonna Give You Up
  "9bZkp7q19f0", // PSY - Gangnam Style
  "kJQP7kiw5Fk", // Luis Fonsi - Despacito
  "fJ9rUzIMcZQ", // Queen - Bohemian Rhapsody
  "JGwWNGJdvx8", // Ed Sheeran - Shape of You
  "OPf0YbXqDm0", // Mark Ronson ft. Bruno Mars - Uptown Funk
];

// Picks a random video from the fallback list, avoiding an immediate repeat
// of excludeId when there's more than one option.
export function pickRandomFallbackVideoId(excludeId: string | null): string {
  const candidates =
    FALLBACK_VIDEO_IDS.length > 1
      ? FALLBACK_VIDEO_IDS.filter((id) => id !== excludeId)
      : FALLBACK_VIDEO_IDS;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
