import { useState } from "react";
import { ArrowRight, CircleCheck, Clock, Sprout, TriangleAlert, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Task } from "../data/mockProducer";
import { formatKg, stageLabel } from "../data/format";

export type TaskOutcome = "done" | "declined";

type Props = {
  tasks: Task[];
  outcomes: Record<string, TaskOutcome>;
  onResolve: (task: Task, outcome: TaskOutcome) => void;
};

// Buyer matches live in the matching section, so attention cards cover work items only.
type Tone = "urgent" | "warning" | "info";

type Card = {
  tone: Tone;
  Icon: LucideIcon;
  label: string;
  chip?: string;
  /** The big number or code the card is about. */
  figure: string;
  caption: string;
  primary: { label: string; run: () => void };
  secondary?: { label: string; run: () => void };
};

const PREVIEW_COUNT = 3;
const TONE_ORDER: Record<Tone, number> = { urgent: 0, warning: 1, info: 2 };

export function AttentionList({ tasks, outcomes, onResolve }: Props) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const toCard = (task: Task): Card => {
    const resolve = (outcome: TaskOutcome) => () => onResolve(task, outcome);
    switch (task.kind) {
      case "confirm_allocation":
        return {
          tone: "urgent",
          Icon: TriangleAlert,
          label: "Confirm",
          chip: `Due in ${task.dueInHours}h`,
          figure: formatKg(task.quantityKg),
          caption: `${task.batch} for ${task.buyer}`,
          primary: { label: "Confirm", run: resolve("done") },
          secondary: { label: "Decline", run: resolve("declined") },
        };
      case "hold_expiring":
        return {
          tone: "warning",
          Icon: Clock,
          label: "Expiring soon",
          figure: `${task.dueInHours}h left`,
          caption: `on the hold for ${task.batch} by ${task.buyer}`,
          primary: { label: "Review", run: () => navigate(`/producer/batches?batch=${task.batch}`) },
        };
      case "update_status":
        return {
          tone: "info",
          Icon: Sprout,
          label: "Update status",
          figure: task.batch,
          caption: `Still “${stageLabel(task.from)}”. Is it ${stageLabel(task.to).toLowerCase()} yet?`,
          primary: { label: `Mark ${stageLabel(task.to).toLowerCase()}`, run: resolve("done") },
          secondary: { label: "Not yet", run: resolve("declined") },
        };
    }
  };

  // Most urgent first. Resolved cards keep their place so the "Done" feedback stays where the user clicked.
  const cards = tasks
    .map((task) => ({ task, card: toCard(task), outcome: outcomes[task.id] }))
    .sort((a, b) => TONE_ORDER[a.card.tone] - TONE_ORDER[b.card.tone]);
  const open = cards.filter((item) => !item.outcome).length;
  const shown = showAll ? cards : cards.slice(0, PREVIEW_COUNT);

  return (
    <section id="attention" className="ph-attention" aria-labelledby="attention-title">
      <div className="ph-section-head">
        <div>
          <h2 id="attention-title">Needs your attention</h2>
          <p className="ph-section-sub">{open === 0 ? "All clear for now." : `${open} open, most urgent first.`}</p>
        </div>
        {cards.length > PREVIEW_COUNT && (
          <button type="button" className="ph-link-btn" onClick={() => setShowAll((value) => !value)} aria-expanded={showAll}>
            {showAll ? "Show less" : `View all (${cards.length})`} <ArrowRight size={16} className={showAll ? "ph-rotate-up" : undefined} />
          </button>
        )}
      </div>

      <ul className="ph-priority-cards">
        {shown.map(({ task, card, outcome }) => (
          <li key={task.id} className={`ph-priority ph-priority--${card.tone}${outcome ? " ph-priority--resolved" : ""}`}>
            <card.Icon className="ph-priority-watermark" size={96} strokeWidth={1.5} aria-hidden="true" />

            <div className="ph-priority-top">
              <span className="ph-priority-label">
                <card.Icon size={14} strokeWidth={2.25} aria-hidden="true" /> {card.label}
              </span>
              {card.chip && !outcome && <span className="ph-priority-chip">{card.chip}</span>}
            </div>

            <p className="ph-priority-figure">{card.figure}</p>
            <p className="ph-priority-caption">{card.caption}</p>

            <div className="ph-priority-actions">
              {outcome ? (
                <span className="ph-priority-done">
                  <CircleCheck size={16} /> {outcome === "done" ? "Done" : "Dismissed"}
                </span>
              ) : (
                <>
                  <button type="button" className="ph-priority-btn" onClick={card.primary.run}>
                    {card.primary.label}
                  </button>
                  {card.secondary && (
                    <button type="button" className="ph-text-btn" onClick={card.secondary.run}>
                      {card.secondary.label}
                    </button>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
