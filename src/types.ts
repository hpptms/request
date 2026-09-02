export type RequestStatus = "pending" | "playing" | "done";

export interface VideoRequest {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  requesterName: string;
  status: RequestStatus;
  createdAt: string;
  cancelVotes: number;
  likes: number;
}

export interface AppConfig {
  searchEnabled: boolean;
  cancelVoteThreshold: number;
  likePriorityThreshold: number;
}

export interface CancelVoteResult {
  voteCount: number;
  threshold: number;
}

export interface LikeResult {
  likeCount: number;
  priorityThreshold: number;
}

export interface SearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

export interface AdminVideoRequest extends VideoRequest {
  requesterIP: string;
}

export type FallbackRegion = "world" | "japan";

export interface FallbackTrack {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  region: FallbackRegion;
}

export interface BannedIP {
  ip: string;
  bannedAt: string;
}

// A single entry in the admin-curated playlist the viewer screen plays, in
// order, whenever the request queue is empty. Distinct from FallbackTrack
// (the automatic World/Japan Top 100 fallback): this list is a plain,
// ordered list of URLs the admin controls directly.
export interface PlaylistTrack {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  url: string;
}

export interface PlaylistResolveError {
  line: number;
  url: string;
  message: string;
}

export interface PlaylistUpdateResult {
  tracks: PlaylistTrack[];
  errors: PlaylistResolveError[];
}

// Result of expanding a YouTube playlist URL into its member videos' watch
// URLs (see AdminPlaylistPage) — these aren't saved yet, just handed back
// for the admin to review/prune before the existing save flow resolves them.
export interface PlaylistImportResult {
  urls: string[];
}
