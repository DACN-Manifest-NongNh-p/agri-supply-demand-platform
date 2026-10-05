import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import logoImage from "@/assets/logo.png";
import { loginWithKeycloak, registerWithKeycloak } from "@/lib/keycloak";
import "./auth.css";

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-shell" aria-label="Farmora account access">
        <div className="auth-visual">
          <Link to="/" className="auth-brand" aria-label="Farmora home">
            <img src={logoImage} alt="" />
            <span>Farmora</span>
          </Link>
          <div className="auth-visual-copy">
            <span className="auth-kicker"><Leaf size={15} /> GROW TOGETHER</span>
            <h2>Good things grow when we work together.</h2>
            <p>One place to bring agricultural supply, demand, and delivery into sync.</p>
          </div>
          <span className="auth-visual-caption">Supply · Demand · Coordination</span>
        </div>
        <div className="auth-content">{children}</div>
      </section>
      <p className="auth-footer">© {new Date().getFullYear()} Farmora</p>
    </main>
  );
}

function AuthRedirectPage({ registration }: { registration: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    setLoading(true);
    setError("");
    try {
      await (registration ? registerWithKeycloak() : loginWithKeycloak());
    } catch {
      setError("Keycloak is unavailable. Start the local services and try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-heading">
        <span className="auth-step">YOUR FARMORA ACCOUNT</span>
        <h1>{registration ? "Create your account" : "Log in to Farmora"}</h1>
        <p>{registration ? "Create your secure Farmora account to get started." : "Access your Farmora account and continue coordinating."}</p>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="button" onClick={() => void handleContinue()} disabled={loading}>
        {loading ? <><span className="auth-spinner" aria-hidden="true" /> Redirecting...</> : registration ? "Continue to registration" : "Continue to login"}
        </button>
      <p className="auth-switch">
        {registration ? "Already have an account? " : "New to Farmora? "}
        <Link to={registration ? "/login" : "/signup"}>{registration ? "Log in" : "Create an account"}</Link>
      </p>
    </AuthShell>
  );
}

export function SignUpPage() {
  return <AuthRedirectPage registration />;
}

export function LoginPage() {
  return <AuthRedirectPage registration={false} />;
}