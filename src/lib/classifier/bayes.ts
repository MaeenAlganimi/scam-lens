import type { Label, Locale } from "@/lib/types";
import { uniqueTokens } from "@/lib/text";

export const ALPHA = 1;
export const GLOBAL_FEATURE_LIMIT = 1500;
export const LANGUAGE_FEATURE_LIMIT = 150;
export const DECISION_THRESHOLD = 0.5;

export interface TrainingRow {
  id: string;
  label: Label;
  text: string;
  language: Locale;
}

export interface BayesModel {
  version: 1;
  alpha: number;
  vocabulary: string[];
  hamCounts: number[];
  spamCounts: number[];
  hamDocs: number;
  spamDocs: number;
  hamTokenDocs: number;
  spamTokenDocs: number;
  selection: string;
}

interface ClassCounts {
  spam: number;
  ham: number;
}

function documentFrequencies(rows: readonly TrainingRow[]): Map<string, ClassCounts> {
  const stats = new Map<string, ClassCounts>();
  for (const row of rows) {
    for (const token of uniqueTokens(row.text)) {
      const current = stats.get(token) ?? { spam: 0, ham: 0 };
      current[row.label] += 1;
      stats.set(token, current);
    }
  }
  return stats;
}

function chiSquare(
  spamWith: number,
  hamWith: number,
  spamDocs: number,
  hamDocs: number,
  total: number,
): number {
  const spamWithout = spamDocs - spamWith;
  const hamWithout = hamDocs - hamWith;
  const denominator =
    (spamWith + hamWith) * (spamWithout + hamWithout) * (spamWith + spamWithout) * (hamWith + hamWithout);
  if (denominator === 0) return 0;
  const numerator = total * (spamWith * hamWithout - hamWith * spamWithout) ** 2;
  return numerator / denominator;
}

function topTokens(rows: readonly TrainingRow[], limit: number): string[] {
  if (rows.length === 0 || limit <= 0) return [];
  const stats = documentFrequencies(rows);
  const spamDocs = rows.filter((row) => row.label === "spam").length;
  const hamDocs = rows.length - spamDocs;
  const ranked: { token: string; score: number }[] = [];
  for (const [token, counts] of stats) {
    if (counts.spam + counts.ham < 2) continue;
    const raw = chiSquare(counts.spam, counts.ham, spamDocs, hamDocs, rows.length);
    ranked.push({ token, score: Math.round(raw * 1e6) / 1e6 });
  }
  ranked.sort((a, b) => b.score - a.score || a.token.localeCompare(b.token));
  return ranked.slice(0, limit).map((entry) => entry.token);
}

/**
 * Keep the global chi-square leaders, then add a quota for Arabic and
 * Spanish. The public SMS set is English and much larger, so a single
 * top-k list would drop the other languages.
 */
export function selectVocabulary(rows: readonly TrainingRow[]): string[] {
  const selected = new Set(topTokens(rows, GLOBAL_FEATURE_LIMIT));
  for (const language of ["ar", "es"] as const) {
    const subset = rows.filter((row) => row.language === language);
    for (const token of topTokens(subset, LANGUAGE_FEATURE_LIMIT)) selected.add(token);
  }
  return [...selected].sort((a, b) => a.localeCompare(b));
}

export function trainModel(rows: readonly TrainingRow[]): BayesModel {
  const hamDocs = rows.filter((row) => row.label === "ham").length;
  const spamDocs = rows.length - hamDocs;
  if (hamDocs === 0 || spamDocs === 0) {
    throw new Error("Training needs both ham and spam messages.");
  }

  const vocabulary = selectVocabulary(rows);
  const index = new Map(vocabulary.map((token, position) => [token, position]));
  const hamCounts = new Array<number>(vocabulary.length).fill(0);
  const spamCounts = new Array<number>(vocabulary.length).fill(0);

  for (const row of rows) {
    const counts = row.label === "spam" ? spamCounts : hamCounts;
    for (const token of uniqueTokens(row.text)) {
      const position = index.get(token);
      if (position !== undefined) counts[position] += 1;
    }
  }

  const hamTokenDocs = hamCounts.reduce((sum, count) => sum + count, 0);
  const spamTokenDocs = spamCounts.reduce((sum, count) => sum + count, 0);

  return {
    version: 1,
    alpha: ALPHA,
    vocabulary,
    hamCounts,
    spamCounts,
    hamDocs,
    spamDocs,
    hamTokenDocs,
    spamTokenDocs,
    selection: `chi-square global top ${GLOBAL_FEATURE_LIMIT}, plus top ${LANGUAGE_FEATURE_LIMIT} Arabic and Spanish tokens`,
  };
}

function logSumExpProb(logSpam: number, logHam: number): number {
  const max = Math.max(logSpam, logHam);
  const spam = Math.exp(logSpam - max);
  const ham = Math.exp(logHam - max);
  const total = spam + ham;
  if (total === 0) return 0.5;
  return spam / total;
}

/**
 * Boolean multinomial naive Bayes.
 * A word votes once per message. The stored count is how many training
 * messages of that class contained the word. Laplace smoothing (add 1)
 * keeps unseen words from zeroing a class.
 */
const vocabularyIndexes = new WeakMap<BayesModel, Map<string, number>>();

function vocabularyIndex(model: BayesModel): Map<string, number> {
  const cached = vocabularyIndexes.get(model);
  if (cached) return cached;
  const index = new Map(model.vocabulary.map((token, position) => [token, position]));
  vocabularyIndexes.set(model, index);
  return index;
}

export function predictSpamProbability(text: string, model: BayesModel): number {
  const totalDocs = model.hamDocs + model.spamDocs;
  const prior = totalDocs === 0 ? 0.5 : model.spamDocs / totalDocs;
  if (model.vocabulary.length === 0) return prior;

  const index = vocabularyIndex(model);
  const known = uniqueTokens(text).filter((token) => index.has(token));
  if (known.length === 0) return prior;

  const hamDenom = model.hamTokenDocs + model.alpha * model.vocabulary.length;
  const spamDenom = model.spamTokenDocs + model.alpha * model.vocabulary.length;
  let logSpam = Math.log(model.spamDocs / totalDocs);
  let logHam = Math.log(model.hamDocs / totalDocs);

  for (const token of known) {
    const position = index.get(token);
    if (position === undefined) continue;
    logSpam += Math.log((model.spamCounts[position] + model.alpha) / spamDenom);
    logHam += Math.log((model.hamCounts[position] + model.alpha) / hamDenom);
  }

  return logSumExpProb(logSpam, logHam);
}

export interface BinaryMetrics {
  count: number;
  spam: number;
  ham: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
  threshold: number;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function evaluateModel(rows: readonly TrainingRow[], model: BayesModel): BinaryMetrics {
  let truePositive = 0;
  let falsePositive = 0;
  let trueNegative = 0;
  let falseNegative = 0;

  for (const row of rows) {
    const predictedSpam = predictSpamProbability(row.text, model) >= DECISION_THRESHOLD;
    const actualSpam = row.label === "spam";
    if (predictedSpam && actualSpam) truePositive += 1;
    else if (predictedSpam && !actualSpam) falsePositive += 1;
    else if (!predictedSpam && !actualSpam) trueNegative += 1;
    else falseNegative += 1;
  }

  const count = rows.length;
  const predictedPositive = truePositive + falsePositive;
  const actualPositive = truePositive + falseNegative;
  const precision = predictedPositive === 0 ? 0 : truePositive / predictedPositive;
  const recall = actualPositive === 0 ? 0 : truePositive / actualPositive;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const accuracy = count === 0 ? 0 : (truePositive + trueNegative) / count;
  const spam = rows.filter((row) => row.label === "spam").length;

  return {
    count,
    spam,
    ham: count - spam,
    accuracy: round4(accuracy),
    precision: round4(precision),
    recall: round4(recall),
    f1: round4(f1),
    truePositive,
    falsePositive,
    trueNegative,
    falseNegative,
    threshold: DECISION_THRESHOLD,
  };
}
