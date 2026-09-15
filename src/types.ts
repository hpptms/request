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
  // Present only for a temporary ban (admin panel's 1時間BAN button) — the
  // time it will be automatically lifted. Absent for a permanent (手動BAN)
  // or automatic ban.
  expiresAt?: string;
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

// An IP (backend/internal/devicemix) currently sighted with more than one
// device class (desktop vs. mobile, by User-Agent) in a short span — a
// heuristic for more than one physical device (e.g. a PC and a phone)
// posting from behind the same address, most commonly a shared home/office
// network. Unlike SuspiciousFingerprint (one fingerprint, many IPs), this
// is the mirror case: one IP, several device classes. Shown on the admin
// BAN page's 複数端末から投稿しているIP section for the admin to review;
// nothing here is ever banned automatically.
export interface MultiDeviceIP {
  ip: string;
  classes: string[];
  lastSeen: string;
}

// An IP that has cast at least one cancel vote (BAD投票) within the last
// hour and has never itself submitted a request
// (backend/internal/store.Store.VoteOnlyVoters, windowed by
// VoteOnlyVoterWindow). Shown on the admin BAN page for the admin to
// review and ban by hand; nothing here is ever banned automatically.
export interface VoteOnlyVoter {
  ip: string;
  voteCount: number;
  lastVoteAt: string;
}

// An IP that has cast at least one cancel vote (BAD投票) within the last
// few minutes (backend/internal/store.Store.RecentBadVoters). Unlike
// VoteOnlyVoter, this includes IPs that have also submitted requests
// themselves — it's about who's actively pressing "bad" right now.
// Time-boxed on the backend so the list stays a manageable size. Shown on
// the admin BAN page for the admin to review and ban by hand; nothing here
// is ever banned automatically.
// One cancel vote making up a RecentBadVoter's votes — which video it was
// cast against.
export interface RecentBadVote {
  requestId: string;
  title: string;
  thumbnailUrl: string;
  votedAt: string;
}

export interface RecentBadVoter {
  ip: string;
  voteCount: number;
  lastVoteAt: string;
  // Newest first. Empty for a vote whose request has since been deleted —
  // it still counts toward voteCount, but there's no title/thumbnail left.
  votes: RecentBadVote[];
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

// backend/internal/analytics.TimeSlot — a broad part of the JST day
// (morning 05-10, daytime 11-16, evening 17-21, midnight 22-04) a stats
// query can restrict itself to, on top of period/date. "" (omitted) means
// every time of day, matching the pre-existing (unfiltered) behavior.
export type TimeSlot = "" | "morning" | "daytime" | "evening" | "midnight";

// backend/internal/api.statsResponse — the admin stats screen's view of
// every ranking for one period (and, if any, time-of-day slot), each
// already sorted highest-first and capped at the backend's topN.
// rangeStart/rangeEnd (both YYYY-MM-DD) are omitted for period "all" and
// otherwise echo back exactly what the server computed (e.g. today's date,
// or the Monday-Sunday week containing it), so the admin UI's prev/next
// navigation stays in sync with the server rather than re-deriving "today"
// itself.
export interface StatsSummary {
  period: StatsPeriod;
  rangeStart?: string;
  rangeEnd?: string;
  timeOfDay?: TimeSlot;
  topChannelsByRequests: ChannelStat[];
  topVideosByRequests: VideoStat[];
  topVideosByLikes: VideoStat[];
  topVideosByCancelVotes: VideoStat[];
}
