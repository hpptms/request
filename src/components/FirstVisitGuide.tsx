import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import { trackEvent } from "../lib/analytics";

const STORAGE_KEY = "recest:firstVisitGuideDismissed";

function isDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const STEPS: { title: string; body: string }[] = [
  { title: "見る", body: "上の「同時視聴する」ボタンから再生画面を開くと、いま流れている動画を全員と同じタイミングで見られます。" },
  { title: "リクエストする", body: "見たい動画のURLを下のフォームから送ると、待機列に並びます。順番が来ると全員の画面で再生されます。" },
  { title: "投票する", body: "👍いいねが集まった動画は早く流れ、bad投票が集まった動画は短く切り上げられます。" },
];

// A short "how this works" card on the board for first-time visitors.
// Most new visitors (GA: ~88% of them arrive by direct link from a stream)
// never came back the next day; the board itself is a wall of live queue
// state with no explanation above the fold. Shown until dismissed, read
// synchronously so it doesn't shift the layout when it appears.
export function FirstVisitGuide() {
  const [visible, setVisible] = useState(() => !isDismissed());
  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private mode etc. — it just shows again next time.
    }
    trackEvent("first_visit_guide_dismiss");
    setVisible(false);
  };

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderLeft: 4, borderColor: "primary.main" }}>
      <Typography variant="h6" component="h2" gutterBottom>
        はじめての方へ
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        登録不要。知らない人とみんなで、同じ動画を同時に見るサイトです。
      </Typography>
      <Stack component="ol" spacing={1.25} sx={{ m: 0, p: 0, listStyle: "none" }}>
        {STEPS.map((s, i) => (
          <Box component="li" key={s.title} sx={{ display: "flex", gap: 1.5 }}>
            <Box
              aria-hidden
              sx={{
                flexShrink: 0,
                width: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i + 1}
            </Box>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 700 }}>
                {s.title}
              </Box>
              ：{s.body}
            </Typography>
          </Box>
        ))}
      </Stack>
      <Stack direction="row" sx={{ mt: 2, alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="body2">
          <Link component={RouterLink} to="/guide">
            詳しい使い方
          </Link>
        </Typography>
        <Button size="small" onClick={dismiss}>
          分かった、閉じる
        </Button>
      </Stack>
    </Paper>
  );
}
