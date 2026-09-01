import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LogoutIcon from "@mui/icons-material/Logout";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";
import ShieldIcon from "@mui/icons-material/Shield";
import { api } from "../api";

// Gatekeeper for every /admin/* route: shows a login form until an admin
// session cookie is confirmed, then hands off to AdminLayout (header +
// tab navigation + the matched child screen).
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
    <AdminLayout onLoggedOut={() => setAuthenticated(false)} />
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

// Shared header for every authenticated /admin/* screen: title, logout, and
// a tab bar that switches between BAN management and the playlist screen.
// The matched child route renders below via <Outlet />.
function AdminLayout({ onLoggedOut }: { onLoggedOut: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = location.pathname.startsWith("/admin/playlist") ? "playlist" : "bans";

  const handleLogout = async () => {
    try {
      await api.adminLogout();
    } finally {
      onLoggedOut();
    }
  };

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
        <Tabs
          value={tab}
          onChange={(_, value: string) => navigate(value === "playlist" ? "/admin/playlist" : "/admin")}
          sx={{ px: { xs: 1.5, sm: 3 } }}
        >
          <Tab value="bans" label="BAN管理" icon={<ShieldIcon fontSize="small" />} iconPosition="start" />
          <Tab value="playlist" label="プレイリスト" icon={<PlaylistPlayIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}

export default AdminPage;
