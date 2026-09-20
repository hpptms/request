import { useCallback, useEffect, useState } from "react";
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

// セーフワード管理画面 (/admin/safewords): ここで追加した文字列は、禁止ワードの
// 判定から除外される (例: 「裸足」は禁止ワード「裸」を含むが許可する)。
// リクエストされた動画のタイトルからセーフワード部分を除いた残りに禁止ワードが
// 含まれているかで判定する (backend/internal/keywordfilter)。
function AdminSafeWordsPage() {
  const [words, setSafeWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSafeWords(await api.adminListSafeWords());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const word = newWord.trim();
    if (!word) return;
    try {
      await api.adminAddSafeWord(word);
      setNewWord("");
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "追加に失敗しました");
    }
  };

  const handleRemove = async (word: string) => {
    try {
      await api.adminRemoveSafeWord(word);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  return (
    <Stack spacing={3}>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          セーフワードを追加
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          この文字列は禁止ワードの判定から除外されます。例: 「裸足」を登録すると、禁止ワード「裸」を含んでいても「裸足」の部分は問題なくなります(タイトルの他の部分に禁止ワードがあれば、従来どおり拒否されます)。
        </Typography>
        <Box component="form" onSubmit={handleAdd}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="セーフワード"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              size="small"
              fullWidth
            />
            <Button type="submit" variant="contained" startIcon={<AddIcon />}>
              追加
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          セーフワード一覧 {words.length > 0 && `(${words.length})`}
        </Typography>
        {words.length === 0 ? (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
            <Typography color="text.secondary">セーフワードはありません</Typography>
          </Paper>
        ) : (
          <Paper elevation={2}>
            <List disablePadding>
              {words.map((kw, i) => (
                <ListItem
                  key={kw}
                  divider={i < words.length - 1}
                  secondaryAction={
                    <Tooltip title="削除">
                      <IconButton edge="end" onClick={() => handleRemove(kw)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemText primary={kw} sx={{ pr: 6 }} />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}

export default AdminSafeWordsPage;
