import type { Analysis, Highlight, Reason, RiskBand, RuleCategory } from "@/lib/types";
import { linkHighlights, analyseLinks } from "@/lib/links/analyse";
import { findRuleMatches, matchedCategories } from "@/lib/rules/engine";
import { spamProbability } from "@/lib/classifier/model";

/** Points added once when a category matches, regardless of how many phrases hit. */
export const RULE_POINTS: Record<RuleCategory, number> = {
  urgency: 16,
  payment: 26,
  prize: 26,
  credentials: 36,
  impersonation: 22,
};

/** The classifier can nudge the score. It cannot outvote the rules by itself. */
export const ML_MAX_POINTS = 20;

export const MEDIUM_AT = 30;
export const HIGH_AT = 60;

export function bandForScore(score: number): RiskBand {
  if (score >= HIGH_AT) return "high";
  if (score >= MEDIUM_AT) return "medium";
  return "low";
}

export function classifierPoints(probability: number): number {
  if (!Number.isFinite(probability)) return 0;
  const clamped = Math.min(1, Math.max(0, probability));
  return Math.round(clamped * ML_MAX_POINTS);
}

export function analyzeMessage(text: string): Analysis {
  const ruleMatches = findRuleMatches(text);
  const categories = matchedCategories(ruleMatches);
  const linkSignals = analyseLinks(text);
  const probability = spamProbability(text);
  const mlPoints = classifierPoints(probability);

  const reasons: Reason[] = [];
  const highlights: Highlight[] = [];

  let rulePoints = 0;
  for (const category of categories) {
    const points = RULE_POINTS[category];
    rulePoints += points;
    reasons.push({ id: `rule.${category}`, points });
  }

  for (const match of ruleMatches) {
    highlights.push({
      start: match.start,
      end: match.end,
      category: match.category,
      reasonId: `highlight.${match.category}`,
      params: { phrase: match.phrase },
    });
  }

  let linkPoints = 0;
  for (const signal of linkSignals) {
    linkPoints += signal.points;
    reasons.push({ id: signal.id, points: signal.points, params: signal.params });
  }
  highlights.push(...linkHighlights(linkSignals));

  if (mlPoints > 0) {
    reasons.push({
      id: "ml.contribution",
      points: mlPoints,
      params: { percent: String(Math.round(probability * 100)) },
    });
  }

  const rawScore = rulePoints + linkPoints + mlPoints;
  const score = Math.min(100, rawScore);
  if (rawScore > 100) {
    reasons.push({ id: "reason.capped", points: 0, params: { raw: String(rawScore) } });
  }
  if (reasons.length === 0) {
    reasons.push({ id: "reason.clean", points: 0 });
  }

  reasons.sort((a, b) => b.points - a.points || a.id.localeCompare(b.id));
  highlights.sort((a, b) => a.start - b.start || a.end - b.end || a.reasonId.localeCompare(b.reasonId));

  return {
    score,
    rawScore,
    band: bandForScore(score),
    reasons,
    highlights,
    spamProbability: probability,
    parts: { rules: rulePoints, links: linkPoints, classifier: mlPoints },
  };
}
