import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "./components/common/ThemeProvider";
import Navbar from "./components/layout/Navbar";
import HomePage from "./pages/home/HomePage";
import AppRoutes from "./routes";
import WorldMap from "./map/WorldMap";
import AuthPage from "./pages/auth/AuthPage";
import ProfilePage from "./pages/profile/ProfilePage";
import StorePage from "./pages/store/StorePage";
import InventoryPage from "./pages/inventory/InventoryPage";
import LeaderboardPage from "./pages/leaderboard/LeaderboardPage";
import BattleLobbyPage from "./pages/battle/BattleLobbyPage";
import BattleArenaPage from "./pages/battle/BattleArenaPage";
import BattleResultPage from "./pages/battle/BattleResultPage";
import AchievementsPage from "./pages/achievements/AchievementsPage";
import FriendsPage from "./pages/friends/FriendsPage";
import GroupLobbyPage from "./pages/group/GroupLobbyPage";
import GroupArenaPage from "./pages/group/GroupArenaPage";
import GroupResultPage from "./pages/group/GroupResultPage";
import useUserStore from "./stores/useUserStore";
import useGamificationStore from "./stores/useGamificationStore";
import useAchievementStore from "./stores/useAchievementStore";
import useFriendsStore from "./stores/useFriendsStore";
import useProgressStore from "./map/useProgressStore";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import FriendChallengeModal from "./pages/friends/FriendChallengeModal";
import useBattleStore from "./stores/useBattleStore";

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

const ZINC_LIGHT_SCOPE_PATHS = [
  '/login',
  '/signup',
  '/problem',
  '/profile',
  '/store',
  '/inventory',
  '/leaderboard',
  '/battle',
  '/achievements',
  '/friends',
  '/group',
  '/problems',
];

const MAP_DARK_LOCK_PATHS = [
  '/map',
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
 * This is the SINGLE place that bootstraps the universal state layer -
 * individual pages / components no longer need to kick off their own fetches
 * for the core data (coins, XP, streak, badges, solved problems).
 */
function useAppInit() {
  const user = useUserStore((s) => s.user);
  const hydrateSession = useUserStore((s) => s.hydrateSession);
  const uid = user?.uid ?? null;

  // Keep a ref to the previous uid so we can detect genuine changes
  const prevUidRef = useRef(undefined);

  // Boot once: if only cookie exists (no local token/user persisted),
  // recover authenticated user profile from /api/auth/me.
  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

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
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const uid = user?.uid ?? null;
  const { activeBattleState, battleId, activeBattleMode, activeBattleRoomCode, checkActiveBattle, fetchLobby } = useBattleStore();

  // Bootstrap all global stores (gamification, achievements, progress)
  // whenever the logged-in user changes.
  useAppInit();

  useEffect(() => {
    const onAuthExpired = (event) => {
      const message = event?.detail?.message || "Session expired. Please log in again.";
      if (location.pathname !== "/login" && location.pathname !== "/signup") {
        navigate("/login", {
          replace: true,
          state: { authExpiredMessage: message },
        });
      }
    };

    window.addEventListener("vantage:auth-expired", onAuthExpired);
    return () => window.removeEventListener("vantage:auth-expired", onAuthExpired);
  }, [location.pathname, navigate]);

  const [scrollDirection, setScrollDirection] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll listener
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let frameId = null;

    const update = () => {
      frameId = null;
      const currentScrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const nextDirection = currentScrollY > lastScrollY ? 1 : -1;
      const nextProgress = maxScroll > 0 ? currentScrollY / maxScroll : 0;

      setScrollDirection((prev) => (prev === nextDirection ? prev : nextDirection));
      setScrollProgress((prev) => (Math.abs(prev - nextProgress) < 0.001 ? prev : nextProgress));

      lastScrollY = currentScrollY;
    };

    const handleScroll = () => {
      if (frameId != null) return;
      frameId = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId != null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const body = window.document.body;
    const shouldUseZincLightScope = ZINC_LIGHT_SCOPE_PATHS.some((path) =>
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
    const isMapPage = MAP_DARK_LOCK_PATHS.some((path) =>
      location.pathname === path || location.pathname.startsWith(path + '/')
    );

    body.classList.toggle('vantage-zinc-pages', shouldUseZincLightScope && !isMapPage);
    body.classList.toggle('vantage-map-page', isMapPage);

    return () => {
      body.classList.remove('vantage-zinc-pages');
      body.classList.remove('vantage-map-page');
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!uid) return;

    checkActiveBattle(uid);
    const interval = setInterval(() => checkActiveBattle(uid), 15000);
    return () => clearInterval(interval);
  }, [uid, location.pathname, checkActiveBattle]);

  // Check if navbar should be shown for current path
  const showNavbar = !NAVBAR_HIDDEN_PATHS.some(path =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  ) && !location.pathname.startsWith('/problem/');

  // Check if navbar should allow transparency at top
  const allowTransparency = TRANSPARENT_NAVBAR_PATHS.some(path =>
    location.pathname === path
  );

  const showScrollTop = scrollProgress > 0.1;
  const hideBattleOverlay =
    location.pathname === "/battle" ||
    location.pathname.startsWith("/battle/match/") ||
    location.pathname.startsWith("/battle/result/") ||
    location.pathname === "/group" ||
    location.pathname.startsWith("/group/") ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  const handleBattleOverlayJoin = async () => {
    if (!battleId || !uid) return;
    const isGroup = activeBattleMode === "GROUP_FFA";

    if (activeBattleState === "ACTIVE") {
      navigate(isGroup ? `/group/match/${battleId}` : `/battle/match/${battleId}`);
      return;
    }
    if (activeBattleState === "WAITING") {
      if (isGroup && activeBattleRoomCode) {
        navigate(`/group/${activeBattleRoomCode}`);
        return;
      }
      try {
        await fetchLobby(battleId, uid);
      } catch {
        // ignore and still route to battle page
      }
      navigate("/battle");
    }
  };

  return (
    <div>
      <ScrollToTop />
      {showNavbar && (
        <Navbar
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
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/signup" element={<AuthPage initialMode="signup" />} />
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

      {!hideBattleOverlay && activeBattleState && battleId && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "1.2rem",
            width: "min(760px, calc(100vw - 2rem))",
            zIndex: 9998,
            borderRadius: 14,
            border: "1px solid rgba(248,113,113,0.3)",
            background: "rgba(13,13,16,0.9)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: activeBattleState === "ACTIVE" ? "#f87171" : "#fbbf24",
              boxShadow:
                activeBattleState === "ACTIVE"
                  ? "0 0 12px rgba(248,113,113,0.9)"
                  : "0 0 12px rgba(251,191,36,0.85)",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
              Ongoing Battle
            </div>
            <div style={{ fontSize: 13, color: "#fff" }}>
              You have a battle {activeBattleState === "ACTIVE" ? "in progress" : "waiting in lobby"}.
            </div>
          </div>

          <button
            onClick={handleBattleOverlayJoin}
            style={{
              height: 36,
              borderRadius: 10,
              border: "none",
              padding: "0 14px",
              background: "#EDFF66",
              color: "#09090b",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {activeBattleState === "ACTIVE" ? "Rejoin Battle" : "Rejoin Lobby"}
          </button>
        </div>
      )}

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
