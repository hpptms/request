import type { VideoRequest } from "../types";

// How much of the request's video actually plays: from startSeconds up to
// endSeconds (or the video's reported length, whichever comes first), or 0
// when neither is known. Mirrors the backend's Request.PlayableSeconds so the
// duration-limit check agrees with store.playbackFloorLocked.
export function getPlayableSeconds(r: Pick<VideoRequest, "durationSeconds" | "startSeconds" | "endSeconds">): number {
  const duration = r.durationSeconds ?? 0;
  const end = r.endSeconds ?? 0;
  const endAt = end > 0 && (duration <= 0 || end < duration) ? end : duration;
  if (endAt <= 0) return 0;
  const playable = endAt - (r.startSeconds ?? 0);
  return playable > 0 ? playable : endAt;
}
