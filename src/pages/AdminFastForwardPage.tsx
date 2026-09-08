import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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

// 早送りウィンドウ管理画面 (/admin/fastforward): ここで設定した時刻(JST)から
// 指定した時間だけ、キューが滞留している間に限り1本あたりの再生時間を短く
// 切り上げる(backend/internal/fastforward, store.FastForwardMinPlayback)。
function AdminFastForwardPage() {
  const [windows, setWindows] = useState<FastForwardWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newHour, setNewHour] = useState(0);
  const [newDuration, setNewDuration] = useState("60");

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
    if (windows.some((w) => w.hour === newHour)) {
      setErrorMessage(`${newHour}時のウィンドウは既に設定されています。先に削除してください`);
      return;
    }
    await saveWindows([...windows, { hour: newHour, durationMinutes }]);
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
          指定した時刻(JST)から指定した時間だけ、リクエストが滞留している場合に限り再生時間を短く切り上げます。
        </Typography>
        <Box component="form" onSubmit={handleAdd}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="開始時刻"
              value={newHour}
              onChange={(e) => setNewHour(Number(e.target.value))}
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
                    <Tooltip title="削除">
                      <span>
                        <IconButton edge="end" onClick={() => handleRemove(w.hour)} disabled={saving}>
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    sx={{ pr: 6 }}
                    primary={`${String(w.hour).padStart(2, "0")}:00 から ${w.durationMinutes}分間`}
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
