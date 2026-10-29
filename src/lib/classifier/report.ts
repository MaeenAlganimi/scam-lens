import type { Label, Locale } from "@/lib/types";
import {
  evaluateModel,
  trainModel,
  type BayesModel,
  type BinaryMetrics,
  type TrainingRow,
} from "@/lib/classifier/bayes";

export const SPLIT_SEED = 42;
export const TEST_RATIO = 0.2;

export interface EvaluationReport {
  seed: number;
  testRatio: number;
  positiveClass: "spam";
  threshold: 0.5;
  notes: string[];
  uci: {
    rawLines: number;
    uniqueMessages: number;
    duplicateLinesRemoved: number;
    train: ClassCount;
    test: ClassCount;
  };
  handwritten: {
    train: ClassCount;
    test: ClassCount;
  };
  vocabularySize: number;
  selection: string;
  uciOnlyBaseline: {
    description: string;
    vocabularySize: number;
    holdout: BinaryMetrics;
  };
  shippedModel: {
    description: string;
    uciHoldout: BinaryMetrics;
    handwrittenHoldout: BinaryMetrics;
    handwrittenHoldoutByLanguage: Record<Locale, BinaryMetrics>;
  };
}

interface ClassCount {
  total: number;
  ham: number;
  spam: number;
}

export interface Split {
  train: TrainingRow[];
  test: TrainingRow[];
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const copy = items.slice();
  const random = mulberry32(seed);
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swap] as T;
    copy[swap] = current as T;
  }
  return copy;
}

function mixSeed(seed: number, key: string): number {
  let hash = seed >>> 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = Math.imul(hash ^ key.charCodeAt(index), 0x5bd1e995);
    hash ^= hash >>> 15;
  }
  return hash >>> 0;
}

export function stratifiedSplit(rows: readonly TrainingRow[], seed = SPLIT_SEED): Split {
  const groups = new Map<string, TrainingRow[]>();
  for (const row of rows) {
    const key = `${row.language}:${row.label}`;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  const train: TrainingRow[] = [];
  const test: TrainingRow[] = [];
  for (const key of [...groups.keys()].sort()) {
    const group = (groups.get(key) ?? []).slice().sort((a, b) => a.id.localeCompare(b.id));
    const shuffled = seededShuffle(group, mixSeed(seed, key));
    const testCount = Math.round(shuffled.length * TEST_RATIO);
    if (testCount < 1 || shuffled.length - testCount < 1) {
      train.push(...shuffled);
      continue;
    }
    test.push(...shuffled.slice(0, testCount));
    train.push(...shuffled.slice(testCount));
  }
  return { train, test };
}

function counts(rows: readonly TrainingRow[]): ClassCount {
  const spam = rows.filter((row) => row.label === "spam").length;
  return { total: rows.length, ham: rows.length - spam, spam };
}

function byLanguage(rows: readonly TrainingRow[], model: BayesModel): Record<Locale, BinaryMetrics> {
  return {
    en: evaluateModel(rows.filter((row) => row.language === "en"), model),
    ar: evaluateModel(rows.filter((row) => row.language === "ar"), model),
    es: evaluateModel(rows.filter((row) => row.language === "es"), model),
  };
}

export function buildReport(
  uci: readonly TrainingRow[],
  handwritten: readonly TrainingRow[],
  meta: { rawLines: number; uniqueMessages: number },
): { model: BayesModel; report: EvaluationReport } {
  const uciSplit = stratifiedSplit(uci);
  const handwrittenSplit = stratifiedSplit(handwritten);

  const baseline = trainModel(uciSplit.train);
  const shippedTrain = [...uciSplit.train, ...handwrittenSplit.train];
  const model = trainModel(shippedTrain);

  const report: EvaluationReport = {
    seed: SPLIT_SEED,
    testRatio: TEST_RATIO,
    positiveClass: "spam",
    threshold: 0.5,
    notes: [
      "Exact duplicate texts in the SMS Spam Collection were removed before the split so a message cannot sit in both train and test.",
      "The split is stratified by language and label with seed 42. About 20% of each group is held out.",
      "The shipped model is trained on the UCI training split plus the handwritten training split. Holdout rows are never used for training or feature selection.",
      "Spam is the positive class. A message is predicted spam when P(spam) is at least 0.5.",
      "The handwritten holdout is small, especially once it is broken out by language. Those rates are noisy.",
    ],
    uci: {
      rawLines: meta.rawLines,
      uniqueMessages: meta.uniqueMessages,
      duplicateLinesRemoved: meta.rawLines - meta.uniqueMessages,
      train: counts(uciSplit.train),
      test: counts(uciSplit.test),
    },
    handwritten: {
      train: counts(handwrittenSplit.train),
      test: counts(handwrittenSplit.test),
    },
    vocabularySize: model.vocabulary.length,
    selection: model.selection,
    uciOnlyBaseline: {
      description: "Trained only on the UCI training split and scored on the UCI holdout.",
      vocabularySize: baseline.vocabulary.length,
      holdout: evaluateModel(uciSplit.test, baseline),
    },
    shippedModel: {
      description:
        "Trained on the UCI training split plus the handwritten training split. This is the model in the app.",
      uciHoldout: evaluateModel(uciSplit.test, model),
      handwrittenHoldout: evaluateModel(handwrittenSplit.test, model),
      handwrittenHoldoutByLanguage: byLanguage(handwrittenSplit.test, model),
    },
  };

  return { model, report };
}

export function isLabel(value: string): value is Label {
  return value === "ham" || value === "spam";
}

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "ar" || value === "es";
}
