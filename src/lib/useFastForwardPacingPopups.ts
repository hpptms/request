import { useEffect, useRef, useState } from "react";

const SCHEDULED_POPUP_VISIBLE_MS = 5000;
const ONE_MINUTE_LEFT_POPUP_VISIBLE_MS = 5000;
const ONE_MINUTE_LEFT_SECONDS = 60;

// During a backlog fast-forward window, shows two short "pop out" notices
// on the player: once when a new video starts, how long it's scheduled to
// play for (fastForwardCapSeconds — see store.fastForwardFloorLocked; in a
// like-extended window the caller passes the base plus the per-like
// extension for the playing request), and again once it has a minute left
// of that schedule.
//
// The "予定" notice uses whatever fastForwardCapSeconds is right when the
// video starts. The "残り1分" timer is anchored to that start time but
// rescheduled whenever fastForwardCapSeconds changes afterwards (e.g. a
// like extends the playing request), so it tracks the extended schedule
// rather than firing early. Works the same whether the caller has real
// elapsed-time tracking (ViewerPage, via the YouTube IFrame API) or not
// (RequestSidePlayer, a plain <iframe> with no programmatic time access).
// One consequence: if fastForwardActive only becomes true partway through a
// video already playing, the start is taken as *now* rather than when the
// video actually started, so the "1分" notice can fire a bit late relative
// to the real remaining time — acceptable for a notice this disposable.
export function useFastForwardPacingPopups(
  nowPlayingId: string | null,
  fastForwardActive: boolean,
  fastForwardCapSeconds: number,
) {
  const [scheduledVisible, setScheduledVisible] = useState(false);
  const [scheduledSeconds, setScheduledSeconds] = useState(0);
  const [oneMinuteLeftVisible, setOneMinuteLeftVisible] = useState(false);

  // Which nowPlayingId these popups have already fired for, so a poll that
  // just re-confirms the same video doesn't restart them.
  const shownForRef = useRef<string | null>(null);
  // When the current video's popups started (Date.now()), for rescheduling
  // the "残り1分" timer against a changed cap; null when none is running.
  const startedAtRef = useRef<number | null>(null);
  // Whether "残り1分" already fired for the current video, so a later
  // extension doesn't show it twice.
  const oneMinuteFiredRef = useRef(false);
  // Read for its value only at the moment a new video starts (see below),
  // kept fresh by a separate effect so the main one doesn't need it as a
  // dependency.
  const capSecondsRef = useRef(fastForwardCapSeconds);

  useEffect(() => {
    capSecondsRef.current = fastForwardCapSeconds;
  }, [fastForwardCapSeconds]);

  useEffect(() => {
    let scheduledHideTimer: number | null = null;
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
      shownForRef.current = null;
      startedAtRef.current = null;
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
    startedAtRef.current = Date.now();
    oneMinuteFiredRef.current = false;

    setScheduledSeconds(capSeconds);
    setScheduledVisible(true);
    scheduledHideTimer = window.setTimeout(() => setScheduledVisible(false), SCHEDULED_POPUP_VISIBLE_MS);

    return cleanup;
  }, [nowPlayingId, fastForwardActive]);

  // (Re)schedules "残り1分" from the current video's start whenever the cap
  // or the video changes.
  useEffect(() => {
    const startedAt = startedAtRef.current;
    if (startedAt === null || oneMinuteFiredRef.current || fastForwardCapSeconds <= ONE_MINUTE_LEFT_SECONDS) {
      return;
    }
    let hideTimer: number | null = null;
    const delayMs = Math.max(0, startedAt + (fastForwardCapSeconds - ONE_MINUTE_LEFT_SECONDS) * 1000 - Date.now());
    const showTimer = window.setTimeout(() => {
      oneMinuteFiredRef.current = true;
      setOneMinuteLeftVisible(true);
      hideTimer = window.setTimeout(() => setOneMinuteLeftVisible(false), ONE_MINUTE_LEFT_POPUP_VISIBLE_MS);
    }, delayMs);
    return () => {
      window.clearTimeout(showTimer);
      if (hideTimer !== null) {
        // Already showing: hide now rather than leave it stuck visible
        // (oneMinuteFiredRef keeps the next run from re-showing it).
        window.clearTimeout(hideTimer);
        setOneMinuteLeftVisible(false);
      }
    };
  }, [nowPlayingId, fastForwardActive, fastForwardCapSeconds]);

  return { scheduledVisible, scheduledSeconds, oneMinuteLeftVisible };
}
