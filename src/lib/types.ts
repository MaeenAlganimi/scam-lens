export type Locale = "en" | "ar" | "es";

export type Label = "ham" | "spam";

/** Phrase categories the rule engine can explain. */
export type RuleCategory =
  | "urgency"
  | "payment"
  | "prize"
  | "credentials"
  | "impersonation";

export type HighlightCategory = RuleCategory | "link";

export type RiskBand = "low" | "medium" | "high";

export interface Highlight {
  start: number;
  end: number;
  category: HighlightCategory;
  /** i18n key for the per-highlight explanation. */
  reasonId: string;
  params?: Record<string, string>;
}

export interface Reason {
  /** i18n key. */
  id: string;
  points: number;
  params?: Record<string, string>;
}

export interface Analysis {
  score: number;
  rawScore: number;
  band: RiskBand;
  reasons: Reason[];
  highlights: Highlight[];
  spamProbability: number;
  parts: {
    rules: number;
    links: number;
    classifier: number;
  };
}

export interface SampleMessage {
  id: string;
  /** Language of the message text, which can differ from the UI language. */
  language: Locale;
  text: string;
}
