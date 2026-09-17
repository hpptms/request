import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import AboutPage from "./pages/AboutPage";
import AdminBansPage from "./pages/AdminBansPage";
import AdminBroadcastPage from "./pages/AdminBroadcastPage";
import AdminFastForwardPage from "./pages/AdminFastForwardPage";
import AdminFeaturesPage from "./pages/AdminFeaturesPage";
import AdminKeywordLimitsPage from "./pages/AdminKeywordLimitsPage";
import AdminKeywordsPage from "./pages/AdminKeywordsPage";
import AdminPage from "./pages/AdminPage";
import AdminPlaylistPage from "./pages/AdminPlaylistPage";
import AdminStatsPage from "./pages/AdminStatsPage";
import BoardPage from "./pages/BoardPage";
import ContactPage from "./pages/ContactPage";
import PlayPage from "./pages/PlayPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import StatsPage from "./pages/StatsPage";
import ViewerPage from "./pages/ViewerPage";
import { usePageViewTracking } from "./lib/usePageViewTracking";

// Lazy-loaded: react-simple-maps + d3-geo (see ActiveUsersMap) add ~270KB
// gzipped, otherwise pulled into the main bundle for every visitor even
// though only these two routes use it.
const HeatmapPage = lazy(() => import("./pages/HeatmapPage"));
const AdminHeatmapPage = lazy(() => import("./pages/AdminHeatmapPage"));

function LazyPageFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
      <CircularProgress />
    </Box>
  );
}

function AppRoutes() {
  usePageViewTracking();

  return (
    <Routes>
      <Route path="/" element={<BoardPage />} />
      <Route path="/play" element={<PlayPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route
        path="/heatmap"
        element={
          <Suspense fallback={<LazyPageFallback />}>
            <HeatmapPage />
          </Suspense>
        }
      />
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
        <Route
          path="heatmap"
          element={
            <Suspense fallback={<LazyPageFallback />}>
              <AdminHeatmapPage />
            </Suspense>
          }
        />
        <Route path="broadcast" element={<AdminBroadcastPage />} />
      </Route>
    </Routes>
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
