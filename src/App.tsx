import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminBansPage from "./pages/AdminBansPage";
import AdminFastForwardPage from "./pages/AdminFastForwardPage";
import AdminFeaturesPage from "./pages/AdminFeaturesPage";
import AdminKeywordLimitsPage from "./pages/AdminKeywordLimitsPage";
import AdminKeywordsPage from "./pages/AdminKeywordsPage";
import AdminPage from "./pages/AdminPage";
import AdminPlaylistPage from "./pages/AdminPlaylistPage";
import AdminStatsPage from "./pages/AdminStatsPage";
import BoardPage from "./pages/BoardPage";
import StatsPage from "./pages/StatsPage";
import ViewerPage from "./pages/ViewerPage";
import { usePageViewTracking } from "./lib/usePageViewTracking";

function AppRoutes() {
  usePageViewTracking();

  return (
    <Routes>
      <Route path="/" element={<BoardPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/viewer" element={<ViewerPage />} />
      <Route path="/admin" element={<AdminPage />}>
        <Route index element={<AdminBansPage />} />
        <Route path="playlist" element={<AdminPlaylistPage />} />
        <Route path="keywords" element={<AdminKeywordsPage />} />
        <Route path="keywordlimits" element={<AdminKeywordLimitsPage />} />
        <Route path="fastforward" element={<AdminFastForwardPage />} />
        <Route path="features" element={<AdminFeaturesPage />} />
        <Route path="stats" element={<AdminStatsPage />} />
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
