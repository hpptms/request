import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { CancelVoteTier, VideoRequest } from "../types";
import { trackEvent } from "./analytics";
import { markMyRequest } from "./myRequestStorage";

const POLL_INTERVAL_MS = 4000;
const DEFAULT_CANCEL_VOTE_THRESHOLD = 5;
const DEFAULT_LIKE_PRIORITY_THRESHOLD = 2;
// Mirrors the backend's default store.CancelVoteTiers (internal/store/store.go)
// until the real config loads.
const DEFAULT_CANCEL_VOTE_TIERS: CancelVoteTier[] = [
  { votes: 5, capSeconds: 120 },
  { votes: 10, capSeconds: 90 },
  { votes: 15, capSeconds: 60 },
  { votes: 20, capSeconds: 30 },
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

  useEffect(() => {
    api
      .getConfig()
      .then((config) => {
        setCancelVoteThreshold(config.cancelVoteThreshold);
        setCancelVoteTiers(config.cancelVoteTiers);
        setLikePriorityThreshold(config.likePriorityThreshold);
      })
      .catch(() => {});
    api.adminSession().then((session) => setIsAdmin(session.authenticated)).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleCreate = async (url: string, twoMinuteRequest: boolean) => {
    const created = await api.createRequest(url, "", twoMinuteRequest);
    markMyRequest(created.id);
    trackEvent("video_request_submit", {
      request_id: created.id,
      platform: created.platform,
      source,
      two_minute_request: twoMinuteRequest,
    });
    await refresh();
  };

  const handleCancelMine = async (id: string) => {
    try {
      await api.cancelMyRequest(id);
      trackEvent("video_request_cancel_mine", { request_id: id, source });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "キャンセルに失敗しました");
    }
  };

  const handlePlay = async (id: string) => {
    try {
      await api.playRequest(id);
      trackEvent("video_request_admin_play", { request_id: id, source });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  const handleDone = async (id: string) => {
    try {
      await api.doneRequest(id);
      trackEvent("video_request_admin_done", { request_id: id, source });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRequest(id);
      trackEvent("video_request_admin_delete", { request_id: id, source });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  const handleVoteCancel = async (id: string) => {
    try {
      const result = await api.voteCancel(id);
      trackEvent("video_request_bad_vote", {
        request_id: id,
        vote_count: result.voteCount,
        source,
      });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "投票に失敗しました");
    }
  };

  const handleLike = async (id: string) => {
    try {
      const result = await api.likeRequest(id);
      trackEvent("video_request_like", {
        request_id: id,
        like_count: result.likeCount,
        source,
      });
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "いいねに失敗しました");
    }
  };

  const nowPlaying = requests.find((r) => r.status === "playing") ?? null;
  const pending = requests.filter((r) => r.status === "pending");

  return {
    requests,
    requestsLoaded,
    cancelVoteThreshold,
    cancelVoteTiers: cancelVoteTiers.length > 0 ? cancelVoteTiers : DEFAULT_CANCEL_VOTE_TIERS,
    likePriorityThreshold,
    errorMessage,
    setErrorMessage,
    isAdmin,
    nowPlaying,
    pending,
    handleCreate,
    handleCancelMine,
    handlePlay,
    handleDone,
    handleDelete,
    handleVoteCancel,
    handleLike,
  };
}
