import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, Leaf, ShoppingBag, Sprout, Truck } from "lucide-react";
import logoImage from "@/assets/logo.png";
import "./auth.css";

const roles = [
  {
    value: "producer",
    title: "Producer / Cooperative",
    description: "Manage agricultural supply and available produce batches.",
    icon: Sprout,
  },
  {
    value: "buyer",
    title: "Buyer / Business",
    description: "Create demand and find suitable agricultural supply.",
    icon: ShoppingBag,
  },
  {
    value: "logistics",
    title: "Logistics Provider",
    description: "Manage transportation capacity and delivery requests.",
    icon: Truck,
  },
];

function AuthShell({ children }: { children: React.ReactNode }) {
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

type SignUpErrors = Partial<Record<"name" | "email" | "password" | "confirmPassword" | "role", string>>;

export function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: SignUpErrors = {};
    if (!name.trim()) nextErrors.name = "Enter your full name.";
    if (!email.trim()) nextErrors.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Create a password.";
    else if (password.length < 8) nextErrors.password = "Use at least 8 characters.";
    if (!confirmPassword) nextErrors.confirmPassword = "Confirm your password.";
    else if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    if (!role) nextErrors.role = "Choose the role that best describes you.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    window.setTimeout(() => navigate("/login", { state: { registered: true } }), 700);
  }

  return (
    <AuthShell>
      <div className="auth-heading">
        <span className="auth-step">YOUR FARMORA ACCOUNT</span>
        <h1>Create your account</h1>
        <p>Set up your login now. You can complete your profile after registration.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="full-name">Full Name <span>*</span></label>
          <input id="full-name" required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />
          {errors.name && <p className="auth-error" id="name-error">{errors.name}</p>}
        </div>
        <div className="auth-field">
          <label htmlFor="email">Email <span>*</span></label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />
          {errors.email && <p className="auth-error" id="email-error">{errors.email}</p>}
        </div>
        <div className="auth-field">
          <label htmlFor="password">Password <span>*</span></label>
          <div className="auth-password-wrap">
            <input id="password" type={showPassword ? "text" : "password"} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : undefined} />
            <button type="button" className="auth-visibility" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="auth-error" id="password-error">{errors.password}</p>}
        </div>
        <div className="auth-field">
          <label htmlFor="confirm-password">Confirm Password <span>*</span></label>
          <div className="auth-password-wrap">
            <input id="confirm-password" type={showConfirmPassword ? "text" : "password"} required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined} />
            <button type="button" className="auth-visibility" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="auth-error" id="confirm-password-error">{errors.confirmPassword}</p>}
        </div>

        <fieldset className="role-fieldset" aria-describedby={errors.role ? "role-error" : undefined}>
          <legend>Choose your role <span>*</span></legend>
          <div className="role-options">
            {roles.map((option) => (
              <label className={`role-option${role === option.value ? " role-option--selected" : ""}`} key={option.value}>
                <input type="radio" name="role" value={option.value} required checked={role === option.value} onChange={() => setRole(option.value)} />
                <span className="role-icon" aria-hidden="true"><option.icon size={22} strokeWidth={1.8} /></span>
                {role === option.value && <Check className="role-check" size={21} aria-hidden="true" />}
                <span className="role-copy"><strong>{option.title}</strong><span>{option.description}</span></span>
              </label>
            ))}
          </div>
          {errors.role && <p className="auth-error" id="role-error">{errors.role}</p>}
        </fieldset>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? <><span className="auth-spinner" aria-hidden="true" /> Creating account...</> : "Create Account"}
        </button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthShell>
  );
}

export function LoginPage() {
  const location = useLocation();
  const registered = Boolean((location.state as { registered?: boolean } | null)?.registered);

  return (
    <AuthShell>
      <div className="auth-heading">
        <span className="auth-step">WELCOME BACK</span>
        <h1>Log in to Farmora</h1>
        <p>Access your Farmora account and continue coordinating.</p>
      </div>
      {registered && <p className="auth-success" role="status">Account details received. You can now log in.</p>}
      <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
        <div className="auth-field">
          <label htmlFor="login-email">Email <span>*</span></label>
          <input id="login-email" type="email" autoComplete="email" />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Password <span>*</span></label>
          <input id="login-password" type="password" autoComplete="current-password" />
        </div>
        <button className="auth-submit" type="submit">Log in</button>
      </form>
      <p className="auth-switch">New to Farmora? <Link to="/signup">Create an account</Link></p>
    </AuthShell>
  );
}