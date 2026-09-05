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
  // Which video site videoId belongs to: "youtube" | "niconico" | "bilibili"
  // | "vimeo" | "dailymotion". YouTube is driven by the IFrame Player API
  // (see ViewerPage); the others are shown as a plain
  // <iframe src={embedUrl}> with no
  // seek-guard/auto-advance-on-end/cancel-vote-shortening, since none of
  // those platforms expose an equivalent control API — queue advance for
  // them is a plain durationSeconds timer instead.
  platform: string;
  embedUrl?: string;
  durationSeconds?: number;
}

export interface AppConfig {
  searchEnabled: boolean;
  cancelVoteThreshold: number;
  likePriorityThreshold: number;
  // Reaching this many distinct cancel-voters drops the playback floor
  // even further, to cancelVoteSevereCapSeconds — below the normal
  // (cancelVoteThreshold) cap. See ViewerPage's playback-capping effect.
  cancelVoteSevereThreshold: number;
  cancelVoteSevereCapSeconds: number;
  // True 4x/day for 1 hour (00:00/06:00/12:00/18:00 JST), but only once
  // the pending queue has backed up past the backend's threshold — see
  // ViewerPage's playback-capping effect.
  fastForwardActive: boolean;
  fastForwardCapSeconds: number;
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
  reason: string;
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
