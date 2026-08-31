import { Reveal, Eyebrow } from "./Reveal";
import { cn } from "@/lib/utils";
import "../styles/TimeAware.css";

const batches = [
  {
    name: "Batch A",
    qty: "5,000 kg",
    harvested: "Today",
    shelf: "7 days",
    priority: "Low",
    bar: 100,
  },
  {
    name: "Batch B",
    qty: "4,000 kg",
    harvested: "3 days ago",
    shelf: "4 days",
    priority: "Medium",
    bar: 57,
  },
  {
    name: "Batch C",
    qty: "6,000 kg",
    harvested: "6 days ago",
    shelf: "1 day",
    priority: "High",
    bar: 14,
  },
];

const priorityStyle: Record<string, string> = {
  Low: "priority-low",
  Medium: "priority-medium",
  High: "priority-high",
};

export function TimeAware() {
  return (
    <section id="time-aware" className="time-aware-section">
      <div className="time-aware-container">
        <div className="time-aware-grid">

          <Reveal className="time-aware-copy">
            <Eyebrow>Time-aware intelligence</Eyebrow>

            <h2 className="time-aware-title">
              Freshness changes
              <br />
              the priority.
            </h2>

            <p className="time-aware-intro">
              The same product and quantity can have very different urgency.
              Farmora considers harvest date, remaining shelf life and
              transportation time to determine which batches need attention
              first.
            </p>

            <div className="time-aware-note">
              <span className="note-marker" />
              <span>Shorter shelf life → higher coordination priority</span>
            </div>
          </Reveal>

          <Reveal delay={100} className="priority-board">

            <div className="priority-board-top">
              <span>Batch priority</span>
              <span>3 active batches</span>
            </div>

            <div className="priority-header">
              <span>Batch</span>
              <span>Harvested</span>
              <span>Remaining shelf life</span>
              <span>Priority</span>
            </div>

            <div className="priority-rows">
              {batches.map((b) => (
                <div
                  key={b.name}
                  className={cn(
                    "priority-row",
                    b.priority === "High" && "priority-row-high"
                  )}
                >
                  <div className="batch-info">
                    <strong>{b.name}</strong>
                    <span>{b.qty}</span>
                  </div>

                  <span className="batch-harvested">
                    {b.harvested}
                  </span>

                  <div className="shelf-life">
                    <div className="shelf-life-value">
                      {b.shelf}
                    </div>

                    <div className="shelf-track">
                      <div
                        className={cn(
                          "shelf-fill",
                          b.priority === "High"
                            ? "shelf-fill-high"
                            : "shelf-fill-normal"
                        )}
                        style={{ width: `${b.bar}%` }}
                      />
                    </div>
                  </div>

                  <span
                    className={cn(
                      "priority-badge",
                      priorityStyle[b.priority]
                    )}
                  >
                    {b.priority}
                  </span>
                </div>
              ))}
            </div>

            <div className="priority-footer">
              <span className="footer-line" />
              <span>
                Batch C is prioritized because only 1 day of shelf life remains.
              </span>
            </div>

          </Reveal>
        </div>
      </div>
    </section>
  );
}