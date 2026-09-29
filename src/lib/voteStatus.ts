import type { VideoRequest } from "../types";

// Tallies the vote-status badge shows (see voteStatusOf).
export interface VoteStatus {
  cancelVotes: number;
  likes: number;
  superLikes: number;
  suberu: number;
}

export function voteStatusOf(r: VideoRequest): VoteStatus {
  return { cancelVotes: r.cancelVotes, likes: r.likes, superLikes: r.superLikes ?? 0, suberu: r.suberu ?? 0 };
}

// hasVoteStatusIncrease reports whether any tally the badge shows went up
// since last (so a new like or スベってる re-shows it).
export function hasVoteStatusIncrease(last: VoteStatus, current: VoteStatus): boolean {
  return current.likes > last.likes || current.suberu > last.suberu;
}
