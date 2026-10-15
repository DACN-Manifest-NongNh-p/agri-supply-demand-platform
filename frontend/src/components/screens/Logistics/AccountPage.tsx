import { useState, type FormEvent } from "react";
import { BadgeCheck, Check, KeyRound, Trash2, UserPlus } from "lucide-react";
import { getKeycloakUsername, isKeycloakAuthenticated, openAccountConsole } from "@/lib/keycloak";
import { PERMISSION_LABEL, ROLE_PERMISSIONS, type Permission, type ProviderProfile, type TeamRole } from "./data/mockLogistics";
import { useLogistics } from "./data/logisticsContext";

const ROLES: TeamRole[] = ["Owner", "Dispatcher", "Driver"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CompanyForm() {
  const { profile, saveProfile } = useLogistics();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const fields: { name: keyof ProviderProfile; label: string; placeholder?: string }[] = [
    { name: "legalName", label: "Registered name" },
    { name: "taxCode", label: "Tax code" },
    { name: "dispatchPhone", label: "Dispatch desk phone", placeholder: "The number Farmora coordinators call" },
    { name: "email", label: "Dispatch email" },
  ];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    if (!text("legalName") || !text("dispatchPhone") || !EMAIL.test(text("email"))) {
      setError("Registered name, dispatch phone and a valid email are required.");
      return;
    }
    saveProfile({
      ...profile,
      legalName: text("legalName"),
      taxCode: text("taxCode"),
      dispatchPhone: text("dispatchPhone"),
      email: text("email"),
      address: text("address"),
    });
    setSaved(true);
  };

  return (
    <section className="ph-card" aria-labelledby="company-title">
      <div className="ph-section-head">
        <div>
          <h2 id="company-title">Company</h2>
        </div>
        {profile.verified && (
          <span className="lg-verified" title="Business registration checked by Farmora">
            <BadgeCheck size={15} aria-hidden="true" /> Verified
          </span>
        )}
      </div>
      <form
        className="ph-declare-form lg-company"
        onSubmit={submit}
        onChange={() => {
          setSaved(false);
          setError("");
        }}
        noValidate
      >
        <div className="ph-field-row">
          {fields.slice(0, 2).map((field) => (
            <label key={field.name} className="ph-field">
              <span>{field.label}</span>
              <input name={field.name} defaultValue={String(profile[field.name])} />
            </label>
          ))}
        </div>
        <label className="ph-field">
          <span>Address</span>
          <input name="address" defaultValue={profile.address} />
        </label>
        <div className="ph-field-row">
          {fields.slice(2).map((field) => (
            <label key={field.name} className="ph-field">
              <span>{field.label}</span>
              <input name={field.name} defaultValue={String(profile[field.name])} placeholder={field.placeholder} />
            </label>
          ))}
        </div>
        {error && <p className="ph-field-error">{error}</p>}
        <div className="co-resolve-actions">
          <button type="submit" className="ph-btn ph-btn--primary">
            Save changes
          </button>
          {saved && (
            <span className="co-done">
              <Check size={14} aria-hidden="true" /> Saved
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

function SignIn() {
  const authenticated = isKeycloakAuthenticated();
  return (
    <section className="ph-card" aria-labelledby="signin-title">
      <div className="ph-section-head">
        <div>
          <h2 id="signin-title">Sign-in</h2>
        </div>
      </div>
      <dl className="lg-signin">
        <div>
          <dt>Signed in as</dt>
          <dd>{authenticated ? getKeycloakUsername() : "Demo session (not signed in)"}</dd>
        </div>
        <div>
          <dt>Account type</dt>
          <dd>Logistics provider</dd>
        </div>
      </dl>
      <div className="co-resolve-actions">
        <button type="button" className="ph-btn" disabled={!authenticated} onClick={() => void openAccountConsole()}>
          <KeyRound size={15} /> Password and two-step login
        </button>
      </div>
    </section>
  );
}

function Team() {
  const { team, inviteMember, changeRole, removeMember } = useLogistics();
  const [error, setError] = useState("");
  const owners = team.filter((member) => member.role === "Owner").length;

  const invite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    if (!name || !EMAIL.test(email)) {
      setError("Enter a name and a valid email.");
      return;
    }
    if (team.some((member) => member.email === email)) {
      setError(`${email} is already on the team.`);
      return;
    }
    inviteMember({ name, email, role: String(data.get("role")) as TeamRole });
    form.reset();
  };

  return (
    <section className="ph-card" aria-labelledby="team-title">
      <div className="ph-section-head">
        <div>
          <h2 id="team-title">Team</h2>
        </div>
      </div>

      <div className="ph-table-scroll">
        <table className="co-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>
                <span className="ph-sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {team.map((member) => {
              // The company always keeps at least one owner.
              const lastOwner = member.role === "Owner" && owners === 1;
              return (
                <tr key={member.id}>
                  <td>
                    {member.name}
                    {member.status === "invited" && <span className="lg-pill">Invited</span>}
                  </td>
                  <td className="ph-muted">{member.email}</td>
                  <td>
                    <select
                      aria-label={`Role of ${member.name}`}
                      value={member.role}
                      disabled={lastOwner}
                      onChange={(event) => changeRole(member.id, event.target.value as TeamRole)}
                    >
                      {ROLES.map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td className="co-row-actions">
                    <button
                      type="button"
                      className="ph-btn ph-btn--icon"
                      aria-label={`Remove ${member.name}`}
                      title={lastOwner ? "The company needs at least one owner" : `Remove ${member.name}`}
                      disabled={lastOwner}
                      onClick={() => removeMember(member.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form className="lg-invite" onSubmit={invite} onChange={() => setError("")} noValidate>
        <input name="name" aria-label="Name" placeholder="Name" />
        <input name="email" type="email" aria-label="Email" placeholder="Email" />
        <select name="role" aria-label="Role" defaultValue="Driver">
          {ROLES.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
        <button type="submit" className="ph-btn">
          <UserPlus size={15} /> Invite
        </button>
      </form>
      {error && <p className="ph-field-error">{error}</p>}

      <h3 className="lg-matrix-title">Role permissions</h3>
      <div className="ph-table-scroll">
        <table className="co-table lg-matrix">
          <thead>
            <tr>
              <th>Permission</th>
              {ROLES.map((role) => (
                <th key={role} className="lg-matrix-role">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(Object.keys(PERMISSION_LABEL) as Permission[]).map((permission) => (
              <tr key={permission}>
                <td>{PERMISSION_LABEL[permission]}</td>
                {ROLES.map((role) => (
                  <td key={role} className="lg-matrix-role">
                    {ROLE_PERMISSIONS[role].includes(permission) ? <Check size={15} aria-label="Allowed" /> : <span className="ph-muted" aria-label="Not allowed">–</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** The provider's company profile, its own sign-in, and who on the team can do what. */
export default function AccountPage() {
  return (
    <main className="ph-main lg-page">
      <header className="lg-head">
        <h1>Account & team</h1>
      </header>
      <div className="co-stack">
        <CompanyForm />
        <SignIn />
        <Team />
      </div>
    </main>
  );
}
