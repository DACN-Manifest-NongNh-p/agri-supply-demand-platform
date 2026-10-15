import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { formatKg } from "../Producer/data/format";
import { REQUEST_KIND_LABEL, type HelpRequest, type RequestAction } from "./data/mockCoordinator";
import { useCoordinator } from "./data/coordinatorContext";

type Filter = "open" | "resolved";

function ago(hours: number) {
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/** Button label and the note sent back when the coordinator takes the request's one-click action. */
function actionText(action: RequestAction) {
  return action.kind === "verify"
    ? { label: `Verify ${action.producer}`, note: "Business registration checked. Buyers now see you as verified." }
    : { label: `Accept ${formatKg(action.kg)} less`, note: `Allocation reduced by ${formatKg(action.kg)}; Farmora is matching the missing quantity from another batch.` };
}

function RequestItem({ request }: { request: HelpRequest }) {
  const { resolved, resolve, verifyProducer, recordShortfall } = useCoordinator();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const resolution = resolved[request.id];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const note = String(new FormData(event.currentTarget).get("note") ?? "").trim();
    if (!note) {
      setError("Write what was done, so the producer or buyer knows.");
      return;
    }
    resolve(request.id, note);
    setOpen(false);
  };

  const quick = request.action && actionText(request.action);
  const takeAction = () => {
    const action = request.action!;
    if (action.kind === "verify") verifyProducer(action.producer);
    else recordShortfall(action.allocationId, action.kg);
    resolve(request.id, quick!.note);
  };

  return (
    <li id={request.id} className={request.urgent && !resolution ? "co-request co-request--urgent" : "co-request"}>
      <div className="co-request-head">
        <span className="co-request-kind">{REQUEST_KIND_LABEL[request.kind]}</span>
        {request.urgent && !resolution && <span className="co-request-urgent">Urgent</span>}
        <span className="ph-muted co-push-right">
          {request.id} · {ago(request.openedHoursAgo)}
        </span>
      </div>
      <p className="co-request-subject">{request.subject}</p>
      <p className="co-request-from">
        {request.from} <span className="ph-muted">· {request.fromRole.toLowerCase()}</span>
      </p>
      <p className="co-request-detail">{request.detail}</p>

      {resolution ? (
        <p className="co-done">
          <Check size={14} aria-hidden="true" /> Resolved: {resolution.note}
        </p>
      ) : open ? (
        <form className="co-resolve" onSubmit={submit} noValidate>
          <label htmlFor={`note-${request.id}`}>What did you do?</label>
          <textarea
            id={`note-${request.id}`}
            name="note"
            rows={2}
            placeholder="For example: called SouthLine, replacement truck leaves at 15:00; told Mekong Export the new ETA."
            aria-invalid={error ? true : undefined}
            onChange={() => setError("")}
          />
          {error && <p className="ph-field-error">{error}</p>}
          <div className="co-resolve-actions">
            <button type="submit" className="ph-btn ph-btn--primary">Mark resolved</button>
            <button type="button" className="ph-btn" onClick={() => setOpen(false)}>Cancel</button>
            <span className="ph-muted">The note is sent to {request.from}.</span>
          </div>
        </form>
      ) : (
        <div className="co-resolve-actions">
          {quick && (
            <button type="button" className="ph-btn ph-btn--primary" onClick={takeAction}>
              {quick.label}
            </button>
          )}
          <button type="button" className="ph-btn" onClick={() => setOpen(true)}>
            {quick ? "Resolve another way" : "Resolve"}
          </button>
          {request.link && (
            <Link to={request.link.to} className="ph-link-btn">
              {request.link.label} <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

/** Problems and questions producers, buyers and carriers sent to the coordinator. */
export default function RequestsPage() {
  const { requests, resolved } = useCoordinator();
  const [filter, setFilter] = useState<Filter>("open");

  const sorted = [...requests].sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.openedHoursAgo - b.openedHoursAgo);
  const openList = sorted.filter((request) => !resolved[request.id]);
  const doneList = sorted.filter((request) => resolved[request.id]);
  const visible = filter === "open" ? openList : doneList;

  return (
    <main className="ph-main co-narrow">
      <Link to="/coordinator" className="ph-back">
        <ArrowLeft size={16} /> Back to overview
      </Link>

      <section className="ph-page-head">
        <div>
          <p className="ph-eyebrow">Support</p>
          <h1>Requests</h1>
          <p className="ph-hello-summary">
            What producers, buyers and carriers asked you to handle. Producers and buyers never call drivers; problems on the road come here.
          </p>
        </div>
      </section>

      <div className="ph-cal-toolbar co-toolbar">
        <div className="ph-segmented" role="group" aria-label="Show">
          <button type="button" aria-pressed={filter === "open"} onClick={() => setFilter("open")}>
            Open <span className="ph-count-badge">{openList.length}</span>
          </button>
          <button type="button" aria-pressed={filter === "resolved"} onClick={() => setFilter("resolved")}>
            Resolved <span className="ph-count-badge">{doneList.length}</span>
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="ph-empty">{filter === "open" ? "No open requests." : "Nothing resolved yet."}</p>
      ) : (
        <ul className="ph-card co-requests">
          {visible.map((request) => (
            <RequestItem key={request.id} request={request} />
          ))}
        </ul>
      )}
    </main>
  );
}
