import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { CancelVoteTier, VideoRequest } from "../types";
import { trackEvent } from "./analytics";
import { markMyRequest } from "./myRequestStorage";
import { setVoteQuota } from "./voteQuota";
import { visibleInterval } from "./visibleInterval";

const POLL_INTERVAL_MS = 4000;
// How many just-finished requests the board keeps open for like/bad.
const RECENT_DONE_COUNT = 5;
const DEFAULT_CANCEL_VOTE_THRESHOLD = 5;
const DEFAULT_LIKE_PRIORITY_THRESHOLD = 5;
// Mirrors the backend's default store.CancelVoteTiers (internal/store/store.go)
// until the real config loads.
const DEFAULT_CANCEL_VOTE_TIERS: CancelVoteTier[] = [
  { votes: 5, capSeconds: 120 },
  { votes: 10, capSeconds: 90 },
  { votes: 15, capSeconds: 60 },
  { votes: 20, capSeconds: 30 },
];
// Mirrors the backend's default store.FastForwardCancelVoteTiers
// (internal/store/store.go) until the real config loads.
const DEFAULT_FAST_FORWARD_CANCEL_VOTE_TIERS: CancelVoteTier[] = [
  { votes: 5, capSeconds: 60 },
  { votes: 10, capSeconds: 30 },
];

// Polling + request/vote/like/admin-action state shared by every public page
// that shows the live queue (BoardPage, PlayPage): both need the exact same
// data and handlers, just arranged in different layouts. `source` is echoed
// into trackEvent calls so analytics can tell which screen an action came
// from, matching the existing "board"/"viewer" convention.
export function useRequestQueue(source: string) {
  const [requests, setRequests] = useState<VideoRequest[]>([]);
  // Distinct from requests.length === 0: consumers that only want to render
  // once the real backlog is known (e.g. RequestSidePlayer's "seed on first
  // poll" new-request-toast logic) can gate on this instead of the
  // transient [] `requests` starts life as.
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [cancelVoteThreshold, setCancelVoteThreshold] = useState(DEFAULT_CANCEL_VOTE_THRESHOLD);
  const [cancelVoteTiers, setCancelVoteTiers] = useState<CancelVoteTier[]>(DEFAULT_CANCEL_VOTE_TIERS);
  // Backlog fast-forward mode (see AppConfig.fastForwardActive): while
  // active, fastForwardCancelVoteTiers is used instead of cancelVoteTiers
  // for the bad-vote button's next-tier label (see NowPlaying/
  // RequestSidePlayer) — kept in sync by the same config poll below.
  const [fastForwardActive, setFastForwardActive] = useState(false);
  const [fastForwardCancelVoteTiers, setFastForwardCancelVoteTiers] = useState<CancelVoteTier[]>(
    DEFAULT_FAST_FORWARD_CANCEL_VOTE_TIERS,
  );
  // How many seconds each video is currently being paced to (see
  // store.fastForwardFloorLocked) — used by useFastForwardPacingPopups for
  // its "予定" / "残り1分" notices, only meaningful while fastForwardActive.
  const [fastForwardCapSeconds, setFastForwardCapSeconds] = useState(0);
  const [likePriorityThreshold, setLikePriorityThreshold] = useState(DEFAULT_LIKE_PRIORITY_THRESHOLD);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.listRequests();
      setRequests(data);
      setRequestsLoaded(true);
    } catch {
      // Silently keep the last known state; the next poll will retry.
    }
  }, []);

  // Polled (not just fetched once) so a fast-forward window starting or
  // ending mid-session is reflected without reloading the page — same
  // pattern and interval as ViewerPage's own config poll.
  useEffect(() => {
    const fetchConfig = () => {
      api
        .getConfig()
        .then((config) => {
          setCancelVoteThreshold(config.cancelVoteThreshold);
          setCancelVoteTiers(config.cancelVoteTiers);
          setFastForwardActive(config.fastForwardActive);
          setFastForwardCapSeconds(config.fastForwardCapSeconds);
          setFastForwardCancelVoteTiers(config.fastForwardCancelVoteTiers);
          setLikePriorityThreshold(config.likePriorityThreshold);
        })
        .catch(() => {});
    };
    fetchConfig();
    return visibleInterval(fetchConfig, 30000);
  }, []);

  // The remaining hourly like/bad allowance recovers with time, so poll it
  // (votes also update it directly from their responses).
  useEffect(() => {
    const fetchQuota = () => {
      api.getMyVoteQuota().then(setVoteQuota).catch(() => {});
    };
    fetchQuota();
    return visibleInterval(fetchQuota, 30000);
  }, []);

  useEffect(() => {
    api.adminSession().then((session) => setIsAdmin(session.authenticated)).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    return visibleInterval(refresh, POLL_INTERVAL_MS);
  }, [refresh]);

  // Looks up a request's title/platform (as of this render) so trackEvent
  // calls below can show *which video* an action happened on in GA reports
  // instead of just an opaque request_id.
  const videoTrackingParams = (id: string): Record<string, string> => {
    const r = requests.find((req) => req.id === id);
    return r ? { video_title: r.title, platform: r.platform } : {};
  };

  const handleCreate = async (url: string, twoMinuteRequest: boolean) => {
    const created = await api.createRequest(url, "", twoMinuteRequest);
    markMyRequest(created.id);
    trackEvent("video_request_submit", {
      request_id: created.id,
      video_title: created.title,
      platform: created.platform,
      source,
      two_minute_request: twoMinuteRequest,
    });
    await refresh();
  };

  const handleCancelMine = async (id: string) => {
    const trackingParams = videoTrackingParams(id);
    try {
      await api.cancelMyRequest(id);
      trackEvent("video_request_cancel_mine", { request_id: id, source, ...trackingParams });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "キャンセルに失敗しました");
    }
  };

  const handlePlay = async (id: string) => {
    const trackingParams = videoTrackingParams(id);
    try {
      await api.playRequest(id);
      trackEvent("video_request_admin_play", { request_id: id, source, ...trackingParams });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  const handleDone = async (id: string) => {
    const trackingParams = videoTrackingParams(id);
    try {
      await api.doneRequest(id);
      trackEvent("video_request_admin_done", { request_id: id, source, ...trackingParams });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    const trackingParams = videoTrackingParams(id);
    try {
      await api.deleteRequest(id);
      trackEvent("video_request_admin_delete", { request_id: id, source, ...trackingParams });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  // The vote handlers resolve true only when the server accepted the vote,
  // so the buttons don't mark a request as voted after a failure (e.g. the
  // hourly allowance being used up).
  const handleVoteCancel = async (id: string): Promise<boolean> => {
    const trackingParams = videoTrackingParams(id);
    try {
      const result = await api.voteCancel(id);
      if (result.quota) setVoteQuota(result.quota);
      trackEvent("video_request_bad_vote", {
        request_id: id,
        source,
        ...trackingParams,
      });
      await refresh();
      return true;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "投票に失敗しました");
      api.getMyVoteQuota().then(setVoteQuota).catch(() => {});
      return false;
    }
  };

  const handleLike = async (id: string, isSuper = false): Promise<boolean> => {
    const trackingParams = videoTrackingParams(id);
    try {
      const result = await api.likeRequest(id, isSuper);
      if (result.quota) setVoteQuota(result.quota);
      trackEvent(isSuper ? "video_request_super_like" : "video_request_like", {
        request_id: id,
        like_count: result.likeCount,
        source,
        ...trackingParams,
      });
      await refresh();
      return true;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "いいねに失敗しました");
      api.getMyVoteQuota().then(setVoteQuota).catch(() => {});
      return false;
    }
  };

  const nowPlaying = requests.find((r) => r.status === "playing") ?? null;
  const pending = requests.filter((r) => r.status === "pending");
  // Newest finish first; requests without a finishedAt (finished before the
  // backend tracked it) fall back to their creation time.
  const finishedTime = (r: VideoRequest) => Date.parse(r.finishedAt ?? "") || Date.parse(r.createdAt) || 0;
  const recentDone = requests
    .filter((r) => r.status === "done")
    .sort((a, b) => finishedTime(b) - finishedTime(a))
    .slice(0, RECENT_DONE_COUNT);

  return {
    requests,
    requestsLoaded,
    cancelVoteThreshold,
    cancelVoteTiers: cancelVoteTiers.length > 0 ? cancelVoteTiers : DEFAULT_CANCEL_VOTE_TIERS,
    fastForwardActive,
    fastForwardCapSeconds,
    fastForwardCancelVoteTiers:
      fastForwardCancelVoteTiers.length > 0 ? fastForwardCancelVoteTiers : DEFAULT_FAST_FORWARD_CANCEL_VOTE_TIERS,
    likePriorityThreshold,
    errorMessage,
    setErrorMessage,
    isAdmin,
    nowPlaying,
    pending,
    recentDone,
    handleCreate,
    handleCancelMine,
    handlePlay,
    handleDone,
    handleDelete,
    handleVoteCancel,
    handleLike,
  };
}
