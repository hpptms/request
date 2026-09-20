import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { api } from "../api";
import type { InquiryMessage } from "../types";

// 管理者からの返信を、そのIPで次にページを開いたときに表示する。サーバーは
// IPでしか照合しないため、IPが変わった訪問者には届かない(仕様)。閉じたときに
// 既読を送るので、表示前にタブを閉じた返信は次回また表示される。
export default function AdminReplyDialog() {
  const [replies, setReplies] = useState<InquiryMessage[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .getMyReplies()
      .then(({ replies }) => {
        if (!cancelled) setReplies(replies);
      })
      .catch(() => {
        // Purely a nicety — ignore failures.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClose = () => {
    const ids = replies.map((r) => r.id);
    setReplies([]);
    api.ackReplies(ids).catch(() => {});
  };

  return (
    <Dialog open={replies.length > 0} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>管理者からのメッセージ</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {replies.map((r) => (
            <div key={r.id}>
              <Typography variant="caption" color="text.secondary">
                {new Date(r.createdAt).toLocaleString("ja-JP")}
              </Typography>
              <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{r.text}</Typography>
            </div>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
}
