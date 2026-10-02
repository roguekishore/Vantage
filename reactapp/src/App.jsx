import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "./components/common/ThemeProvider";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import AppRoutes from "./routes";
import useUserStore from "./stores/useUserStore";
import useGamificationStore from "./stores/useGamificationStore";
import useAchievementStore from "./stores/useAchievementStore";
import useFriendsStore from "./stores/useFriendsStore";
import useProgressStore from "./map/useProgressStore";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import FriendChallengeModal from "./pages/friends/FriendChallengeModal";
// Direct file imports (not the ds barrel) keep the rest of ds/* out of the main chunk.
import { Toaster } from "./components/ds/Toast";
import { TooltipProvider } from "./components/ds/Tooltip";
import { Button } from "./components/ds/Button";
import { IconButton } from "./components/ds/IconButton";
import { PageLoader } from "./components/ds/States";
import { ArrowUp } from "lucide-react";
import useBattleStore from "./stores/useBattleStore";

const HomePage = lazy(() => import("./pages/home/HomePage"));
const WorldMap = lazy(() => import("./map/WorldMap"));
const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const StorePage = lazy(() => import("./pages/store/StorePage"));
const InventoryPage = lazy(() => import("./pages/inventory/InventoryPage"));
const LeaderboardPage = lazy(() => import("./pages/leaderboard/LeaderboardPage"));
const BattleLobbyPage = lazy(() => import("./pages/battle/BattleLobbyPage"));
const BattleArenaPage = lazy(() => import("./pages/battle/BattleArenaPage"));
const BattleResultPage = lazy(() => import("./pages/battle/BattleResultPage"));
const AchievementsPage = lazy(() => import("./pages/achievements/AchievementsPage"));
const FriendsPage = lazy(() => import("./pages/friends/FriendsPage"));
const GroupLobbyPage = lazy(() => import("./pages/group/GroupLobbyPage"));
const GroupArenaPage = lazy(() => import("./pages/group/GroupArenaPage"));
const GroupResultPage = lazy(() => import("./pages/group/GroupResultPage"));
const JudgePage = lazy(() => import("./pages/judge/JudgePage"));
const ProblemListPage = lazy(() => import("./pages/problems/ProblemListPage"));
// Hidden design-system preview (not linked anywhere).
const DsPage = lazy(() => import("./pages/ds/DsPage"));

const NAVBAR_HIDDEN_PATHS = [
  '/__ds',
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

    body.classList.toggle('vantage-zinc-pages', shouldUseZincLightScope);

    return () => {
      body.classList.remove('vantage-zinc-pages');
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
    location.pathname === "/" ||
    location.pathname === "/battle" ||
    location.pathname.startsWith("/battle/match/") ||
    location.pathname.startsWith("/battle/result/") ||
    location.pathname === "/group" ||
    location.pathname.startsWith("/group/") ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  const showBattleOverlay = !hideBattleOverlay && Boolean(activeBattleState && battleId);

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

      <Suspense fallback={<PageLoader />}>
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
          <Route path="/__ds" element={<DsPage />} />
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </Suspense>

      {/* Footer on every page that shows the Navbar (not arenas, judge, map, auth). */}
      {showNavbar && <Footer />}

      <FriendChallengeModal />

      {showBattleOverlay && (
        <>
          {/* Spacer so the strip never covers the end of the page. */}
          <div aria-hidden="true" className="h-14" />
          <div
            role="status"
            className="fixed inset-x-0 bottom-0 z-toast flex min-h-14 items-center gap-3 border-t border-border-strong bg-surface px-[var(--gutter)] py-2"
          >
            <span
              aria-hidden="true"
              className={`block size-2.5 shrink-0 ${activeBattleState === "ACTIVE" ? "bg-err" : "bg-warn"}`}
            />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-label uppercase text-fg-muted">Ongoing battle</div>
              <div className="font-mono text-small text-fg">
                You have a battle {activeBattleState === "ACTIVE" ? "in progress" : "waiting in lobby"}.
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={handleBattleOverlayJoin}>
              {activeBattleState === "ACTIVE" ? "Rejoin battle" : "Rejoin lobby"}
            </Button>
          </div>
        </>
      )}

      {/* Toasts after the battle strip: same z-toast layer, later paint wins. */}
      <Toaster />

      {/* Scroll to top: sits above the battle strip when it is showing. */}
      {showScrollTop && (
        <IconButton
          icon={ArrowUp}
          variant="secondary"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`fixed right-4 z-raised bg-surface ${showBattleOverlay ? "bottom-[72px]" : "bottom-4"}`}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
}
