import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { api } from "../api";

// 長い動画を短縮する閾値のプリセット。値は秒。0は「短縮しない」(機能オフ)。
const thresholdOptions = [
  { value: 7200, label: "2時間以上を短縮" },
  { value: 5400, label: "1時間半以上を短縮" },
  { value: 3600, label: "1時間以上を短縮" },
  { value: 1800, label: "30分以上を短縮" },
  { value: 600, label: "10分以上を短縮" },
  { value: 0, label: "短縮しない" },
] as const;

// 機能タブ (/admin/features): 長い動画をリクエストされた際、一定の長さ以上
// なら再生時間を一律capSeconds(backend/internal/durationlimit)まで短縮する
// かどうかと、その閾値を設定する。
function AdminFeaturesPage() {
  const [thresholdSeconds, setThresholdSeconds] = useState(0);
  const [capSeconds, setCapSeconds] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    api
      .adminGetDurationLimit()
      .then((limit) => {
        setThresholdSeconds(limit.thresholdSeconds);
        setCapSeconds(limit.capSeconds);
      })
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = async (value: number) => {
    setSaving(true);
    setErrorMessage(null);
    setSavedMessage(false);
    try {
      const limit = await api.adminSetDurationLimit(value);
      setThresholdSeconds(limit.thresholdSeconds);
      setCapSeconds(limit.capSeconds);
      setSavedMessage(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {savedMessage && !errorMessage && <Alert severity="success">保存しました</Alert>}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          長い動画の短縮
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          リクエストされた動画がここで選んだ長さ以上だった場合、再生時間を{capSeconds}
          秒に短縮します。
        </Typography>
        <FormControl disabled={loading || saving}>
          <RadioGroup
            value={thresholdSeconds}
            onChange={(e) => handleChange(Number(e.target.value))}
          >
            {thresholdOptions.map((opt) => (
              <FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />
            ))}
          </RadioGroup>
        </FormControl>
      </Paper>
    </Stack>
  );
}

export default AdminFeaturesPage;
