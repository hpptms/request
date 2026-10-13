import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import { visibleInterval } from "./visibleInterval";
import type { ChatMessage } from "../types";

// How long each chat line stays on the /play screen.
export const CHAT_DISPLAY_MS = 10000;
const POLL_INTERVAL_MS = 2000;
// Never more than this many lines on screen at once.
const MAX_VISIBLE = 5;

export interface VisibleChat {
  id: number;
  source: ChatMessage["source"];
  text: string;
  // Absolute (performance.now-based) time at which this line disappears.
  expiresAt: number;
}

// Polls the chat and keeps only lines still inside their displayMs. Ages
// come from the server (ageMs), so a line sent before this screen opened
// only shows for whatever is left of its window. `poll` fetches right away
// (used after sending, so the sender doesn't wait for the next tick).
export function usePlayChat(displayMs = CHAT_DISPLAY_MS) {
  const [lines, setLines] = useState<VisibleChat[]>([]);
  const lastId = useRef(0);

  const poll = useCallback(async () => {
    try {
      const { messages } = await api.getChat(lastId.current);
      if (messages.length === 0) return;
      const now = performance.now();
      lastId.current = Math.max(lastId.current, ...messages.map((m) => m.id));
      const fresh = messages
        .filter((m) => m.ageMs < displayMs)
        .map((m) => ({ id: m.id, source: m.source, text: m.text, expiresAt: now + displayMs - m.ageMs }));
      if (fresh.length > 0) setLines((prev) => [...prev, ...fresh].slice(-MAX_VISIBLE));
    } catch {
      // Purely a nicety — ignore failures.
    }
  }, [displayMs]);

  useEffect(() => {
    poll();
    return visibleInterval(poll, POLL_INTERVAL_MS);
  }, [poll]);

  // Drop expired lines.
  useEffect(() => {
    if (lines.length === 0) return;
    const next = Math.min(...lines.map((l) => l.expiresAt));
    const timer = setTimeout(
      () => setLines((prev) => prev.filter((l) => l.expiresAt > performance.now())),
      Math.max(0, next - performance.now()) + 20,
    );
    return () => clearTimeout(timer);
  }, [lines]);

  return { lines, poll };
}
