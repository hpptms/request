import type { VideoRequest } from "../types";
import { getPlayableSeconds } from "./playableSeconds";

// 長い動画もOKモードの時短ルール (see AppConfig.longVideoModeActive): while
// the mode is on, a video longer than thresholdSeconds is paced to
// capSeconds during fast-forward instead of the usual fast-forward base.
export interface LongVideoFastForward {
  active: boolean;
  thresholdSeconds: number;
  capSeconds: number;
}

export const DEFAULT_LONG_VIDEO_FAST_FORWARD: LongVideoFastForward = {
  active: false,
  thresholdSeconds: 600,
  capSeconds: 300,
};

// The long-video fast-forward base for r, or null when the normal
// fast-forward rules apply. Mirrors durationlimit.LongFastForwardApplies.
export function longVideoFastForwardCap(
  r: Pick<VideoRequest, "durationSeconds" | "startSeconds" | "endSeconds"> | null,
  rule: LongVideoFastForward,
): number | null {
  if (!r || !rule.active || getPlayableSeconds(r) <= rule.thresholdSeconds) return null;
  return rule.capSeconds;
}
