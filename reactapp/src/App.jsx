import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import ZentryNavbar from "./components/zentry/ZentryNavbar";
import HomePage from "./pages/HomePage";
import AppRoutes from "./routes";
import WorldMap from "./map/WorldMap";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import StorePage from "./pages/StorePage";
import InventoryPage from "./pages/InventoryPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import BattleLobbyPage from "./pages/BattleLobbyPage";
import BattleArenaPage from "./pages/BattleArenaPage";
import BattleResultPage from "./pages/BattleResultPage";
import AchievementsPage from "./pages/AchievementsPage";
import FriendsPage from "./pages/FriendsPage";
import GroupLobbyPage from "./pages/GroupLobbyPage";
import GroupArenaPage from "./pages/GroupArenaPage";
import GroupResultPage from "./pages/GroupResultPage";
import useUserStore from "./stores/useUserStore";
import useGamificationStore from "./stores/useGamificationStore";
import useAchievementStore from "./stores/useAchievementStore";
import useFriendsStore from "./stores/useFriendsStore";
import useProgressStore from "./map/useProgressStore";
import ProtectedRoute from "./components/ProtectedRoute";
import FriendChallengeModal from "./components/FriendChallengeModal";

const JudgePage = lazy(() => import("./pages/judge/JudgePage"));
const ProblemListPage = lazy(() => import("./pages/problems/ProblemListPage"));

const NAVBAR_HIDDEN_PATHS = [
  '/map',
  '/login',
  '/signup',
  '/battle/match',
  '/group/match',
];

const TRANSPARENT_NAVBAR_PATHS = [
  '/',
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

/**
 * Global app initialisation hook.
 *
 * Runs whenever the authenticated user changes (login / logout).
 * On login  → loads gamification stats, achievements, and problem progress.
 * On logout → clears all stores so no stale data leaks between sessions.
 *
 * This is the SINGLE place that bootstraps the universal state layer —
 * individual pages / components no longer need to kick off their own fetches
 * for the core data (coins, XP, streak, badges, solved problems).
 */
function useAppInit() {
  const user = useUserStore((s) => s.user);
  const uid = user?.uid ?? null;

  // Keep a ref to the previous uid so we can detect genuine changes
  const prevUidRef = useRef(undefined);

  useEffect(() => {
    const prev = prevUidRef.current;
    prevUidRef.current = uid;

    if (uid) {
      // ── User logged in (or app just mounted with an existing session) ──
      // Fire all store loaders in parallel; each store guards against
      // redundant fetches internally.
      useGamificationStore.getState().loadStats(uid);
      useAchievementStore.getState().loadAchievements(uid);
      useProgressStore.getState().loadProgress(uid);
      useFriendsStore.getState().loadOverview();
      useFriendsStore.getState().connectNotifications(uid);
      // Subscribe to SSE globally so live updates (e.g. LC sync right after
      // registration) update coins/XP everywhere, not only on the map page.
      const sseCleanup = useProgressStore.getState().subscribeToLiveUpdates(uid);
      return () => {
        if (typeof sseCleanup === "function") sseCleanup();
        useFriendsStore.getState().disconnectNotifications();
      };
    } else if (prev !== undefined && prev !== null) {
      // ── User just logged out (prev was a real uid, now null) ──
      useGamificationStore.getState().clearStats();
      useAchievementStore.getState().clearAchievements();
      useProgressStore.getState().clearForLogout();
      useFriendsStore.getState().reset();
    }
  }, [uid]);
}

function AppContent() {
  const location = useLocation();

  // Bootstrap all global stores (gamification, achievements, progress)
  // whenever the logged-in user changes.
  useAppInit();

  const [scrollDirection, setScrollDirection] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll listener
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      setScrollDirection(currentScrollY > lastScrollY ? 1 : -1);
      setScrollProgress(maxScroll > 0 ? currentScrollY / maxScroll : 0);

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if navbar should be shown for current path
  const showNavbar = !NAVBAR_HIDDEN_PATHS.some(path =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  ) && !location.pathname.startsWith('/problem/');

  // Check if navbar should allow transparency at top
  const allowTransparency = TRANSPARENT_NAVBAR_PATHS.some(path =>
    location.pathname === path
  );

  const showScrollTop = scrollProgress > 0.1;

  return (
    <div>
      <ScrollToTop />
      {showNavbar && (
        <ZentryNavbar
          allowTransparency={allowTransparency}
          controls={{
            scrollDirection,
            scrollProgress,
          }}
        />
      )}

      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/store" element={<ProtectedRoute><StorePage /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/battle" element={<ProtectedRoute><BattleLobbyPage /></ProtectedRoute>} />
          <Route path="/battle/match/:battleId" element={<ProtectedRoute><BattleArenaPage /></ProtectedRoute>} />
          <Route path="/battle/result/:battleId" element={<ProtectedRoute><BattleResultPage /></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
          <Route path="/group" element={<ProtectedRoute><GroupLobbyPage /></ProtectedRoute>} />
          <Route path="/group/:roomCode" element={<ProtectedRoute><GroupLobbyPage /></ProtectedRoute>} />
          <Route path="/group/match/:battleId" element={<ProtectedRoute><GroupArenaPage /></ProtectedRoute>} />
          <Route path="/group/result/:battleId" element={<ProtectedRoute><GroupResultPage /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><WorldMap /></ProtectedRoute>} />
          <Route path="/problems" element={<ProblemListPage />} />
          <Route path="/problem/:problemId" element={<JudgePage />} />
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </Suspense>

      <FriendChallengeModal />

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
        style={{
          position: "fixed",
          bottom: "1.75rem",
          right: "1.75rem",
          zIndex: 9999,
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(15,15,20,0.75)",
          backdropFilter: "blur(10px)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? "translateY(0) scale(1)" : "translateY(12px) scale(0.85)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
          pointerEvents: showScrollTop ? "auto" : "none",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vantage-theme">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
