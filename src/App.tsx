import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import LikeRankDialog from "./components/LikeRankDialog";
import BoardPage from "./pages/BoardPage";
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
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminBansPage = lazy(() => import("./pages/AdminBansPage"));
const AdminPlaylistPage = lazy(() => import("./pages/AdminPlaylistPage"));
const AdminKeywordsPage = lazy(() => import("./pages/AdminKeywordsPage"));
const AdminKeywordLimitsPage = lazy(() => import("./pages/AdminKeywordLimitsPage"));
const AdminFastForwardPage = lazy(() => import("./pages/AdminFastForwardPage"));
const AdminFeaturesPage = lazy(() => import("./pages/AdminFeaturesPage"));
const AdminStatsPage = lazy(() => import("./pages/AdminStatsPage"));
const AdminHeatmapPage = lazy(() => import("./pages/AdminHeatmapPage"));
const AdminBroadcastPage = lazy(() => import("./pages/AdminBroadcastPage"));
const AdminInterruptPage = lazy(() => import("./pages/AdminInterruptPage"));

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
  // Not on the OBS capture page or the admin section.
  const showLikeRank = pathname !== "/viewer" && !pathname.startsWith("/admin");

  return (
    <Suspense fallback={<LazyPageFallback />}>
      {showLikeRank && <LikeRankDialog />}
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<AdminBansPage />} />
          <Route path="playlist" element={<AdminPlaylistPage />} />
          <Route path="keywords" element={<AdminKeywordsPage />} />
          <Route path="keywordlimits" element={<AdminKeywordLimitsPage />} />
          <Route path="fastforward" element={<AdminFastForwardPage />} />
          <Route path="features" element={<AdminFeaturesPage />} />
          <Route path="stats" element={<AdminStatsPage />} />
          <Route path="heatmap" element={<AdminHeatmapPage />} />
          <Route path="broadcast" element={<AdminBroadcastPage />} />
          <Route path="interrupt" element={<AdminInterruptPage />} />
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
