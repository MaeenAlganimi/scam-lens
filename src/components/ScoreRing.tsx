import type { RiskBand } from "@/lib/types";

export function ScoreRing({ score, band }: { score: number; band: RiskBand }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, score));
  const offset = circumference - (clamped / 100) * circumference;
  const complete = clamped >= 100;

  return (
    <div className="score-ring" data-band={band}>
      <svg viewBox="0 0 128 128" aria-hidden="true">
        <circle className="score-ring-track" cx="64" cy="64" r={radius} />
        {clamped > 0 ? (
          <circle
            className="score-ring-value"
            cx="64"
            cy="64"
            r={radius}
            strokeDasharray={complete ? undefined : circumference}
            strokeDashoffset={complete ? 0 : offset}
          />
        ) : null}
      </svg>
      <p className="score-ring-number" data-testid="risk-score">
        {score}
      </p>
    </div>
  );
}
