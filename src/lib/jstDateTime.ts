// Helpers for date-times the admin enters and visitors read in Japan time
// (JST, UTC+9, no DST), whatever the browser's own time zone is.

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// A JST wall-clock Date: its UTC fields read as the JST date/time.
function jstFields(date: Date): Date {
  return new Date(date.getTime() + JST_OFFSET_MS);
}

const pad = (n: number) => String(n).padStart(2, "0");

// An instant as a <input type="datetime-local"> value in JST.
export function toJstInput(iso: string | Date): string {
  const d = jstFields(new Date(iso));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

// A datetime-local value read as JST, as an ISO instant.
export function fromJstInput(value: string): string {
  return new Date(`${value}:00+09:00`).toISOString();
}

// The coming Sunday 23:59 JST (today's if it's Sunday and not yet past).
export function nextSundayEndJst(now = new Date()): Date {
  const d = jstFields(now);
  const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + ((7 - d.getUTCDay()) % 7), 23, 59) - JST_OFFSET_MS;
  return new Date(end);
}

// An instant in JST for display, e.g. "11/1(日) 23:59".
export function formatJst(iso: string): string {
  const d = jstFields(new Date(iso));
  const weekday = "日月火水木金土"[d.getUTCDay()];
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${weekday}) ${d.getUTCHours()}:${pad(d.getUTCMinutes())}`;
}
