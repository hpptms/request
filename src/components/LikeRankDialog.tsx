import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { api } from "../api";
import type { LikeRank } from "../types";

const STORAGE_KEY = "recest:seenLikeRanks";

const SLOT_LABELS: Record<LikeRank["slot"], string> = {
  morning: "朝(5〜11時)",
  daytime: "昼(11〜17時)",
  evening: "夜(17〜22時)",
  midnight: "深夜(22〜5時)",
};

const rankKey = (r: LikeRank) => `${r.date}|${r.slot}`;

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
    // Older than the backend's 7-day lookback can never come back, so cap
    // the list instead of growing forever.
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys].slice(-50)));
  } catch {
    // Ignore storage failures — worst case the popup shows again next visit.
  }
}

// On the visitor's next visit, tells them where their requests ranked by
// likes in a finished time slot (top 5 only). The server matches by IP; this
// browser just remembers which slots it has already announced.
export default function LikeRankDialog() {
  const [rank, setRank] = useState<LikeRank | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getMyLikeRanks()
      .then(({ ranks }) => {
        if (cancelled) return;
        const seen = readSeen();
        // Newest first; announce the latest unseen one and mark every
        // returned slot as seen so older ones don't queue up behind it.
        const fresh = ranks.find((r) => !seen.has(rankKey(r)));
        if (!fresh) return;
        ranks.forEach((r) => seen.add(rankKey(r)));
        writeSeen(seen);
        setRank(fresh);
      })
      .catch(() => {
        // Purely a nicety — ignore failures.
      });
    return () => {
      cancelled = true;
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
              {rank.date.replace(/-/g, "/")} {SLOT_LABELS[rank.slot]}のリクエスト(獲得 {rank.likes} いいね)
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
