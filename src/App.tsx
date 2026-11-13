import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import AdminReplyDialog from "./components/AdminReplyDialog";
import LikeRankDialog from "./components/LikeRankDialog";
import { AffiliateAdLayout } from "./components/AffiliateAds";
import BoardPage from "./pages/BoardPage";
import { api } from "./api";
import { usePageViewTracking } from "./lib/usePageViewTracking";
import { isSupporter, useAccount } from "./lib/account";
import { LoggedOutElsewhereNotice } from "./components/LoggedOutElsewhereNotice";

// Lazy-loaded: BoardPage ("/") is the landing page almost every visitor
// hits first, so it's the only one that stays in the main bundle.
// Everything else — including the entire admin section and
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
const GuidePage = lazy(() => import("./pages/GuidePage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const ThemesPage = lazy(() => import("./pages/ThemesPage"));
const PollsPage = lazy(() => import("./pages/PollsPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const CopyrightPage = lazy(() => import("./pages/CopyrightPage"));
const CopyrightClaimPage = lazy(() => import("./pages/CopyrightClaimPage"));
const AdminCopyrightClaimsPage = lazy(() => import("./pages/AdminCopyrightClaimsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const TokushohoPage = lazy(() => import("./pages/TokushohoPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminBansPage = lazy(() => import("./pages/AdminBansPage"));
const AdminPlaylistPage = lazy(() => import("./pages/AdminPlaylistPage"));
const AdminBlockedWordsPage = lazy(() => import("./pages/AdminBlockedWordsPage"));
const AdminSafeListsPage = lazy(() => import("./pages/AdminSafeListsPage"));
const AdminFastForwardPage = lazy(() => import("./pages/AdminFastForwardPage"));
const AdminFeaturesPage = lazy(() => import("./pages/AdminFeaturesPage"));
const AdminBroadcastPage = lazy(() => import("./pages/AdminBroadcastPage"));
const AdminInterruptPage = lazy(() => import("./pages/AdminInterruptPage"));
const AdminMessagesPage = lazy(() => import("./pages/AdminMessagesPage"));
const AdminNowLivePage = lazy(() => import("./pages/AdminNowLivePage"));
const AdminThemesPage = lazy(() => import("./pages/AdminThemesPage"));
const AdminPollsPage = lazy(() => import("./pages/AdminPollsPage"));

// /admin has its own login-gated pages (an admin needs to reach them to
// manage bans in the first place), and /viewer is the OBS capture output —
// never redirect either away no matter what the visitor's IP looks like.
// /account (and the pages a purchase links to) stay reachable too: a banned
// visitor may log in and subscribe, and a サポーター プラン member isn't
// subject to bans (the backend then reports them as not banned).
const BAN_REDIRECT_EXEMPT = new Set(["/notice", "/viewer", "/account", "/tokushoho", "/terms", "/privacy"]);
function isExemptFromBanRedirect(pathname: string) {
  return BAN_REDIRECT_EXEMPT.has(pathname) || pathname.startsWith("/admin");
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

function AdWrapper({ show, pathname, children }: { show: boolean; pathname: string; children: ReactNode }) {
  return show ? <AffiliateAdLayout pathname={pathname}>{children}</AffiliateAdLayout> : children;
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
  // Affiliate banners: not on /play (video/queue fill the screen), the OBS
  // page, or the admin section.
  // Never for サポーター プラン members; while the account is still loading,
  // held back so a supporter doesn't see them flash in first.
  const account = useAccount();
  const showAds =
    account.status !== "loading" &&
    !isSupporter(account) &&
    pathname !== "/play" &&
    pathname !== "/viewer" &&
    pathname !== "/account" &&
    !pathname.startsWith("/admin");

  return (
    <Suspense fallback={<LazyPageFallback />}>
      {showLikeRank && <LikeRankDialog />}
      {showReplies && <AdminReplyDialog />}
      {pathname !== "/viewer" && <LoggedOutElsewhereNotice />}
      <AdWrapper show={showAds} pathname={pathname}>
        <Routes>
          <Route path="/" element={<BoardPage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/stats/*" element={<StatsPage />} />
          <Route path="/heatmap" element={<HeatmapPage />} />
          <Route path="/notice" element={<NoticePage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/themes" element={<ThemesPage />} />
          <Route path="/polls" element={<PollsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/copyright" element={<CopyrightPage />} />
          <Route path="/copyright-request" element={<CopyrightClaimPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/tokushoho" element={<TokushohoPage />} />
          <Route path="/viewer" element={<ViewerPage />} />
          <Route path="/admin" element={<AdminPage />}>
            <Route index element={<AdminBansPage />} />
            <Route path="playlist" element={<AdminPlaylistPage />} />
            <Route path="keywords" element={<AdminBlockedWordsPage />} />
            <Route path="safewords" element={<AdminSafeListsPage />} />
            {/* Old tab paths, now merged into the two tabs above. */}
            <Route path="keywordlimits" element={<Navigate to="/admin/keywords" replace />} />
            <Route path="safeips" element={<Navigate to="/admin/safewords" replace />} />
            <Route path="fastforward" element={<AdminFastForwardPage />} />
            <Route path="features" element={<AdminFeaturesPage />} />
            <Route path="broadcast" element={<AdminBroadcastPage />} />
            <Route path="interrupt" element={<AdminInterruptPage />} />
            <Route path="messages" element={<AdminMessagesPage />} />
            <Route path="live" element={<AdminNowLivePage />} />
            <Route path="themes" element={<AdminThemesPage />} />
            <Route path="polls" element={<AdminPollsPage />} />
            <Route path="copyright" element={<AdminCopyrightClaimsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AdWrapper>
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
