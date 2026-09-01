import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminBansPage from "./pages/AdminBansPage";
import AdminPage from "./pages/AdminPage";
import AdminPlaylistPage from "./pages/AdminPlaylistPage";
import BoardPage from "./pages/BoardPage";
import ViewerPage from "./pages/ViewerPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<AdminBansPage />} />
          <Route path="playlist" element={<AdminPlaylistPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
