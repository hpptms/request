import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { api } from "../api";
import type { KeywordLimit } from "../types";

// セミ禁止ワード管理画面 (/admin/keywordlimits): ここに登録した文字列が
// タイトルまたはチャンネル名に含まれる動画は、禁止ワードと違いリクエスト
// 自体は許可されるが、待機中/再生中の件数が指定した上限に達すると
// それ以上キューに追加できなくなる(backend/internal/keywordlimit,
// store.Store.Add の ErrKeywordQueueLimitReached)。
function AdminKeywordLimitsPage() {
  const [entries, setEntries] = useState<KeywordLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [newLimit, setNewLimit] = useState("2");

  useEffect(() => {
    api
      .adminListKeywordLimits()
      .then(setEntries)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  const saveEntries = async (next: KeywordLimit[]) => {
    setSaving(true);
    setErrorMessage(null);
    try {
      setEntries(await api.adminSetKeywordLimits(next));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = newKeyword.trim();
    if (!keyword) return;
    const limit = Number(newLimit);
    if (!Number.isInteger(limit) || limit <= 0) {
      setErrorMessage("上限件数は1以上の整数で入力してください");
      return;
    }
    if (entries.some((e) => e.keyword === keyword)) {
      setErrorMessage(`「${keyword}」は既に設定されています。先に削除してください`);
      return;
    }
    await saveEntries([...entries, { keyword, limit }]);
    setNewKeyword("");
  };

  const handleRemove = async (keyword: string) => {
    await saveEntries(entries.filter((e) => e.keyword !== keyword));
  };

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          セミ禁止ワードを追加
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          禁止ワードと違い、この文字列を含む動画のリクエスト自体は許可されます。ただし、タイトルまたはチャンネル名にこの文字列を含む待機中/再生中のリクエストが指定件数に達すると、それ以上は追加できなくなります。
        </Typography>
        <Box component="form" onSubmit={handleAdd}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="ワード(タイトル・チャンネル名)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label="キュー内の上限件数"
              type="number"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              size="small"
              slotProps={{ htmlInput: { min: 1 } }}
              sx={{ minWidth: 160 }}
            />
            <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={loading || saving}>
              追加
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          設定中のセミ禁止ワード {entries.length > 0 && `(${entries.length})`}
        </Typography>
        {entries.length === 0 ? (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
            <Typography color="text.secondary">セミ禁止ワードは設定されていません</Typography>
          </Paper>
        ) : (
          <Paper elevation={2}>
            <List disablePadding>
              {entries.map((e, i) => (
                <ListItem
                  key={e.keyword}
                  divider={i < entries.length - 1}
                  secondaryAction={
                    <Tooltip title="削除">
                      <span>
                        <IconButton edge="end" onClick={() => handleRemove(e.keyword)} disabled={saving}>
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  }
                >
                  <ListItemText sx={{ pr: 6 }} primary={e.keyword} secondary={`キュー内上限: ${e.limit}件`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}

export default AdminKeywordLimitsPage;
