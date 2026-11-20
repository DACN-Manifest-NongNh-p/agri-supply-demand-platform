// Progress as a row of dots with the name of the current step: replaces a sentence and a status pill.
export function MiniSteps({ steps, current, tone = "normal" }: { steps: string[]; current: number; tone?: "normal" | "attention" | "stopped" | "done" }) {
  const label = tone === "stopped" ? "Stopped" : steps[Math.min(current, steps.length - 1)];
  return (
    <span className={`ms ms--${tone}`} aria-label={`${label}, step ${Math.min(current + 1, steps.length)} of ${steps.length}`}>
      <span className="ms-dots" aria-hidden="true">
        {steps.map((step, index) => (
          <i key={step} className={index < current ? "is-done" : index === current ? "is-now" : undefined} title={step} />
        ))}
      </span>
      <span className="ms-label">{label}</span>
    </span>
  );
}
