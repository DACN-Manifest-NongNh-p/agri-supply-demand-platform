function level(score: number) {
  return score >= 85 ? "high" : score >= 65 ? "medium" : "low";
}

export function MatchScore({ score }: { score: number }) {
  return <span className={`ph-match-score ph-match-score--${level(score)}`}>{score}% match</span>;
}

/** Circular score used where a match is the focus of the page. */
export function ScoreRing({ score, size = 88 }: { score: number; size?: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className={`ph-ring ph-ring--${level(score)}`} style={{ width: size, height: size }} role="img" aria-label={`${score}% match`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ph-ring-track" cx="50" cy="50" r={radius} />
        <circle
          className="ph-ring-value"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
        />
      </svg>
      <span className="ph-ring-label">
        <strong>{score}%</strong>
        <small>match</small>
      </span>
    </div>
  );
}
