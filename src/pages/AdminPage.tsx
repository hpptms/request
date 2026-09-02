import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import LogoutIcon from "@mui/icons-material/Logout";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";
import ShieldIcon from "@mui/icons-material/Shield";
import { api } from "../api";
import { AdminLoginForm } from "../components/AdminLoginForm";

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
    <AdminLoginForm onLoggedIn={() => setAuthenticated(true)} />
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
