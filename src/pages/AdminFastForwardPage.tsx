import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { api } from "../api";
import type { FastForwardWindow } from "../types";

const hourOptions = Array.from({ length: 24 }, (_, h) => h);

// backend fastforward.DefaultMinPendingFor と同じ既定値(6時の枠だけ10曲、他は5曲)。
const defaultMinPendingFor = (hour: number) => (hour === 6 ? 10 : 5);
const maxMinPending = 999;

const parseMinPending = (value: string) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= maxMinPending ? n : null;
};

// 設定中ウィンドウ一覧の曲数入力欄。入力中は手元で保持し、フォーカスを外したら保存する。
function MinPendingField({
  value,
  disabled,
  onSave,
  onInvalid,
}: {
  value: number;
  disabled: boolean;
  onSave: (minPending: number) => void;
  onInvalid: () => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const n = parseMinPending(draft);
    if (n === null) {
      onInvalid();
      setDraft(String(value));
    } else if (n !== value) {
      onSave(n);
    }
  };

  return (
    <TextField
      label="発動曲数"
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      disabled={disabled}
      size="small"
      slotProps={{ htmlInput: { min: 1, max: maxMinPending } }}
      sx={{ width: 96 }}
    />
  );
}

// 早送りウィンドウ管理画面 (/admin/fastforward): ここで設定した時刻(JST)から
// 指定した時間だけ、キューが滞留している間に限り1本あたりの再生時間を短く
// 切り上げる(backend/internal/fastforward, store.FastForwardMinPlayback)。
// どの枠でもいいね1票につき30秒延長され、「基本1分30秒」をONにした枠は基本が2分ではなく1分30秒になる。
// 早送りが発動するのはキューに枠ごとの「発動曲数」以上のリクエストが溜まっている間だけ。
function AdminFastForwardPage() {
  const [windows, setWindows] = useState<FastForwardWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newHour, setNewHour] = useState(0);
  const [newDuration, setNewDuration] = useState("60");
  const [newLikeExtend, setNewLikeExtend] = useState(false);
  const [newMinPending, setNewMinPending] = useState(String(defaultMinPendingFor(0)));

  useEffect(() => {
    api
      .adminListFastForward()
      .then(setWindows)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  const saveWindows = async (next: FastForwardWindow[]) => {
    setSaving(true);
    setErrorMessage(null);
    try {
      setWindows(await api.adminSetFastForward(next));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const durationMinutes = Number(newDuration);
    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      setErrorMessage("時間(分)は1以上の整数で入力してください");
      return;
    }
    const minPending = parseMinPending(newMinPending);
    if (minPending === null) {
      setErrorMessage(`発動曲数は1〜${maxMinPending}の整数で入力してください`);
      return;
    }
    if (windows.some((w) => w.hour === newHour)) {
      setErrorMessage(`${newHour}時のウィンドウは既に設定されています。先に削除してください`);
      return;
    }
    await saveWindows([...windows, { hour: newHour, durationMinutes, likeExtend: newLikeExtend, minPending }]);
  };

  const handleToggleLikeExtend = async (hour: number) => {
    await saveWindows(windows.map((w) => (w.hour === hour ? { ...w, likeExtend: !w.likeExtend } : w)));
  };

  const handleSetMinPending = async (hour: number, minPending: number) => {
    await saveWindows(windows.map((w) => (w.hour === hour ? { ...w, minPending } : w)));
  };

  const handleRemove = async (hour: number) => {
    await saveWindows(windows.filter((w) => w.hour !== hour));
  };

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          早送りウィンドウを追加
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          指定した時刻(JST)から指定した時間だけ、キューに「発動曲数」以上のリクエストが溜まっている場合に限り再生時間を短く切り上げます(基本2分
          + いいね1票につき30秒延長)。「基本1分30秒」をONにすると基本が1分30秒になります。
        </Typography>
        <Box component="form" onSubmit={handleAdd}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="開始時刻"
              value={newHour}
              onChange={(e) => {
                const hour = Number(e.target.value);
                setNewHour(hour);
                setNewMinPending(String(defaultMinPendingFor(hour)));
              }}
              size="small"
              sx={{ minWidth: 120 }}
            >
              {hourOptions.map((h) => (
                <MenuItem key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="継続時間(分)"
              type="number"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              size="small"
              slotProps={{ htmlInput: { min: 1 } }}
              sx={{ minWidth: 140 }}
            />
            <TextField
              label="発動曲数"
              type="number"
              value={newMinPending}
              onChange={(e) => setNewMinPending(e.target.value)}
              size="small"
              slotProps={{ htmlInput: { min: 1, max: maxMinPending } }}
              sx={{ minWidth: 110 }}
            />
            <FormControlLabel
              control={<Checkbox checked={newLikeExtend} onChange={(e) => setNewLikeExtend(e.target.checked)} />}
              label="基本1分30秒"
            />
            <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={loading || saving}>
              追加
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          設定中の早送りウィンドウ {windows.length > 0 && `(${windows.length})`}
        </Typography>
        {windows.length === 0 ? (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
            <Typography color="text.secondary">早送りウィンドウは設定されていません</Typography>
          </Paper>
        ) : (
          <Paper elevation={2}>
            <List disablePadding>
              {windows.map((w, i) => (
                <ListItem
                  key={w.hour}
                  divider={i < windows.length - 1}
                  secondaryAction={
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <MinPendingField
                        value={w.minPending}
                        disabled={saving}
                        onSave={(n) => handleSetMinPending(w.hour, n)}
                        onInvalid={() => setErrorMessage(`発動曲数は1〜${maxMinPending}の整数で入力してください`)}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={w.likeExtend}
                            onChange={() => handleToggleLikeExtend(w.hour)}
                            disabled={saving}
                            size="small"
                          />
                        }
                        label="基本1分30秒"
                      />
                      <Tooltip title="削除">
                        <span>
                          <IconButton edge="end" onClick={() => handleRemove(w.hour)} disabled={saving}>
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  }
                >
                  <ListItemText
                    sx={{ pr: 32 }}
                    primary={`${String(w.hour).padStart(2, "0")}:00 から ${w.durationMinutes}分間`}
                    secondary={`${w.minPending}曲以上で発動 / 基本${w.likeExtend ? "1分30秒" : "2分"} + いいね1票につき30秒`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}

export default AdminFastForwardPage;
