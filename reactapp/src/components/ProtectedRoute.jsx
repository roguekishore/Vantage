import { Navigate } from "react-router-dom";
import useUserStore from "@/stores/useUserStore";

/**
 * Phase 3 — Route guard.
 * Redirects to /login if the user is not authenticated.
 * Checks for uid (any logged-in user). After re-login the JWT token
 * will be present and the backend will accept requests.
 */
export default function ProtectedRoute({ children }) {
  const user = useUserStore((s) => s.user);

  if (!user?.uid) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
