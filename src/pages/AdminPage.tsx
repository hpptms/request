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
import FastForwardIcon from "@mui/icons-material/FastForward";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import SettingsIcon from "@mui/icons-material/Settings";
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

  // Re-checked periodically (not just once on mount) so an admin who gets
  // evicted by a 3rd concurrent login (see adminauth.MaxConcurrentSessions)
  // is dropped back to the login form within one interval, instead of
  // silently having their next action fail.
  useEffect(() => {
    checkSession();
    const interval = setInterval(checkSession, 15000);
    return () => clearInterval(interval);
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

// The tab bar's entries: each maps a /admin/* sub-path to its tab value,
// label and icon. "bans" is the index route (/admin itself).
const adminTabs = [
  { value: "bans", path: "/admin", label: "BAN管理", icon: <ShieldIcon fontSize="small" /> },
  { value: "playlist", path: "/admin/playlist", label: "プレイリスト", icon: <PlaylistPlayIcon fontSize="small" /> },
  { value: "keywords", path: "/admin/keywords", label: "禁止ワード", icon: <FilterAltIcon fontSize="small" /> },
  {
    value: "keywordlimits",
    path: "/admin/keywordlimits",
    label: "セミ禁止ワード",
    icon: <FilterAltOutlinedIcon fontSize="small" />,
  },
  {
    value: "fastforward",
    path: "/admin/fastforward",
    label: "早送り",
    icon: <FastForwardIcon fontSize="small" />,
  },
  { value: "features", path: "/admin/features", label: "機能", icon: <SettingsIcon fontSize="small" /> },
  { value: "stats", path: "/admin/stats", label: "集計", icon: <QueryStatsIcon fontSize="small" /> },
] as const;

// Shared header for every authenticated /admin/* screen: title, logout, and
// a tab bar that switches between the screens listed in adminTabs above.
// The matched child route renders below via <Outlet />.
function AdminLayout({ onLoggedOut }: { onLoggedOut: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = adminTabs.find((t) => t.value !== "bans" && location.pathname.startsWith(t.path))?.value ?? "bans";

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
          <Button
            component="a"
            href="/viewer"
            target="_blank"
            rel="noopener"
            size="small"
            startIcon={<PlayCircleIcon />}
            endIcon={<OpenInNewIcon />}
            sx={{ whiteSpace: "nowrap" }}
          >
            再生画面を開く
          </Button>
          <Button size="small" startIcon={<LogoutIcon />} onClick={handleLogout}>
            ログアウト
          </Button>
        </Toolbar>
        <Tabs
          value={tab}
          onChange={(_, value: string) => navigate(adminTabs.find((t) => t.value === value)?.path ?? "/admin")}
          sx={{ px: { xs: 1.5, sm: 3 } }}
        >
          {adminTabs.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}

export default AdminPage;
