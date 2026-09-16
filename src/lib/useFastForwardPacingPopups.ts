import { useEffect, useRef, useState } from "react";

const SCHEDULED_POPUP_VISIBLE_MS = 5000;
const ONE_MINUTE_LEFT_POPUP_VISIBLE_MS = 5000;
const ONE_MINUTE_LEFT_SECONDS = 60;

// During a backlog fast-forward window, shows two short "pop out" notices
// on the player: once when a new video starts, how long it's scheduled to
// play for (fastForwardCapSeconds — see store.fastForwardFloorLocked,
// which varies video to video depending on how light the backlog is), and
// again once it has a minute left of that schedule.
//
// Timed with plain setTimeouts anchored to whatever fastForwardCapSeconds
// happens to be right when the video starts, rather than polling elapsed
// playback time against the live (occasionally-recomputed) value — good
// enough for a cosmetic notice, and works the same whether the caller has
// real elapsed-time tracking (ViewerPage, via the YouTube IFrame API) or
// not (RequestSidePlayer, a plain <iframe> with no programmatic time
// access). One consequence: if fastForwardActive only becomes true partway
// through a video already playing, the "1分" timer is scheduled from *now*
// rather than from when the video actually started, so it can fire a bit
// late relative to the real remaining time — acceptable for a notice this
// disposable.
export function useFastForwardPacingPopups(
  nowPlayingId: string | null,
  fastForwardActive: boolean,
  fastForwardCapSeconds: number,
) {
  const [scheduledVisible, setScheduledVisible] = useState(false);
  const [scheduledSeconds, setScheduledSeconds] = useState(0);
  const [oneMinuteLeftVisible, setOneMinuteLeftVisible] = useState(false);

  // Which nowPlayingId these popups have already fired for, so a poll that
  // just re-confirms the same video (or a later recompute of
  // fastForwardCapSeconds — see the module doc above) doesn't restart them.
  const shownForRef = useRef<string | null>(null);
  // Read for its value only at the moment a new video starts (see below),
  // kept fresh by a separate effect so the main one doesn't need it as a
  // dependency.
  const capSecondsRef = useRef(fastForwardCapSeconds);

  useEffect(() => {
    capSecondsRef.current = fastForwardCapSeconds;
  }, [fastForwardCapSeconds]);

  useEffect(() => {
    let scheduledHideTimer: number | null = null;
    let oneMinuteShowTimer: number | null = null;
    let oneMinuteHideTimer: number | null = null;
    // Undoes everything this effect run did — timers AND shownForRef —
    // rather than just clearing timers. Cleanup must fully reverse the
    // effect (not just half of it) so React 18 StrictMode's dev-only
    // mount→cleanup→mount double-invoke redoes setup correctly on the
    // second mount instead of finding shownForRef already claimed and
    // silently skipping it, which would leave a timer-less "visible"
    // state stuck forever (its hide timeout having been cancelled by the
    // interposed cleanup with nothing left to re-schedule it).
    const cleanup = () => {
      if (scheduledHideTimer !== null) window.clearTimeout(scheduledHideTimer);
      if (oneMinuteShowTimer !== null) window.clearTimeout(oneMinuteShowTimer);
      if (oneMinuteHideTimer !== null) window.clearTimeout(oneMinuteHideTimer);
      shownForRef.current = null;
    };

    if (!nowPlayingId || !fastForwardActive) {
      setScheduledVisible(false);
      setOneMinuteLeftVisible(false);
      return cleanup;
    }
    if (shownForRef.current === nowPlayingId) {
      return cleanup;
    }
    const capSeconds = capSecondsRef.current;
    if (capSeconds <= 0) {
      return cleanup;
    }
    shownForRef.current = nowPlayingId;

    setScheduledSeconds(capSeconds);
    setScheduledVisible(true);
    scheduledHideTimer = window.setTimeout(() => setScheduledVisible(false), SCHEDULED_POPUP_VISIBLE_MS);

    if (capSeconds > ONE_MINUTE_LEFT_SECONDS) {
      const delayMs = (capSeconds - ONE_MINUTE_LEFT_SECONDS) * 1000;
      oneMinuteShowTimer = window.setTimeout(() => {
        setOneMinuteLeftVisible(true);
        oneMinuteHideTimer = window.setTimeout(() => setOneMinuteLeftVisible(false), ONE_MINUTE_LEFT_POPUP_VISIBLE_MS);
      }, delayMs);
    }

    return cleanup;
  }, [nowPlayingId, fastForwardActive]);

  return { scheduledVisible, scheduledSeconds, oneMinuteLeftVisible };
}
