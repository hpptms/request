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
  // Set when the requester used the "2分でリクエスト" button — see
  // AppConfig.twoMinuteRequestCapSeconds and ViewerPage's
  // playback-capping effect.
  twoMinuteRequest?: boolean;
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
  // A request made with the "2分でリクエスト" button (VideoRequest's
  // twoMinuteRequest) is capped at this many seconds — see ViewerPage's
  // playback-capping effect.
  twoMinuteRequestCapSeconds: number;
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

// A device fingerprint (backend/internal/fingerprint) currently sighted
// from several distinct IPs in a short span — a heuristic for one device
// rotating through a proxy/VPN pool to look like many visitors. Shown on
// the admin BAN page's プロクシっぽいユーザー section for the admin to
// review and ban some or all of `ips` by hand; nothing here is ever banned
// automatically.
export interface SuspiciousFingerprint {
  fingerprint: string;
  ips: string[];
  lastSeen: string;
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

// One video's counters (backend/internal/analytics.VideoStat) over whatever
// date range produced them (a day, a week, or all time), tallied across
// every request for it in that range, including requests long since
// finished and dropped from the live queue.
export interface VideoStat {
  platform: string;
  videoId: string;
  title: string;
  channelTitle: string;
  requestCount: number;
  totalLikes: number;
  totalCancelVotes: number;
}

// One channel/artist's request count over the same range, summed across
// every video seen under that exact channel title.
export interface ChannelStat {
  channelTitle: string;
  requestCount: number;
}

export type StatsPeriod = "day" | "week" | "all";

// backend/internal/api.statsResponse — the admin stats screen's view of
// every ranking for one period, each already sorted highest-first and
// capped at the backend's topN. rangeStart/rangeEnd (both YYYY-MM-DD) are
// omitted for period "all" and otherwise echo back exactly what the server
// computed (e.g. today's date, or the Monday-Sunday week containing it),
// so the admin UI's prev/next navigation stays in sync with the server
// rather than re-deriving "today" itself.
export interface StatsSummary {
  period: StatsPeriod;
  rangeStart?: string;
  rangeEnd?: string;
  topChannelsByRequests: ChannelStat[];
  topVideosByRequests: VideoStat[];
  topVideosByLikes: VideoStat[];
  topVideosByCancelVotes: VideoStat[];
}
