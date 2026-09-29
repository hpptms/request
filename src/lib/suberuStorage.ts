// Remembers which requests this browser has already pressed "スベってる" on,
// purely so the UI can disable the button afterwards. The server is the
// source of truth for counting (deduped per visitor) — see cancelVoteStorage.
const STORAGE_KEY = "recest:suberuRequestIds";

function readSuberuIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function hasSuberu(id: string): boolean {
  return readSuberuIds().has(id);
}

export function markSuberu(id: string): void {
  try {
    const ids = readSuberuIds();
    ids.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignore storage failures — worst case the button just stays enabled.
  }
}
