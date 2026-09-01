import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { api } from "../api";
import type { PlaylistResolveError, PlaylistTrack } from "../types";

// Playlist screen (/admin/playlist): loads the plain list of YouTube URLs
// the viewer screen plays whenever no one has requested anything. Real
// requests always interrupt it, and it resumes from where it was paused
// once the queue empties again (see ViewerPage.tsx).
function AdminPlaylistPage() {
  const [text, setText] = useState("");
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<PlaylistResolveError[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    api
      .getPlaylist()
      .then((data) => {
        setTracks(data);
        setText(data.map((t) => t.url).join("\n"));
      })
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSavedMessage(false);
    try {
      const urls = text.split("\n");
      const result = await api.adminSetPlaylist(urls);
      setTracks(result.tracks);
      setErrors(result.errors);
      setSavedMessage(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          プレイリストを読み込む
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          リクエストが無いときに順番に再生される動画です。1行に1つ、動画ページのYouTube URL（例:
          youtube.com/watch?v=…、youtu.be/…）を貼り付けて保存してください。検索結果ページのURL（youtube.com/results?search_query=…）は解決できません。リクエストが入ると中断され、無くなると続きから再開されます。
        </Typography>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        {savedMessage && errors.length === 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            保存しました（{tracks.length}件）
          </Alert>
        )}
        {errors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Stack spacing={0.5}>
              {errors.map((e) => (
                <Typography key={e.line} variant="body2">
                  {e.line}行目「{e.url}」: {e.message}
                </Typography>
              ))}
            </Stack>
          </Alert>
        )}
        <TextField
          multiline
          minRows={6}
          maxRows={16}
          fullWidth
          placeholder={"https://www.youtube.com/watch?v=...\nhttps://youtu.be/..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
          sx={{ mb: 2, "& textarea": { fontFamily: "monospace", fontSize: "0.85rem" } }}
        />
        <Button variant="contained" onClick={handleSave} disabled={loading || saving}>
          保存
        </Button>
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          読み込み済みのプレイリスト {tracks.length > 0 && `(${tracks.length})`}
        </Typography>
        {tracks.length === 0 ? (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
            <Typography color="text.secondary">プレイリストは空です</Typography>
          </Paper>
        ) : (
          <Paper elevation={2}>
            <List disablePadding>
              {tracks.map((t, i) => (
                <ListItem key={`${t.videoId}-${i}`} divider={i < tracks.length - 1}>
                  <ListItemAvatar>
                    <Avatar variant="rounded" src={t.thumbnailUrl} sx={{ width: 48, height: 36, mr: 1 }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={t.title}
                    secondary={t.channelTitle}
                    slotProps={{ primary: { noWrap: true } }}
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

export default AdminPlaylistPage;
