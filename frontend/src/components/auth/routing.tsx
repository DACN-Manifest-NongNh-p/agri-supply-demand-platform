import { useEffect, type ReactNode } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import {
  getRoleHomePath,
  hasRole,
  isKeycloakAuthenticated,
  loginWithKeycloak,
  logoutFromKeycloak,
  type AppRole,
} from "@/lib/keycloak";
import "./auth-routing.css";

/** Only same-app paths are allowed after login; anything else (other origins, "//host") is ignored. */
function safeReturnPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

/**
 * Landing point after Keycloak login or registration (redirect URI `/auth/callback`).
 * Goes back to the page the user wanted, otherwise to the home page for their role.
 * Keycloak finishes the code exchange during `initializeKeycloak()` in main.tsx, before this renders.
 */
export function AuthCallback() {
  const [searchParams] = useSearchParams();
  if (!isKeycloakAuthenticated()) return <Navigate to="/" replace />;
  const target = safeReturnPath(searchParams.get("returnTo")) ?? getRoleHomePath() ?? "/";
  return <Navigate to={target} replace />;
}

/** Sends anonymous visitors to Keycloak and back; shows a no-access page for the wrong role. */
export function RequireRole({ role, children }: { role: AppRole; children: ReactNode }) {
  const location = useLocation();
  const authenticated = isKeycloakAuthenticated();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    if (!authenticated) void loginWithKeycloak(returnTo).catch(console.error);
  }, [authenticated, returnTo]);

  if (!authenticated) {
    return <main className="access-page"><p className="access-muted">Redirecting to sign in…</p></main>;
  }
  if (!hasRole(role)) return <NoAccess role={role} />;
  return <>{children}</>;
}

function NoAccess({ role }: { role: AppRole }) {
  const home = getRoleHomePath();
  return (
    <main className="access-page">
      <section className="access-card" aria-labelledby="no-access-title">
        <span className="access-icon"><ShieldAlert size={22} /></span>
        <h1 id="no-access-title">This area is for {role.toLowerCase()}s</h1>
        <p className="access-muted">
          Your account doesn't have the {role} role. If you think it should, ask a Farmora administrator to update your account.
        </p>
        <div className="access-actions">
          <Link to={home ?? "/"} className="access-btn access-btn--primary">
            {home ? "Go to your dashboard" : "Back to home"}
          </Link>
          <button type="button" className="access-btn" onClick={() => void logoutFromKeycloak()}>
            Sign in with another account
          </button>
        </div>
      </section>
    </main>
  );
}
