import { useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import NotificationsIcon from "@mui/icons-material/Notifications";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { trackEvent } from "../lib/analytics";
import {
  deleteCustomSound,
  playAlertSound,
  saveCustomSound,
  updateAlertSoundSettings,
  useAlertSoundSettings,
} from "../lib/alertSound";
import { notificationPermission, requestAlertPermission } from "../lib/myRequestAlerts";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
      {children}
    </Typography>
  );
}

// Settings for "your request is next / playing" alerts (useMyRequestAlerts):
// the browser notification permission, and an optional sound — off by
// default, a built-in chime or a file of the visitor's own, with a volume.
// All of it is kept in this browser only (see alertSound.ts).
export function AlertSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sound = useAlertSoundSettings();
  const [permission, setPermission] = useState(notificationPermission);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const enableNotifications = async () => {
    const result = await requestAlertPermission();
    setPermission(result);
    trackEvent("request_alert_permission", { result });
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    setSaving(true);
    setFileError(null);
    try {
      await saveCustomSound(file);
      trackEvent("alert_sound_custom_set");
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "音声ファイルを保存できませんでした");
    } finally {
      setSaving(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>再生前のお知らせ</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          自分のリクエストが「次に再生」になった時と、再生が始まった時に、別のタブを見ていてもお知らせします。設定はこのブラウザにだけ保存されます。
        </Typography>

        <Box sx={{ mb: 2.5 }}>
          <SectionTitle>ブラウザの通知</SectionTitle>
          {permission === "granted" && (
            <Typography variant="body2" color="success.main">
              許可済みです。
            </Typography>
          )}
          {permission === "default" && (
            <Button variant="outlined" size="small" startIcon={<NotificationsIcon />} onClick={enableNotifications}>
              通知を許可する
            </Button>
          )}
          {permission === "denied" && (
            <Typography variant="body2" color="text.secondary">
              通知がブロックされています。使う場合はブラウザのサイト設定から許可してください。
            </Typography>
          )}
          {permission === "unsupported" && (
            <Typography variant="body2" color="text.secondary">
              このブラウザでは通知を使えません。タブのタイトルでお知らせします。
            </Typography>
          )}
        </Box>

        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={sound.enabled}
                onChange={(e) => {
                  updateAlertSoundSettings({ enabled: e.target.checked });
                  trackEvent("alert_sound_toggle", { enabled: e.target.checked });
                }}
              />
            }
            label={<Typography sx={{ fontWeight: 700 }}>音でも知らせる</Typography>}
          />
          <Stack spacing={1.5} sx={{ mt: 1, opacity: sound.enabled ? 1 : 0.5 }}>
            <RadioGroup
              value={sound.kind}
              onChange={(e) => {
                const kind = e.target.value as "default" | "custom";
                if (kind === "custom" && !sound.customName) fileInput.current?.click();
                else updateAlertSoundSettings({ kind });
              }}
            >
              <FormControlLabel value="default" control={<Radio size="small" />} label="標準の音" />
              <FormControlLabel
                value="custom"
                control={<Radio size="small" />}
                label={
                  <Typography component="span" sx={{ wordBreak: "break-all" }}>
                    自分の音声ファイル{sound.customName && `（${sound.customName}）`}
                  </Typography>
                }
              />
            </RadioGroup>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              <Button size="small" variant="outlined" disabled={saving} onClick={() => fileInput.current?.click()}>
                {sound.customName ? "音声ファイルを変更" : "音声ファイルを選ぶ"}
              </Button>
              {sound.customName && (
                <Button size="small" color="inherit" onClick={() => deleteCustomSound()}>
                  削除
                </Button>
              )}
            </Stack>
            <input
              ref={fileInput}
              type="file"
              accept="audio/*"
              hidden
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <Typography variant="caption" color="text.secondary">
              mp3・wav・m4a・oggなど1MBまで。先頭5秒だけ鳴ります。
            </Typography>
            {fileError && <Alert severity="error">{fileError}</Alert>}

            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <VolumeDownIcon fontSize="small" aria-hidden />
              <Slider
                aria-label="音量"
                size="small"
                min={0}
                max={1}
                step={0.05}
                value={sound.volume}
                onChange={(_, v) => updateAlertSoundSettings({ volume: v as number })}
              />
              <VolumeUpIcon fontSize="small" aria-hidden />
            </Stack>
            <Box>
              <Button size="small" variant="outlined" onClick={() => playAlertSound(true)}>
                試しに鳴らす
              </Button>
            </Box>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}

// Bell icon for a toolbar that opens the dialog.
export function AlertSettingsButton({ size = "small" }: { size?: "small" | "medium" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip title="再生前のお知らせ設定">
        <IconButton size={size} onClick={() => setOpen(true)} aria-label="再生前のお知らせ設定">
          <NotificationsIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <AlertSettingsDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
