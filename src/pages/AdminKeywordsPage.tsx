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

// 禁止ワード管理画面 (/admin/keywords): ここで追加した文字列のいずれかが
// リクエストされた動画のタイトルに含まれていた場合、handleCreateRequest
// (backend/internal/api/api.go) がリクエストを拒否し、送信元IPを自動BANする
// (backend/internal/keywordfilter)。
function AdminKeywordsPage() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setKeywords(await api.adminListKeywords());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = newKeyword.trim();
    if (!keyword) return;
    try {
      await api.adminAddKeyword(keyword);
      setNewKeyword("");
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "追加に失敗しました");
    }
  };

  const handleRemove = async (keyword: string) => {
    try {
      await api.adminRemoveKeyword(keyword);
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
          禁止ワードを追加
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          動画タイトルにこの文字列が含まれていた場合、リクエストを拒否し送信元IPを自動的にBANします。
        </Typography>
        <Box component="form" onSubmit={handleAdd}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="禁止ワード"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
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
          禁止ワード一覧 {keywords.length > 0 && `(${keywords.length})`}
        </Typography>
        {keywords.length === 0 ? (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
            <Typography color="text.secondary">禁止ワードはありません</Typography>
          </Paper>
        ) : (
          <Paper elevation={2}>
            <List disablePadding>
              {keywords.map((kw, i) => (
                <ListItem
                  key={kw}
                  divider={i < keywords.length - 1}
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

export default AdminKeywordsPage;
