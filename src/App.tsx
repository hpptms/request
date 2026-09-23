import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import AdminReplyDialog from "./components/AdminReplyDialog";
import LikeRankDialog from "./components/LikeRankDialog";
import { MobileAnchorAd } from "./components/MobileAnchorAd";
import { PcRailAd } from "./components/PcRailAd";
import BoardPage from "./pages/BoardPage";
import { api } from "./api";
import { usePageViewTracking } from "./lib/usePageViewTracking";

// Lazy-loaded: BoardPage ("/") is the landing page almost every visitor
// hits first, so it's the only one that stays in the main bundle.
// Everything else — including the entire admin section (10 pages) and
// ViewerPage (OBS-capture only) — is fetched on demand instead of paid for
// by every visitor up front.
const PlayPage = lazy(() => import("./pages/PlayPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const HeatmapPage = lazy(() => import("./pages/HeatmapPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const ViewerPage = lazy(() => import("./pages/ViewerPage"));
const NoticePage = lazy(() => import("./pages/NoticePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminBansPage = lazy(() => import("./pages/AdminBansPage"));
const AdminPlaylistPage = lazy(() => import("./pages/AdminPlaylistPage"));
const AdminKeywordsPage = lazy(() => import("./pages/AdminKeywordsPage"));
const AdminSafeWordsPage = lazy(() => import("./pages/AdminSafeWordsPage"));
const AdminSafeIPsPage = lazy(() => import("./pages/AdminSafeIPsPage"));
const AdminKeywordLimitsPage = lazy(() => import("./pages/AdminKeywordLimitsPage"));
const AdminFastForwardPage = lazy(() => import("./pages/AdminFastForwardPage"));
const AdminFeaturesPage = lazy(() => import("./pages/AdminFeaturesPage"));
const AdminStatsPage = lazy(() => import("./pages/AdminStatsPage"));
const AdminHeatmapPage = lazy(() => import("./pages/AdminHeatmapPage"));
const AdminBroadcastPage = lazy(() => import("./pages/AdminBroadcastPage"));
const AdminInterruptPage = lazy(() => import("./pages/AdminInterruptPage"));
const AdminMessagesPage = lazy(() => import("./pages/AdminMessagesPage"));
const AdminNowLivePage = lazy(() => import("./pages/AdminNowLivePage"));

// /admin has its own login-gated pages (an admin needs to reach them to
// manage bans in the first place), and /viewer is the OBS capture output —
// never redirect either away no matter what the visitor's IP looks like.
function isExemptFromBanRedirect(pathname: string) {
  return pathname === "/notice" || pathname === "/viewer" || pathname.startsWith("/admin");
}

// Banned visitors can still load the site (nothing here requires auth), but
// every write they'd try already gets rejected server-side — so redirect
// them straight to /notice, which explains the ban and lets them message an
// admin, instead of letting them browse a board they can't act on.
function useBanRedirect(pathname: string) {
  const navigate = useNavigate();
  useEffect(() => {
    if (isExemptFromBanRedirect(pathname)) return;
    let cancelled = false;
    api
      .getBanStatus()
      .then(({ banned }) => {
        if (!cancelled && banned) navigate("/notice", { replace: true });
      })
      .catch(() => {
        // Network hiccup / API unreachable: fail open rather than trap an
        // unbanned visitor on an error.
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, navigate]);
}

function LazyPageFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
      <CircularProgress />
    </Box>
  );
}

function AppRoutes() {
  usePageViewTracking();

  const { pathname } = useLocation();
  useBanRedirect(pathname);
  // Not on the OBS capture page (it would end up on stream). The admin
  // section is included so the admin sees their own ranking too.
  const showLikeRank = pathname !== "/viewer";
  // Replies are for visitors: not on the OBS page, and not in the admin
  // section (the admin's own IP would otherwise pop up their own replies).
  const showReplies = pathname !== "/viewer" && !pathname.startsWith("/admin");

  return (
    <Suspense fallback={<LazyPageFallback />}>
      {showLikeRank && <LikeRankDialog />}
      {showReplies && <AdminReplyDialog />}
      <PcRailAd />
      <MobileAnchorAd />
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
        <Route path="/notice" element={<NoticePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<AdminBansPage />} />
          <Route path="playlist" element={<AdminPlaylistPage />} />
          <Route path="keywords" element={<AdminKeywordsPage />} />
          <Route path="safewords" element={<AdminSafeWordsPage />} />
          <Route path="safeips" element={<AdminSafeIPsPage />} />
          <Route path="keywordlimits" element={<AdminKeywordLimitsPage />} />
          <Route path="fastforward" element={<AdminFastForwardPage />} />
          <Route path="features" element={<AdminFeaturesPage />} />
          <Route path="stats" element={<AdminStatsPage />} />
          <Route path="heatmap" element={<AdminHeatmapPage />} />
          <Route path="broadcast" element={<AdminBroadcastPage />} />
          <Route path="interrupt" element={<AdminInterruptPage />} />
          <Route path="messages" element={<AdminMessagesPage />} />
          <Route path="live" element={<AdminNowLivePage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
