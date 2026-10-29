/**
 * Punycode decoder for hostnames.
 * The steps follow RFC 3492, which is the public standard. This file is an
 * original implementation so the link check can run in the browser without
 * pulling in Node's url module.
 */

const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const DELIMITER = "-";

function decodeDigit(code: number): number {
  if (code >= 48 && code <= 57) return code - 22; // 0-9 -> 26-35
  if (code >= 65 && code <= 90) return code - 65;
  if (code >= 97 && code <= 122) return code - 97;
  return BASE;
}

function adapt(delta: number, numPoints: number, firstTime: boolean): number {
  let current = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
  current += Math.floor(current / numPoints);
  let k = 0;
  while (current > Math.floor(((BASE - T_MIN) * T_MAX) / 2)) {
    current = Math.floor(current / (BASE - T_MIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - T_MIN + 1) * current) / (current + SKEW));
}

export function decodePunycode(input: string): string {
  const output: string[] = [];
  let n = INITIAL_N;
  let i = 0;
  let bias = INITIAL_BIAS;

  let basic = input.lastIndexOf(DELIMITER);
  if (basic < 0) basic = 0;

  for (let j = 0; j < basic; j += 1) {
    const code = input.charCodeAt(j);
    if (code >= 0x80) throw new Error("Invalid punycode");
    output.push(input[j] ?? "");
  }

  let index = basic > 0 ? basic + 1 : 0;
  while (index < input.length) {
    const oldi = i;
    let w = 1;
    for (let k = BASE; ; k += BASE) {
      if (index >= input.length) throw new Error("Invalid punycode");
      const code = input.charCodeAt(index);
      index += 1;
      const digit = decodeDigit(code);
      if (digit >= BASE) throw new Error("Invalid punycode");
      if (digit > Math.floor((0x7fffffff - i) / w)) throw new Error("Punycode overflow");
      i += digit * w;
      const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
      if (digit < t) break;
      if (w > Math.floor(0x7fffffff / (BASE - t))) throw new Error("Punycode overflow");
      w *= BASE - t;
    }

    const outLen = output.length + 1;
    bias = adapt(i - oldi, outLen, oldi === 0);
    if (Math.floor(i / outLen) > 0x10ffff - n) throw new Error("Punycode overflow");
    n += Math.floor(i / outLen);
    i %= outLen;
    output.splice(i, 0, String.fromCodePoint(n));
    i += 1;
  }

  return output.join("");
}

/** Decode xn-- labels. Labels that are already Unicode are returned as-is. */
export function decodeHostname(hostname: string): string {
  return hostname
    .replace(/\.$/, "")
    .split(".")
    .map((label) => {
      const lower = label.toLowerCase();
      if (!lower.startsWith("xn--")) return lower;
      try {
        return decodePunycode(lower.slice(4));
      } catch {
        return lower;
      }
    })
    .join(".");
}
