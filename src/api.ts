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
  RecentBadVoter,
  SearchResult,
  StatsSummary,
  SuspiciousFingerprint,
  TimeSlot,
  VideoRequest,
  VoteOnlyVoter,
} from "./types";
import { getDeviceFingerprint } from "./lib/deviceFingerprint";

// Relative by default: works both behind the Docker/nginx reverse proxy and
// with the Vite dev server proxy configured in vite.config.ts. Override via
// VITE_API_BASE_URL only if the API is served from a different origin.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      // See deviceFingerprint.ts / backend/internal/fingerprint: a
      // heuristic signal only, read solely by the admin BAN page — sent on
      // every call for simplicity, harmless on endpoints that ignore it.
      "X-Device-Fingerprint": getDeviceFingerprint(),
    },
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
  getStats: (period: "day" | "week" | "all", date?: string, timeOfDay?: TimeSlot) => {
    const params = new URLSearchParams({ period });
    if (date) params.set("date", date);
    if (timeOfDay) params.set("timeOfDay", timeOfDay);
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

  // temporary: true bans for 1 hour (auto-lifted); omitted/false bans
  // permanently until an admin manually unbans.
  adminBanIP: (ip: string, temporary?: boolean) =>
    request<{ ok: boolean }>("/admin/bans", {
      method: "POST",
      body: JSON.stringify({ ip, temporary: !!temporary }),
    }),

  adminUnbanIP: (ip: string) =>
    request<void>(`/admin/bans/${encodeURIComponent(ip)}`, { method: "DELETE" }),

  // Device fingerprints currently sighted from several distinct IPs in a
  // short span — a heuristic for someone rotating through a proxy/VPN pool
  // (see backend/internal/fingerprint). Never banned automatically.
  adminListSuspiciousFingerprints: () =>
    request<SuspiciousFingerprint[]>("/admin/suspicious-fingerprints"),

  // IPs that have cast a cancel vote (BAD投票) but never submitted a
  // request themselves. Never banned automatically.
  adminListVoteOnlyVoters: () => request<VoteOnlyVoter[]>("/admin/vote-only-voters"),

  // IPs that have cast a cancel vote (BAD投票) within the last few minutes
  // (see backend's RecentBadVoteWindow), including IPs that have also
  // submitted requests themselves. Never banned automatically.
  adminListRecentBadVoters: () => request<RecentBadVoter[]>("/admin/recent-bad-voters"),

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
