import { useState } from "react";
import { ArrowRight, UserRound, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { missingFields, useProfile, type ProfileArea } from "./profileStore";
import "./profile.css";

const DISMISS_KEY = "farmora-profile-nudge-hidden";

// "Later" hides the reminder until the browser tab is closed; it comes back on the next visit.
function wasDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function list(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Reminder under the top bar while the profile is missing details; hidden on the profile page itself. */
export function ProfileNudge({ area }: { area: ProfileArea }) {
  const profile = useProfile(area);
  const { pathname } = useLocation();
  const [hidden, setHidden] = useState(wasDismissed);
  const missing = missingFields(area, profile);

  if (hidden || missing.length === 0 || pathname.startsWith(`/${area}/profile`)) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Hidden for this page view only.
    }
  };

  return (
    <div className="pf-nudge-wrap">
      <div className="pf-nudge" role="status">
        <span className="pf-nudge-icon" aria-hidden="true">
          <UserRound size={18} />
        </span>
        <p>
          <strong>Complete your profile</strong>
          <span>Add your {list(missing)}.</span>
        </p>
        <Link to={`/${area}/profile`} className="ph-btn ph-btn--primary">
          Update profile <ArrowRight size={15} />
        </Link>
        <button type="button" className="pf-nudge-close" aria-label="Remind me later" title="Remind me later" onClick={dismiss}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
