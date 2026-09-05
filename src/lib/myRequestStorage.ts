// Remembers which requests this browser itself submitted, purely so the UI
// can show a "キャンセル" button only on your own requests. The server is
// the source of truth for authorization (matched by IP, see
// DELETE /requests/{id}/mine) — this is just local polish so strangers'
// requests don't show a button that would just 403.
const STORAGE_KEY = "recest:myRequestIds";

function readMyIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function isMyRequest(id: string): boolean {
  return readMyIds().has(id);
}

export function markMyRequest(id: string): void {
  try {
    const ids = readMyIds();
    ids.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignore storage failures (private browsing, quota, etc.) — worst case
    // the cancel button just doesn't show up for this request.
  }
}
