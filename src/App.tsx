import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminBansPage from "./pages/AdminBansPage";
import AdminFastForwardPage from "./pages/AdminFastForwardPage";
import AdminFeaturesPage from "./pages/AdminFeaturesPage";
import AdminKeywordLimitsPage from "./pages/AdminKeywordLimitsPage";
import AdminKeywordsPage from "./pages/AdminKeywordsPage";
import AdminPage from "./pages/AdminPage";
import AdminPlaylistPage from "./pages/AdminPlaylistPage";
import BoardPage from "./pages/BoardPage";
import ReportPage from "./pages/ReportPage";
import ViewerPage from "./pages/ViewerPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<AdminBansPage />} />
          <Route path="playlist" element={<AdminPlaylistPage />} />
          <Route path="keywords" element={<AdminKeywordsPage />} />
          <Route path="keywordlimits" element={<AdminKeywordLimitsPage />} />
          <Route path="fastforward" element={<AdminFastForwardPage />} />
          <Route path="features" element={<AdminFeaturesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
