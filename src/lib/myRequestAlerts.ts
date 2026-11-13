import { useEffect, useRef } from "react";
import type { VideoRequest } from "../types";
import { isMyRequest } from "./myRequestStorage";
import { playChime } from "./playChime";

// Tells a visitor when their own request is about to play / starts playing,
// so they can request a video, leave the tab in the background and still get
// back in time to watch it with everyone. GA showed only ~11% of first-time
// visitors coming back the next day; "your video is up" is the strongest
// reason this site has to bring someone back to the tab.
//
// Three channels, each best-effort:
// - a 【…】 prefix on document.title while the tab is hidden (always works),
// - a chime when the tab is hidden (may be muted by autoplay policy),
// - a system notification, only if the visitor opted in via
//   requestAlertPermission() (see RequestForm's post-submit panel).

const TITLE_MARK_RE = /^【[^】]*】 /;

function setTitleMark(mark: string | null) {
  const base = document.title.replace(TITLE_MARK_RE, "");
  document.title = mark ? `【${mark}】 ${base}` : base;
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export async function requestAlertPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function notify(title: string, body: string, tag: string) {
  if (notificationPermission() !== "granted") return;
  try {
    const n = new Notification(title, { body, tag, icon: "/apple-touch-icon.png" });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // Some mobile browsers expose Notification but only allow it from a
    // service worker — nothing more to do without one.
  }
}

type MyState = "next" | "playing";

// Whether this browser has a request still waiting or playing — used by
// useRequestQueue to keep polling in a hidden tab only while there is
// something to alert about.
export function hasActiveMyRequest(requests: VideoRequest[]): boolean {
  return requests.some((r) => r.status !== "done" && isMyRequest(r.id));
}

// 1-based place in the waiting line, or null if the request isn't pending.
export function queuePosition(pending: VideoRequest[], id: string): number | null {
  const i = pending.findIndex((r) => r.id === id);
  return i < 0 ? null : i + 1;
}

export function useMyRequestAlerts(requests: VideoRequest[], requestsLoaded: boolean) {
  // Last alerted state per own request id. Seeded silently from the first
  // load so a reload while your video is already up doesn't chime again.
  const seen = useRef<Map<string, MyState> | null>(null);
  const activeMark = useRef<string | null>(null);

  useEffect(() => {
    if (!requestsLoaded) return;
    const pending = requests.filter((r) => r.status === "pending");
    const current = new Map<string, { state: MyState; request: VideoRequest }>();
    for (const r of requests) {
      if (!isMyRequest(r.id)) continue;
      if (r.status === "playing") current.set(r.id, { state: "playing", request: r });
      else if (r.status === "pending" && pending[0]?.id === r.id) current.set(r.id, { state: "next", request: r });
    }

    const first = seen.current === null;
    const prev = seen.current ?? new Map<string, MyState>();
    seen.current = new Map([...current].map(([id, v]) => [id, v.state]));

    let mark: string | null = null;
    for (const { state } of current.values()) {
      if (state === "playing") mark = "あなたのリクエスト再生中";
      else if (!mark) mark = "次はあなたのリクエスト";
    }
    activeMark.current = mark;
    setTitleMark(document.hidden ? mark : null);

    if (first) return;
    for (const [id, { state, request }] of current) {
      if (prev.get(id) === state) continue;
      if (state === "playing") {
        if (document.hidden) playChime();
        if (document.hidden) notify("あなたのリクエストが再生中です", request.title, `playing-${id}`);
      } else {
        if (document.hidden) playChime();
        if (document.hidden) notify("次はあなたのリクエストです", request.title, `next-${id}`);
      }
    }
  }, [requests, requestsLoaded]);

  // The mark is only for a hidden tab: drop it on return, put it back on
  // leaving again while the state still holds.
  useEffect(() => {
    const onVisibility = () => setTitleMark(document.hidden ? activeMark.current : null);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      setTitleMark(null);
    };
  }, []);
}
