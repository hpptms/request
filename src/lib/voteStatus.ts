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

// increasedVoteStatus keeps only the kinds that went up since last and
// zeroes the rest, so the badge pops just the vote that came in (e.g. a new
// super like doesn't re-show an existing スベってる). likes stays encoded as
// the total (plain + super×2) the badge expects.
export function increasedVoteStatus(last: VoteStatus, current: VoteStatus): VoteStatus {
  const plainLast = last.likes - last.superLikes * 2;
  const plainCurrent = current.likes - current.superLikes * 2;
  const plain = plainCurrent > plainLast ? plainCurrent : 0;
  const superLikes = current.superLikes > last.superLikes ? current.superLikes : 0;
  const suberu = current.suberu > last.suberu ? current.suberu : 0;
  return { cancelVotes: current.cancelVotes, likes: plain + superLikes * 2, superLikes, suberu };
}
