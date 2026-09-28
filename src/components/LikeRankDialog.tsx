import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { api } from "../api";
import type { LikeRank } from "../types";

const STORAGE_KEY = "recest:seenLikeRanks";

// Rankings close on the hour, so check shortly after each one instead of
// polling; the minute's slack covers clock skew against the server.
const AFTER_HOUR_MS = 60 * 1000;
// If a popup is still open when the check fires, try again this much later.
const RETRY_MS = 60 * 1000;

const rankKey = (r: LikeRank) => `${r.date}|${r.hour}`;

function msUntilNextCheck(): number {
  const next = new Date();
  next.setHours(next.getHours() + 1, 0, 0, 0);
  return next.getTime() - Date.now() + AFTER_HOUR_MS;
}

function readSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeSeen(keys: Set<string>) {
  try {
    // Older than the backend's 7-day lookback (at most 7*24 hours) can never
    // come back, so cap the list instead of growing forever.
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys].slice(-200)));
  } catch {
    // Ignore storage failures — worst case the popup shows again next visit.
  }
}

// Tells the visitor where their requests ranked by likes in a finished hour
// (top 5 only) — on load, and again just after every hour while the page
// stays open. The server matches by IP; this browser just remembers which
// hours it has already announced.
export default function LikeRankDialog() {
  const [rank, setRank] = useState<LikeRank | null>(null);
  const openRef = useRef(false);
  openRef.current = rank !== null;

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      // Don't mark new hours as seen while one is still on screen, or the
      // newer one would be swallowed; the retry picks it up.
      if (openRef.current) return;
      api
        .getMyLikeRanks()
        .then(({ ranks }) => {
          if (cancelled || openRef.current) return;
          const seen = readSeen();
          // Newest first; announce the latest unseen one and mark every
          // returned hour as seen so older ones don't queue up behind it.
          const fresh = ranks.find((r) => !seen.has(rankKey(r)));
          if (!fresh) return;
          ranks.forEach((r) => seen.add(rankKey(r)));
          writeSeen(seen);
          setRank(fresh);
        })
        .catch(() => {
          // Purely a nicety — ignore failures.
        });
    };
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (ms: number) => {
      timer = setTimeout(() => {
        if (openRef.current) {
          schedule(RETRY_MS);
          return;
        }
        check();
        schedule(msUntilNextCheck());
      }, ms);
    };
    check();
    schedule(msUntilNextCheck());
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <Dialog open={rank !== null} onClose={() => setRank(null)}>
      {rank && (
        <>
          <DialogTitle>🎉 いいねランキング入賞!</DialogTitle>
          <DialogContent>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              あなたのいいね数{rank.rank}位です。
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {rank.date.replace(/-/g, "/")} {rank.hour}時台に再生されたリクエスト(獲得 {rank.likes} いいね)
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRank(null)} autoFocus>
              閉じる
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
