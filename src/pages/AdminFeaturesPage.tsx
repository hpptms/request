import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { api } from "../api";
import type { DurationLimit } from "../types";

// 長い動画を短縮する閾値のプリセット。値は秒。0は「短縮しない」(機能オフ)。
const thresholdOptions = [
  { value: 7200, label: "2時間以上を短縮" },
  { value: 5400, label: "1時間半以上を短縮" },
  { value: 3600, label: "1時間以上を短縮" },
  { value: 1800, label: "30分以上を短縮" },
  { value: 1500, label: "25分以上を短縮" },
  { value: 1200, label: "20分以上を短縮" },
  { value: 900, label: "15分以上を短縮" },
  { value: 600, label: "10分以上を短縮" },
  { value: 0, label: "短縮しない" },
] as const;

// 長い動画もOKモードの曜日チェックボックス。値はJSTの曜日 (0=日曜)。
const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"] as const;

// 機能タブ (/admin/features): 長い動画をリクエストされた際、一定の長さ以上
// なら再生時間を一律capSeconds(backend/internal/durationlimit)まで短縮する
// かどうかと、その閾値を設定する。あわせて/viewer左下のコメント表示の
// オン/オフも切り替え、長い動画もOKモードを有効にする曜日を選ぶ。
function AdminFeaturesPage() {
  const [thresholdSeconds, setThresholdSeconds] = useState(0);
  const [capSeconds, setCapSeconds] = useState(30);
  const [longVideoWeekdays, setLongVideoWeekdays] = useState<number[]>([]);
  const [longVideoMaxSeconds, setLongVideoMaxSeconds] = useState(3600);
  const [longVideoFastForwardThresholdSeconds, setLongVideoFastForwardThresholdSeconds] = useState(600);
  const [longVideoFastForwardCapSeconds, setLongVideoFastForwardCapSeconds] = useState(300);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const [viewerComments, setViewerComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsSaving, setCommentsSaving] = useState(false);

  useEffect(() => {
    api
      .adminGetCommentOverlay()
      .then(({ enabled }) => setViewerComments(enabled))
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setCommentsLoading(false));
  }, []);

  const handleViewerCommentsChange = async (enabled: boolean) => {
    setCommentsSaving(true);
    setErrorMessage(null);
    setSavedMessage(false);
    try {
      const res = await api.adminSetCommentOverlay(enabled);
      setViewerComments(res.enabled);
      setSavedMessage(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setCommentsSaving(false);
    }
  };

  const applyDurationLimit = (limit: DurationLimit) => {
    setThresholdSeconds(limit.thresholdSeconds);
    setCapSeconds(limit.capSeconds);
    setLongVideoWeekdays(limit.longVideoWeekdays ?? []);
    setLongVideoMaxSeconds(limit.longVideoMaxSeconds);
    setLongVideoFastForwardThresholdSeconds(limit.longVideoFastForwardThresholdSeconds);
    setLongVideoFastForwardCapSeconds(limit.longVideoFastForwardCapSeconds);
  };

  useEffect(() => {
    api
      .adminGetDurationLimit()
      .then(applyDurationLimit)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  const saveDurationLimit = async (settings: { thresholdSeconds?: number; longVideoWeekdays?: number[] }) => {
    setSaving(true);
    setErrorMessage(null);
    setSavedMessage(false);
    try {
      applyDurationLimit(await api.adminSetDurationLimit(settings));
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
          配信画面のコメント表示
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          /viewer の左下に、YouTube・ニコニコ・FC2・サイト内チャットのコメントを15秒ずつ表示します。
          配信サービス側でコメントが表示されない時に使ってください。
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={viewerComments}
              onChange={(e) => handleViewerCommentsChange(e.target.checked)}
            />
          }
          label="コメントを表示する"
          disabled={commentsLoading || commentsSaving}
        />
      </Paper>

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
            onChange={(e) => saveDurationLimit({ thresholdSeconds: Number(e.target.value) })}
          >
            {thresholdOptions.map((opt) => (
              <FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />
            ))}
          </RadioGroup>
        </FormControl>
      </Paper>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          長い動画もOKモード
        </Typography>
        <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 2 }}>
          チェックした曜日（日本時間 0:00〜24:00）は長い動画をそのまま再生します。
          <ul style={{ margin: "4px 0 0", paddingLeft: "1.5em" }}>
            <li>{longVideoMaxSeconds / 60}分までの動画は「長い動画の短縮」の対象外になります</li>
            <li>
              時短タイム中は{longVideoFastForwardThresholdSeconds / 60}分を超える動画を
              {longVideoFastForwardCapSeconds / 60}分で切り替えます（
              {longVideoFastForwardThresholdSeconds / 60}分以下の動画はいつも通り）
            </li>
            <li>いいねでの延長・badでの短縮はいつも通り効きます</li>
          </ul>
        </Typography>
        <FormGroup row>
          {weekdayLabels.map((label, day) => (
            <FormControlLabel
              key={day}
              control={
                <Checkbox
                  checked={longVideoWeekdays.includes(day)}
                  onChange={(e) =>
                    saveDurationLimit({
                      longVideoWeekdays: e.target.checked
                        ? [...longVideoWeekdays, day]
                        : longVideoWeekdays.filter((d) => d !== day),
                    })
                  }
                />
              }
              label={label}
              disabled={loading || saving}
            />
          ))}
        </FormGroup>
      </Paper>
    </Stack>
  );
}

export default AdminFeaturesPage;
