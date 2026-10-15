import { useEffect, type ReactNode } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, Lock, LogOut } from "lucide-react";
import logoImage from "@/assets/logo.png";
import {
  getKeycloakUsername,
  getRoleHome,
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

const AUDIENCE: Record<AppRole, string> = {
  BUYER: "buyers",
  PRODUCER: "producers",
  LOGISTICS: "logistics providers",
  COORDINATOR: "coordinators",
  ADMIN: "administrators",
};

/** How a role is named in a sentence ("a buyer account"). */
const ACCOUNT: Record<AppRole, string> = {
  BUYER: "Buyer",
  PRODUCER: "Producer",
  LOGISTICS: "Logistics provider",
  COORDINATOR: "Coordinator",
  ADMIN: "Administrator",
};

function NoAccess({ role }: { role: AppRole }) {
  const home = getRoleHome();
  const username = getKeycloakUsername();

  return (
    <main className="access-page">
      <section className="access-card" aria-labelledby="no-access-title">
        <div className="access-visual" aria-hidden="true">
          <span className="access-brand">
            <img src={logoImage} alt="" />
            Farmora
          </span>
          <p>Fresh produce, matched from farm to dock.</p>
        </div>

        <div className="access-body">
          <span className="access-tag">
            <Lock size={13} aria-hidden="true" /> {ACCOUNT[role]} area
          </span>
          <h1 id="no-access-title">This area is for {AUDIENCE[role]}</h1>

          <div className="access-account">
            <span className="access-avatar" aria-hidden="true">
              {(username || "?").charAt(0).toUpperCase()}
            </span>
            <span>
              <strong>{username || "Signed in"}</strong>
              <small>{home ? `${ACCOUNT[home.role]} account` : "No role with its own area yet"}</small>
            </span>
          </div>

          <p className="access-muted">
            {home
              ? `Your account opens the ${ACCOUNT[home.role].toLowerCase()} pages. To use ${AUDIENCE[role]} pages, sign in with a ${ACCOUNT[role].toLowerCase()} account.`
              : `To use ${AUDIENCE[role]} pages, sign in with a ${ACCOUNT[role].toLowerCase()} account.`}
          </p>

          <div className="access-actions">
            <Link to={home?.path ?? "/"} className="access-btn access-btn--primary">
              {home ? `Go to ${ACCOUNT[home.role]} dashboard` : "Back to home"}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <button type="button" className="access-btn" onClick={() => void logoutFromKeycloak()}>
              <LogOut size={15} aria-hidden="true" /> Switch account
            </button>
          </div>

          <p className="access-foot">
            Should your account have this role? Ask a Farmora administrator.
            {home && (
              <>
                {" "}
                <Link to="/">Farmora home</Link>
              </>
            )}
          </p>
        </div>
      </section>
    </main>
  );
}
