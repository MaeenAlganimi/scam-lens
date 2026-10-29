/**
 * Folding used by the rule engine and the classifier.
 * The goal is to match "contraseña" with "contrasena", and Arabic
 * "فوراً" / "أبل" with the phrases we store, without changing the
 * text the user sees. Link lookalikes use a separate confusable map.
 */

const ALEF = new Set(["أ", "إ", "آ", "ٱ"]);

function isIgnorable(codePoint: number): boolean {
  return (
    (codePoint >= 0x064b && codePoint <= 0x065f) ||
    codePoint === 0x0670 ||
    codePoint === 0x0640 ||
    codePoint === 0x200b ||
    codePoint === 0x200c ||
    codePoint === 0x200d ||
    codePoint === 0x200e ||
    codePoint === 0x200f ||
    codePoint === 0xfeff
  );
}

function foldChunk(char: string): string {
  let value = char.toLowerCase();
  if (ALEF.has(value) || ALEF.has(char)) value = "ا";
  if (value === "ى") value = "ي";
  if (value === "ة") value = "ه";
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

/**
 * Returns the folded text and a map from each folded character back to
 * an index in the original string. Callers use it to highlight the
 * original phrase after matching on the folded copy.
 */
export function foldTextWithMap(input: string): { text: string; map: number[] } {
  const chars: string[] = [];
  const map: number[] = [];

  for (let index = 0; index < input.length; ) {
    const codePoint = input.codePointAt(index);
    if (codePoint === undefined) break;
    const char = String.fromCodePoint(codePoint);
    const next = index + char.length;

    if (isIgnorable(codePoint)) {
      index = next;
      continue;
    }

    if (/\s/u.test(char)) {
      if (chars[chars.length - 1] !== " ") {
        chars.push(" ");
        map.push(index);
      }
      index = next;
      continue;
    }

    const folded = foldChunk(char);
    for (const piece of folded) {
      chars.push(piece);
      map.push(index);
    }
    index = next;
  }

  return { text: chars.join(""), map };
}

export function foldText(input: string): string {
  return foldTextWithMap(input).text.trim();
}

/** URLs are scored by the link analyser, so the classifier sees wording only. */
export function stripUrls(input: string): string {
  return input
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\bwww\.\S+/gi, " ")
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, " ");
}

export function tokenize(input: string): string[] {
  const folded = foldText(stripUrls(input));
  if (!folded) return [];
  return folded.split(/[^\p{L}\p{N}]+/u).filter((token) => isUsefulToken(token));
}

export function isUsefulToken(token: string): boolean {
  if (token.length < 2 || token.length > 30) return false;
  if (/^\d+$/u.test(token)) return false;
  return true;
}

export function uniqueTokens(input: string): string[] {
  return [...new Set(tokenize(input))];
}
