import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ShareIcon from "@mui/icons-material/Share";
import { trackEvent } from "../lib/analytics";
import { notificationPermission, requestAlertPermission } from "../lib/myRequestAlerts";
import type { VideoRequest } from "../types";

const SHARE_URL = "https://request.tokyo/play";

function shareText(title: string): string {
  return `「${title}」をリクエストしました！みんなで同時視聴しよう #動画リクエストキュー`;
}

// Shown right after a successful request: the moment a visitor is most
// invested in the site. Offers the two things that bring people (back) to
// it — sharing the request with their own followers (the site's own SNS
// account has almost none, so visitors' shares are the only SNS reach it
// gets), and opting in to a notification when the video comes up.
export function RequestSubmittedPanel({
  request,
  onClose,
  compact = false,
}: {
  request: VideoRequest;
  onClose: () => void;
  compact?: boolean;
}) {
  const [permission, setPermission] = useState(notificationPermission);

  const share = async () => {
    const text = shareText(request.title);
    trackEvent("request_share", { method: "share_button", request_id: request.id });
    // Native share sheet on phones (LINE, X, ... whatever they use);
    // X's web intent elsewhere.
    if (typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ text, url: SHARE_URL });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SHARE_URL)}`;
    window.open(intent, "_blank", "noopener");
  };

  const enableAlerts = async () => {
    const result = await requestAlertPermission();
    setPermission(result);
    trackEvent("request_alert_permission", { result });
  };

  return (
    <Alert severity="success" onClose={onClose} sx={{ mt: compact ? 1 : 2, "& .MuiAlert-message": { width: "100%" } }}>
      {compact ? "リクエストしました。" : "リクエストしました。順番が来ると、見ている全員の画面で再生されます。"}
      <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1, flexWrap: "wrap" }}>
        <Button size="small" variant="outlined" color="inherit" startIcon={<ShareIcon />} onClick={share}>
          シェアして一緒に見る
        </Button>
        {permission === "default" && (
          <Button size="small" variant="outlined" color="inherit" startIcon={<NotificationsActiveIcon />} onClick={enableAlerts}>
            再生前に通知する
          </Button>
        )}
      </Stack>
    </Alert>
  );
}
