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
}

export interface AppConfig {
  searchEnabled: boolean;
  cancelVoteThreshold: number;
}

export interface CancelVoteResult {
  voteCount: number;
  threshold: number;
  cancelled: boolean;
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

export interface BannedIP {
  ip: string;
  bannedAt: string;
}
