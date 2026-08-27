// Remembers which requests this browser has already cast a cancel vote for,
// purely so the UI can disable the button after voting. The server is the
// source of truth for counting (deduped by IP) — this is just local polish.
const STORAGE_KEY = "recest:votedRequestIds";

function readVotedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function hasVoted(id: string): boolean {
  return readVotedIds().has(id);
}

export function markVoted(id: string): void {
  try {
    const ids = readVotedIds();
    ids.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignore storage failures (private browsing, quota, etc.) — worst case
    // the button just stays enabled.
  }
}
