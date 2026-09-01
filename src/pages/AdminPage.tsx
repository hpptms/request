import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LogoutIcon from "@mui/icons-material/Logout";
import ShieldIcon from "@mui/icons-material/Shield";
import { api } from "../api";
import type { AdminVideoRequest, BannedIP, PlaylistTrack } from "../types";

function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const { authenticated } = await api.adminSession();
      setAuthenticated(authenticated);
    } catch {
      setAuthenticated(false);
    } finally {
      setCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (checkingSession) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return authenticated ? (
    <BanManagement onLoggedOut={() => setAuthenticated(false)} />
  ) : (
    <LoginForm onLoggedIn={() => setAuthenticated(true)} />
  );
}

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.adminLogin(username, password);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", px: 2 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 360, width: "100%" }}>
        <Stack spacing={2} sx={{ alignItems: "center", mb: 2 }}>
          <ShieldIcon color="primary" fontSize="large" />
          <Typography variant="h6">管理者ログイン</Typography>
        </Stack>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="ユーザー名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              fullWidth
            />
            <TextField
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={submitting} startIcon={<LockOpenIcon />}>
              ログイン
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

// The queue's filler content: a plain, ordered list of YouTube URLs the
// viewer screen plays whenever no one has requested anything. Real requests
// always interrupt it, and it resumes from where it was paused once the
// queue empties again (see ViewerPage.tsx).
function PlaylistManagement() {
  const [text, setText] = useState("");
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ line: number; url: string; message: string }[]>([]);
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
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" gutterBottom>
        プレイリスト
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        リクエストが無いときに順番に再生される動画です。1行に1つYouTubeのURLを入力してください。リクエストが入ると中断され、無くなると続きから再開されます。
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
        minRows={4}
        maxRows={12}
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

      {tracks.length > 0 && (
        <List disablePadding sx={{ mt: 2 }}>
          {tracks.map((t, i) => (
            <ListItem key={`${t.videoId}-${i}`} divider={i < tracks.length - 1} disableGutters>
              <ListItemAvatar>
                <Avatar variant="rounded" src={t.thumbnailUrl} sx={{ width: 48, height: 36, mr: 1 }} />
              </ListItemAvatar>
              <ListItemText primary={t.title} secondary={t.channelTitle} slotProps={{ primary: { noWrap: true } }} />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}

function BanManagement({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [requests, setRequests] = useState<AdminVideoRequest[]>([]);
  const [bans, setBans] = useState<BannedIP[]>([]);
  const [manualIP, setManualIP] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [requestsData, bansData] = await Promise.all([api.adminListRequests(), api.adminListBans()]);
      setRequests(requestsData);
      setBans(bansData);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "取得に失敗しました");
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const bannedIPs = new Set(bans.map((b) => b.ip));

  const handleBan = async (ip: string) => {
    try {
      await api.adminBanIP(ip);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "BANに失敗しました");
    }
  };

  const handleUnban = async (ip: string) => {
    try {
      await api.adminUnbanIP(ip);
      await refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "解除に失敗しました");
    }
  };

  const handleManualBan = async (e: React.FormEvent) => {
    e.preventDefault();
    const ip = manualIP.trim();
    if (!ip) return;
    await handleBan(ip);
    setManualIP("");
  };

  const handleLogout = async () => {
    try {
      await api.adminLogout();
    } finally {
      onLoggedOut();
    }
  };

  // Most recent requester per IP, so the admin can tell who they'd be banning.
  const recentRequesterByIP = new Map<string, AdminVideoRequest>();
  for (const r of requests) {
    if (!r.requesterIP) continue;
    const existing = recentRequesterByIP.get(r.requesterIP);
    if (!existing || r.createdAt > existing.createdAt) {
      recentRequesterByIP.set(r.requesterIP, r);
    }
  }
  const uniqueRequesterIPs = [...recentRequesterByIP.entries()].sort(
    (a, b) => (a[1].createdAt < b[1].createdAt ? 1 : -1),
  );

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <ShieldIcon color="primary" sx={{ mr: 1.5 }} fontSize="large" />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            管理者画面
          </Typography>
          <Button size="small" startIcon={<LogoutIcon />} onClick={handleLogout}>
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Stack spacing={3}>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <PlaylistManagement />

          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom>
              IPを指定してBAN
            </Typography>
            <Box component="form" onSubmit={handleManualBan}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="IPアドレス"
                  placeholder="例: 192.168.1.23"
                  value={manualIP}
                  onChange={(e) => setManualIP(e.target.value)}
                  size="small"
                  fullWidth
                />
                <Button type="submit" variant="contained" color="error" startIcon={<BlockIcon />}>
                  BAN
                </Button>
              </Stack>
            </Box>
          </Paper>

          <Box>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              BAN中のIP {bans.length > 0 && `(${bans.length})`}
            </Typography>
            {bans.length === 0 ? (
              <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
                <Typography color="text.secondary">BAN中のIPはありません</Typography>
              </Paper>
            ) : (
              <Paper elevation={2}>
                <List disablePadding>
                  {bans.map((b, i) => (
                    <ListItem
                      key={b.ip}
                      divider={i < bans.length - 1}
                      secondaryAction={
                        <Tooltip title="解除">
                          <IconButton edge="end" onClick={() => handleUnban(b.ip)}>
                            <LockOpenIcon />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemText
                        primary={b.ip}
                        secondary={`BAN日時: ${new Date(b.bannedAt).toLocaleString("ja-JP")}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          <Box>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              最近のリクエスト送信元
            </Typography>
            {uniqueRequesterIPs.length === 0 ? (
              <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
                <Typography color="text.secondary">リクエスト履歴はありません</Typography>
              </Paper>
            ) : (
              <Paper elevation={2}>
                <List disablePadding>
                  {uniqueRequesterIPs.map(([ip, r], i) => (
                    <ListItem
                      key={ip}
                      divider={i < uniqueRequesterIPs.length - 1}
                      secondaryAction={
                        bannedIPs.has(ip) ? (
                          <Chip label="BAN中" color="error" size="small" />
                        ) : (
                          <Tooltip title="このIPをBAN">
                            <IconButton edge="end" color="error" onClick={() => handleBan(ip)}>
                              <BlockIcon />
                            </IconButton>
                          </Tooltip>
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar variant="rounded" src={r.thumbnailUrl} sx={{ width: 48, height: 36, mr: 1 }} />
                      </ListItemAvatar>
                      <ListItemText
                        sx={{ pr: 6 }}
                        primary={ip}
                        secondary={r.title}
                        slotProps={{ secondary: { noWrap: true } }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

export default AdminPage;
