import type {
  AdminVideoRequest,
  AppConfig,
  BannedIP,
  CancelVoteResult,
  DurationLimit,
  FallbackTrack,
  FastForwardWindow,
  KeywordLimit,
  LikeResult,
  PlaylistImportResult,
  PlaylistTrack,
  PlaylistUpdateResult,
  SearchResult,
  StatsSummary,
  VideoRequest,
} from "./types";

// Relative by default: works both behind the Docker/nginx reverse proxy and
// with the Vite dev server proxy configured in vite.config.ts. Override via
// VITE_API_BASE_URL only if the API is served from a different origin.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    // Needed so the admin session cookie is sent/stored now that the API is
    // a separate origin (api.request.tokyo) from the frontend; harmless
    // no-op for same-origin dev (npm run dev / Docker preview).
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  getConfig: () => request<AppConfig>("/config"),

  // Public request/like/bad-vote rankings (backend/internal/analytics) for
  // one day, one week, or all recorded history — shown on both the public
  // board page and the admin panel's stats screen.
  getStats: (period: "day" | "week" | "all", date?: string) => {
    const params = new URLSearchParams({ period });
    if (date) params.set("date", date);
    return request<StatsSummary>(`/stats?${params}`);
  },

  listRequests: () => request<VideoRequest[]>("/requests"),

  createRequest: (url: string, requesterName: string, twoMinuteRequest = false) =>
    request<VideoRequest>("/requests", {
      method: "POST",
      body: JSON.stringify({ url, requesterName, twoMinuteRequest }),
    }),

  playRequest: (id: string) =>
    request<VideoRequest>(`/requests/${id}/play`, { method: "POST" }),

  doneRequest: (id: string) =>
    request<VideoRequest>(`/requests/${id}/done`, { method: "POST" }),

  // Called by the viewer screen when a video finishes playing on its own,
  // to advance the queue. Requires the same admin session the viewer
  // screen itself is gated behind.
  finishRequest: (id: string) =>
    request<VideoRequest>(`/requests/${id}/finish`, { method: "POST" }),

  deleteRequest: (id: string) =>
    request<void>(`/requests/${id}`, { method: "DELETE" }),

  // Self-service withdrawal: the server only allows this for the request's
  // own submitter (matched by IP), unlike deleteRequest above (admin-only).
  cancelMyRequest: (id: string) =>
    request<void>(`/requests/${id}/mine`, { method: "DELETE" }),

  voteCancel: (id: string) =>
    request<CancelVoteResult>(`/requests/${id}/cancel-vote`, { method: "POST" }),

  likeRequest: (id: string) =>
    request<LikeResult>(`/requests/${id}/like`, { method: "POST" }),

  search: (query: string) =>
    request<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`),

  // World/Japan Top 100 tracks played by the viewer screen when its queue is
  // empty. May be an empty list if the backend hasn't resolved any yet (or
  // has no YouTube API key configured) — callers should fall back to
  // fallbackPlaylist.ts's static list in that case.
  getFallbackPlaylist: () => request<FallbackTrack[]>("/fallback-playlist"),

  // Admin-curated playlist played, in order, whenever the request queue is
  // empty. Takes priority over getFallbackPlaylist above when non-empty.
  getPlaylist: () => request<PlaylistTrack[]>("/playlist"),

  adminSetPlaylist: (urls: string[]) =>
    request<PlaylistUpdateResult>("/admin/playlist", {
      method: "PUT",
      body: JSON.stringify({ urls }),
    }),

  // Expands a YouTube playlist URL into its member videos' watch URLs.
  // Doesn't save anything by itself — the caller appends the result into
  // the playlist textarea for review, then saves via adminSetPlaylist.
  adminImportYouTubePlaylist: (url: string) =>
    request<PlaylistImportResult>("/admin/playlist/import", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  adminLogin: (username: string, password: string) =>
    request<{ ok: boolean }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  adminLogout: () => request<void>("/admin/logout", { method: "POST" }),

  adminSession: () => request<{ authenticated: boolean }>("/admin/session"),

  adminListRequests: () => request<AdminVideoRequest[]>("/admin/requests"),

  adminListBans: () => request<BannedIP[]>("/admin/bans"),

  adminBanIP: (ip: string) =>
    request<{ ok: boolean }>("/admin/bans", {
      method: "POST",
      body: JSON.stringify({ ip }),
    }),

  adminUnbanIP: (ip: string) =>
    request<void>(`/admin/bans/${encodeURIComponent(ip)}`, { method: "DELETE" }),

  adminListKeywords: () => request<string[]>("/admin/keywords"),

  adminAddKeyword: (keyword: string) =>
    request<{ ok: boolean }>("/admin/keywords", {
      method: "POST",
      body: JSON.stringify({ keyword }),
    }),

  adminRemoveKeyword: (keyword: string) =>
    request<void>(`/admin/keywords/${encodeURIComponent(keyword)}`, { method: "DELETE" }),

  adminListKeywordLimits: () => request<KeywordLimit[]>("/admin/keywordlimits"),

  adminSetKeywordLimits: (entries: KeywordLimit[]) =>
    request<KeywordLimit[]>("/admin/keywordlimits", {
      method: "PUT",
      body: JSON.stringify({ entries }),
    }),

  adminListFastForward: () => request<FastForwardWindow[]>("/admin/fastforward"),

  adminSetFastForward: (windows: FastForwardWindow[]) =>
    request<FastForwardWindow[]>("/admin/fastforward", {
      method: "PUT",
      body: JSON.stringify({ windows }),
    }),

  adminGetDurationLimit: () => request<DurationLimit>("/admin/durationlimit"),

  adminSetDurationLimit: (thresholdSeconds: number) =>
    request<DurationLimit>("/admin/durationlimit", {
      method: "PUT",
      body: JSON.stringify({ thresholdSeconds }),
    }),
};
