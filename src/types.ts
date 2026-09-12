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
  // Which video site videoId belongs to: "youtube" | "niconico" | "vimeo".
  // YouTube is driven by the IFrame Player API
  // (see ViewerPage); the others are shown as a plain
  // <iframe src={embedUrl}> with no
  // seek-guard/auto-advance-on-end/cancel-vote-shortening, since none of
  // those platforms expose an equivalent control API — queue advance for
  // them is a plain durationSeconds timer instead.
  platform: string;
  embedUrl?: string;
  durationSeconds?: number;
}

// One rung of the cancel-vote escalation ladder: once a request collects at
// least `votes` distinct cancel-voters, its playback is capped at
// `capSeconds` instead of playing out normally. See ViewerPage's
// playback-capping effect.
export interface CancelVoteTier {
  votes: number;
  capSeconds: number;
}

export interface AppConfig {
  searchEnabled: boolean;
  cancelVoteThreshold: number;
  likePriorityThreshold: number;
  // Ordered by ascending votes with descending capSeconds — more votes only
  // ever cuts playback shorter, never longer.
  cancelVoteTiers: CancelVoteTier[];
  // True 4x/day for 1 hour (00:00/06:00/12:00/18:00 JST), but only once
  // the pending queue has backed up past the backend's threshold — see
  // ViewerPage's playback-capping effect.
  fastForwardActive: boolean;
  fastForwardCapSeconds: number;
  // A request whose video is at least this long is capped at
  // durationLimitCapSeconds instead of playing out normally — see
  // ViewerPage's playback-capping effect and AdminFeaturesPage. 0 means the
  // admin has turned this off ("短縮しない").
  durationLimitThresholdSeconds: number;
  durationLimitCapSeconds: number;
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

// A "semi-banned" keyword (see backend/internal/keywordlimit): unlike
// BannedKeyword-style outright bans, a title/channel-title match here is
// perfectly allowed content — it just can't have more than limit requests
// pending/playing in the queue at once.
export interface KeywordLimit {
  keyword: string;
  limit: number;
}

// The admin-configured long-video shortening rule (see
// backend/internal/durationlimit): any request whose video is at least
// thresholdSeconds long is capped at capSeconds instead of playing out
// normally. thresholdSeconds of 0 means the feature is off ("短縮しない");
// capSeconds isn't itself editable.
export interface DurationLimit {
  thresholdSeconds: number;
  capSeconds: number;
}

// A daily fast-forward window (see backend/internal/fastforward): starting
// at hour (0-23, JST) and running for durationMinutes, during which a
// backed-up queue plays each request for only fastForwardCapSeconds
// (AppConfig) instead of the normal minimum.
export interface FastForwardWindow {
  hour: number;
  durationMinutes: number;
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

// One video's lifetime counters (backend/internal/analytics.VideoStat):
// tallied across every time it's ever been requested, including requests
// long since finished and dropped from the live queue.
export interface VideoStat {
  platform: string;
  videoId: string;
  title: string;
  channelTitle: string;
  requestCount: number;
  totalLikes: number;
  totalCancelVotes: number;
}

// One channel/artist's lifetime request count, summed across every video
// seen under that exact channel title.
export interface ChannelStat {
  channelTitle: string;
  requestCount: number;
}

// backend/internal/analytics.Summary — the admin stats screen's one-shot
// view of every ranking, each already sorted highest-first and capped at
// the backend's topN.
export interface StatsSummary {
  topChannelsByRequests: ChannelStat[];
  topVideosByRequests: VideoStat[];
  topVideosByLikes: VideoStat[];
  topVideosByCancelVotes: VideoStat[];
}
