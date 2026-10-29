import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { Poll } from "../types";
import { visibleInterval } from "./visibleInterval";

// Re-polled so others' answers show up without reloading.
const POLL_INTERVAL_MS = 30000;

// Every アンケート (open ones first) with the visitor's own answers, plus
// answer() to send one — shared by the board's poll box and /polls.
// loaded turns true once the first fetch has finished, either way.
export function usePolls(): { polls: Poll[]; loaded: boolean; answer: (id: number, choices: number[]) => Promise<void> } {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api
        .getPolls()
        .then(({ polls }) => {
          if (!cancelled) setPolls(polls ?? []);
        })
        .catch(() => {
          // Keep the last known results; the next poll retries.
        })
        .finally(() => {
          if (!cancelled) setLoaded(true);
        });
    load();
    const stop = visibleInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  const answer = useCallback(async (id: number, choices: number[]) => {
    const { polls } = await api.answerPoll(id, choices);
    setPolls(polls ?? []);
  }, []);

  return { polls, loaded, answer };
}
