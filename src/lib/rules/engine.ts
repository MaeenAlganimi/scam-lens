import type { RuleCategory } from "@/lib/types";
import { foldText, foldTextWithMap } from "@/lib/text";
import { PHRASE_PATTERNS } from "@/lib/rules/patterns";

export interface RuleMatch {
  category: RuleCategory;
  start: number;
  end: number;
  phrase: string;
}

const FOLDED_PATTERNS = PHRASE_PATTERNS.map((pattern) => ({
  category: pattern.category,
  phrase: foldText(pattern.phrase),
})).filter((pattern) => pattern.phrase.length > 0);

function isWordChar(char: string | undefined): boolean {
  if (!char) return false;
  return /[\p{L}\p{N}]/u.test(char);
}

function hasBoundaries(text: string, start: number, end: number): boolean {
  const before = start > 0 ? text[start - 1] : undefined;
  const after = end < text.length ? text[end] : undefined;
  return !isWordChar(before) && !isWordChar(after);
}

/**
 * Find phrase hits in the original string. Matching is done on a folded
 * copy so casing, Arabic diacritics, and Spanish accents do not hide a phrase.
 * Indexes point back at the original text for highlighting.
 */
export function findRuleMatches(text: string): RuleMatch[] {
  if (!text.trim()) return [];
  const { text: folded, map } = foldTextWithMap(text);
  const matches: RuleMatch[] = [];
  const seen = new Set<string>();

  for (const pattern of FOLDED_PATTERNS) {
    let from = 0;
    while (from <= folded.length - pattern.phrase.length) {
      const at = folded.indexOf(pattern.phrase, from);
      if (at < 0) break;
      const end = at + pattern.phrase.length;
      if (hasBoundaries(folded, at, end)) {
        const origStart = map[at] ?? 0;
        const origEnd = end < map.length ? (map[end] ?? text.length) : text.length;
        const key = `${pattern.category}:${origStart}:${origEnd}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push({
            category: pattern.category,
            start: origStart,
            end: origEnd,
            phrase: text.slice(origStart, origEnd),
          });
        }
      }
      from = at + 1;
    }
  }

  matches.sort((a, b) => a.start - b.start || a.end - b.end);
  return matches.filter((match, index) => {
    return !matches.some((other, otherIndex) => {
      if (otherIndex === index || other.category !== match.category) return false;
      const covers =
        other.start <= match.start &&
        other.end >= match.end &&
        other.end - other.start > match.end - match.start;
      return covers;
    });
  });
}

export function matchedCategories(matches: readonly RuleMatch[]): RuleCategory[] {
  const categories: RuleCategory[] = [];
  for (const match of matches) {
    if (!categories.includes(match.category)) categories.push(match.category);
  }
  return categories;
}
