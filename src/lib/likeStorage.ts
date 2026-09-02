// Remembers which requests this browser has already liked, purely so the UI
// can disable the button after liking. The server is the source of truth for
// counting (deduped by IP) — this is just local polish.
const STORAGE_KEY = "recest:likedRequestIds";

function readLikedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function hasLiked(id: string): boolean {
  return readLikedIds().has(id);
}

export function markLiked(id: string): void {
  try {
    const ids = readLikedIds();
    ids.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignore storage failures (private browsing, quota, etc.) — worst case
    // the button just stays enabled.
  }
}
