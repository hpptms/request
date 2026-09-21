import { Suspense, useCallback, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useTheme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import CampaignIcon from "@mui/icons-material/Campaign";
import FastForwardIcon from "@mui/icons-material/FastForward";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import MapIcon from "@mui/icons-material/Map";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import MailIcon from "@mui/icons-material/Mail";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import SettingsIcon from "@mui/icons-material/Settings";
import ShieldIcon from "@mui/icons-material/Shield";
import GppGoodIcon from "@mui/icons-material/GppGood";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { api } from "../api";
import { AdminLoginForm } from "../components/AdminLoginForm";
import { SiteLogo } from "../components/SiteLogo";

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
  { value: "safewords", path: "/admin/safewords", label: "セーフワード", icon: <VerifiedUserIcon fontSize="small" /> },
  { value: "safeips", path: "/admin/safeips", label: "セーフIP", icon: <GppGoodIcon fontSize="small" /> },
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
  { value: "heatmap", path: "/admin/heatmap", label: "ヒートマップ", icon: <MapIcon fontSize="small" /> },
  { value: "broadcast", path: "/admin/broadcast", label: "意思表示", icon: <CampaignIcon fontSize="small" /> },
  { value: "interrupt", path: "/admin/interrupt", label: "割り込みリクエスト", icon: <PlaylistAddIcon fontSize="small" /> },
  { value: "messages", path: "/admin/messages", label: "メッセージ", icon: <MailIcon fontSize="small" /> },
  { value: "live", path: "/admin/live", label: "NOW LIVE", icon: <LiveTvIcon fontSize="small" /> },
] as const;

// Shared header for every authenticated /admin/* screen: title, logout, and
// a tab bar that switches between the screens listed in adminTabs above.
// The matched child route renders below via <Outlet />.
function AdminLayout({ onLoggedOut }: { onLoggedOut: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = adminTabs.find((t) => t.value !== "bans" && location.pathname.startsWith(t.path))?.value ?? "bans";
  const theme = useTheme();
  // Icon-only toolbar buttons below this width — same overflow problem as
  // BoardPage's nav row, just with the title added to the mix.
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Unread visitor messages, shown on the メッセージ tab so a new one is
  // noticed without having that tab open.
  const [unreadMessages, setUnreadMessages] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const poll = () =>
      api
        .adminListInquiries()
        .then(({ unread }) => {
          if (!cancelled) setUnreadMessages(unread);
        })
        .catch(() => {});
    poll();
    const interval = setInterval(poll, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [location.pathname]);

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
          <SiteLogo />
          <Typography
            variant="h6"
            component="h1"
            noWrap
            sx={{ fontSize: { xs: "1.05rem", sm: "1.25rem" }, flexGrow: 1, minWidth: 0 }}
          >
            管理者画面
          </Typography>
          <Button
            component="a"
            href="/viewer"
            target="_blank"
            rel="noopener"
            size="small"
            aria-label={isMobile ? "再生画面を開く" : undefined}
            startIcon={isMobile ? undefined : <PlayCircleIcon />}
            endIcon={isMobile ? undefined : <OpenInNewIcon />}
            sx={{ whiteSpace: "nowrap", minWidth: 0, px: isMobile ? 1 : 2 }}
          >
            {isMobile ? <PlayCircleIcon fontSize="small" /> : "再生画面を開く"}
          </Button>
          <Button
            size="small"
            aria-label={isMobile ? "ログアウト" : undefined}
            startIcon={isMobile ? undefined : <LogoutIcon />}
            onClick={handleLogout}
            sx={{ whiteSpace: "nowrap", minWidth: 0, px: isMobile ? 1 : 2 }}
          >
            {isMobile ? <LogoutIcon fontSize="small" /> : "ログアウト"}
          </Button>
        </Toolbar>
        <Tabs
          value={tab}
          onChange={(_, value: string) => navigate(adminTabs.find((t) => t.value === value)?.path ?? "/admin")}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ px: { xs: 1.5, sm: 3 } }}
        >
          {adminTabs.map((t) => (
            <Tab
              key={t.value}
              value={t.value}
              label={t.value === "messages" && unreadMessages > 0 ? `${t.label} (${unreadMessages})` : t.label}
              icon={t.icon} iconPosition="start"
              sx={{ whiteSpace: "nowrap" }}
            />
          ))}
        </Tabs>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        {/* Own Suspense boundary (not just App.tsx's top-level one): each
            admin tab is its own lazy chunk (see App.tsx), and without this,
            switching tabs would blank out this whole screen — AppBar and
            tab strip included — behind the top-level fallback instead of
            just this content area. */}
        <Suspense
          fallback={
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          }
        >
          <Outlet />
        </Suspense>
      </Container>
    </Box>
  );
}

export default AdminPage;
