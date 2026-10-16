import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, ExternalLink, RefreshCw, Search } from "lucide-react";
import { KEYCLOAK_CONSOLE, keycloakUserUrl, listUsers, syncUsers, type AppUser } from "./data/adminApi";

const ACCOUNT_LABEL: Record<string, string> = { BUYER: "Buyer", PRODUCER: "Producer", LOGISTICS: "Logistics provider" };

const when = (value: string | null) =>
  value ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

const fullName = (user: AppUser) => [user.firstName, user.lastName].filter(Boolean).join(" ");

/**
 * Every Farmora account, copied from Keycloak: read from its user list when the page opens (and on demand),
 * and refreshed at each sign-in. Accounts themselves are managed in Keycloak.
 */
export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState("");
  const [syncError, setSyncError] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const sync = useCallback(async () => {
    setSyncing(true);
    setSyncError("");
    try {
      const result = await syncUsers();
      setUsers(result.users);
      setSyncNote(`${result.fromKeycloak} accounts read from Keycloak at ${when(result.syncedAt)}.`);
    } catch (cause) {
      // Keycloak sync not set up or not reachable: still show what is stored.
      setSyncError(cause instanceof Error ? cause.message : "Could not read users from Keycloak.");
      try {
        setUsers(await listUsers());
      } catch (listCause) {
        setError(listCause instanceof Error ? listCause.message : "Could not load users.");
      }
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    // The work happens after an await, so this does not set state synchronously in the effect.
    const timer = window.setTimeout(() => void sync(), 0);
    return () => window.clearTimeout(timer);
  }, [sync]);

  const needle = query.trim().toLowerCase();
  const shown = (users ?? []).filter(
    (user) => !needle || [user.username, user.email, fullName(user), user.accountType, ...user.roles].some((value) => value?.toLowerCase().includes(needle)),
  );
  const visited = (users ?? []).filter((user) => user.lastSeenAt).length;

  return (
    <main className="ph-main lg-page ad-page">
      <header className="lg-head lg-head--action">
        <div>
          <h1>Users</h1>
          <p>
            {users ? `${users.length} accounts, ${visited} have opened the app. ` : ""}Copied from Keycloak; passwords and roles are changed there.
          </p>
        </div>
        <div className="ad-head-actions">
          <button type="button" className="ph-btn" onClick={() => void sync()} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? "ad-spin" : undefined} /> {syncing ? "Syncing…" : "Sync from Keycloak"}
          </button>
          <a href={KEYCLOAK_CONSOLE} target="_blank" rel="noreferrer" className="ph-btn">
            Manage in Keycloak <ExternalLink size={14} />
          </a>
        </div>
      </header>

      {error && <p className="ad-offline">{error}</p>}
      {syncError && <p className="ad-offline">Showing the stored list. {syncError}</p>}

      <section className="ph-card ad-panel">
        <div className="ad-users-bar">
          <label className="ad-search">
            <Search size={15} aria-hidden="true" />
            <input className="ad-input" type="search" value={query} placeholder="Search name, username, email or role" onChange={(event) => setQuery(event.target.value)} />
          </label>
          {syncNote && !syncError && <span className="ad-muted">{syncNote}</span>}
        </div>

        {users === null ? (
          <p className="ad-muted">{error ? "" : "Loading…"}</p>
        ) : shown.length === 0 ? (
          <p className="ad-muted">{users.length === 0 ? "No accounts yet." : "No user matches the search."}</p>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Signed up as</th>
                  <th>Roles</th>
                  <th>Registered</th>
                  <th>Last visit</th>
                  <th aria-label="Keycloak" />
                </tr>
              </thead>
              <tbody>
                {shown.map((user) => (
                  <tr key={user.id} className={user.enabled ? undefined : "is-off"}>
                    <td>
                      <strong>{fullName(user) || user.username}</strong>
                      {fullName(user) && <span className="ad-muted">{user.username}</span>}
                      {!user.enabled && <span className="ad-state ad-state--off">Disabled</span>}
                    </td>
                    <td>
                      {user.email ?? <span className="ad-muted">—</span>}
                      {user.email && user.emailVerified && <BadgeCheck size={14} className="ad-verified" aria-label="Verified" />}
                    </td>
                    <td>{user.accountType ? ACCOUNT_LABEL[user.accountType] ?? user.accountType : <span className="ad-muted">—</span>}</td>
                    <td>
                      <span className="ad-roles">
                        {user.roles.length ? user.roles.map((role) => <span key={role} className="ad-role">{role}</span>) : <span className="ad-muted">None</span>}
                      </span>
                    </td>
                    <td className="ad-muted">{when(user.registeredAt ?? user.firstSeenAt) ?? "—"}</td>
                    <td className="ad-muted">{when(user.lastSeenAt) ?? "Never"}</td>
                    <td>
                      <a href={keycloakUserUrl(user.id)} target="_blank" rel="noreferrer" className="ad-link">
                        Open
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
