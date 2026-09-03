import type {
  AdminVideoRequest,
  AppConfig,
  BannedIP,
  CancelVoteResult,
  FallbackTrack,
  LikeResult,
  PlaylistImportResult,
  PlaylistTrack,
  PlaylistUpdateResult,
  SearchResult,
  VideoRequest,
} from "./types";

// Relative by default: works both behind the Docker/nginx reverse proxy and
// with the Vite dev server proxy configured in vite.config.ts. Override via
// VITE_API_BASE_URL only if the API is served from a different origin.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
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

  listRequests: () => request<VideoRequest[]>("/requests"),

  createRequest: (url: string, requesterName: string) =>
    request<VideoRequest>("/requests", {
      method: "POST",
      body: JSON.stringify({ url, requesterName }),
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
};
