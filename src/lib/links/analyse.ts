import type { Highlight } from "@/lib/types";
import {
  BRANDS,
  LINK_POINTS,
  MULTI_PART_SUFFIXES,
  SHORTENERS,
  SUSPICIOUS_TLDS,
  type Brand,
} from "@/lib/links/brands";
import { decodeHostname } from "@/lib/links/punycode";

export interface LinkSignal {
  start: number;
  end: number;
  id: string;
  points: number;
  params: Record<string, string>;
}

interface LinkSpan {
  start: number;
  end: number;
  href: string;
  display: string;
}

const CONFUSABLES: Record<string, string> = {
  "0": "o",
  "1": "l",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  $: "s",
  "€": "e",
  а: "a",
  е: "e",
  о: "o",
  р: "p",
  с: "c",
  у: "y",
  х: "x",
  і: "i",
  ѕ: "s",
  һ: "h",
  ј: "j",
  к: "k",
  м: "m",
  т: "t",
  в: "b",
  н: "h",
  α: "a",
  ο: "o",
  ν: "v",
  ρ: "p",
  τ: "t",
  ε: "e",
  ι: "i",
  κ: "k",
  υ: "u",
  χ: "x",
};

const BRAND_SUFFIXES = new Set([
  "id",
  "login",
  "secure",
  "account",
  "support",
  "verify",
  "security",
  "online",
  "app",
  "service",
  "alert",
  "update",
  "billing",
  "pay",
  "bank",
  "seguro",
]);

const BARE_TLDS =
  "com|net|org|gov|edu|info|biz|io|co|us|uk|es|sa|ae|mx|ar|br|de|fr|app|dev|me|tv|cc|ly|xyz|top|gq|ml|cf|tk|buzz|work|click|support|zip|mov|loan|icu";

function foldConfusables(token: string): string {
  const base = token.normalize("NFKC").toLowerCase();
  let out = "";
  for (const char of base) out += CONFUSABLES[char] ?? char;
  return out;
}

function foldAggressive(token: string): string {
  return foldConfusables(token).replace(/rn/g, "m");
}

export function registrableDomain(hostname: string): string {
  const host = hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  if (isIpHost(host)) return host;
  const labels = host.split(".").filter(Boolean);
  if (labels.length < 2) return host;
  const lastTwo = labels.slice(-2).join(".");
  if (labels.length >= 3 && MULTI_PART_SUFFIXES.has(lastTwo)) {
    return labels.slice(-3).join(".");
  }
  return lastTwo;
}

function isIpHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isOfficial(hostname: string, domains: readonly string[]): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function labelsOf(hostname: string): string[] {
  return hostname
    .toLowerCase()
    .replace(/\.$/, "")
    .split(".")
    .filter((label) => label && label !== "www");
}

function tokensOf(label: string): string[] {
  return label.split(/[-_]+/).filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }
  return prev[b.length] ?? 3;
}

function hasMixedScript(label: string): boolean {
  const hasLatin = /\p{Script=Latin}/u.test(label);
  const hasOther = /\p{Script=Cyrillic}|\p{Script=Greek}/u.test(label);
  return hasLatin && hasOther;
}

function looksLikeBrandPrefix(token: string, brand: string): boolean {
  if (brand.length < 5 || token.length <= brand.length || !token.startsWith(brand)) return false;
  const rest = token.slice(brand.length);
  return rest.length <= 3 || BRAND_SUFFIXES.has(rest);
}

type BrandHit = "homoglyph" | "lookalike" | "typosquat";

function brandHit(token: string, brandToken: string): BrandHit | null {
  const folded = foldConfusables(token);
  const aggressive = foldAggressive(token);
  if (aggressive === brandToken && folded !== brandToken) return "homoglyph";
  if (folded === brandToken && token.toLowerCase() !== brandToken) return "homoglyph";
  if (token.toLowerCase() === brandToken || folded === brandToken) return "lookalike";
  if (looksLikeBrandPrefix(folded, brandToken)) return "lookalike";
  if (
    brandToken.length >= 6 &&
    folded.length === brandToken.length &&
    !folded.startsWith(brandToken) &&
    !brandToken.startsWith(folded) &&
    levenshtein(folded, brandToken) === 1
  ) {
    return "typosquat";
  }
  return null;
}

function strongest(current: BrandHit | null, next: BrandHit): BrandHit {
  const rank: Record<BrandHit, number> = { homoglyph: 3, typosquat: 2, lookalike: 1 };
  if (!current || rank[next] > rank[current]) return next;
  return current;
}

function signalsForBrand(hostname: string, decodedHost: string, brand: Brand): BrandHit | null {
  if (isOfficial(hostname, brand.domains)) return null;
  let hit: BrandHit | null = null;
  const decodedLabels = labelsOf(decodedHost);
  for (const label of decodedLabels) {
    for (const token of tokensOf(label)) {
      for (const brandToken of brand.tokens) {
        const next = brandHit(token, brandToken);
        if (next) hit = strongest(hit, next);
      }
    }
  }
  return hit;
}

function pathBrand(url: URL, hostname: string): { brand: string } | null {
  const segments = url.pathname.split(/[/._-]+/).filter(Boolean);
  for (const segment of segments) {
    const folded = foldConfusables(segment);
    for (const brand of BRANDS) {
      if (isOfficial(hostname, brand.domains)) continue;
      if (brand.tokens.some((token) => folded === token)) {
        return { brand: brand.name };
      }
    }
  }
  return null;
}

function parseHref(raw: string): URL | null {
  let value = raw.trim().replace(/[),.;:!?]+$/g, "");
  if (value.startsWith("www.")) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function hostsInText(text: string): string[] {
  const found: string[] = [];
  const pattern = new RegExp(
    String.raw`(?:https?:\/\/|www\.)[^\s<>"']+|(?:[a-z0-9-]+\.)+(?:${BARE_TLDS})\b`,
    "gi",
  );
  for (const match of text.matchAll(pattern)) {
    const raw = match[0];
    if (!raw) continue;
    const url = parseHref(raw.includes("://") || raw.startsWith("www.") ? raw : `https://${raw}`);
    if (url) found.push(url.hostname);
  }
  return found;
}

function overlaps(spans: readonly LinkSpan[], start: number, end: number): boolean {
  return spans.some((span) => start < span.end && end > span.start);
}

function trimSpan(text: string, start: number, end: number): { start: number; end: number; href: string } {
  let href = text.slice(start, end);
  while (/[),.;:!?]$/.test(href)) {
    href = href.slice(0, -1);
    end -= 1;
  }
  return { start, end, href };
}

function extractSpans(text: string): LinkSpan[] {
  const spans: LinkSpan[] = [];

  const html = /<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of text.matchAll(html)) {
    const href = match[1] || match[2] || "";
    const display = (match[3] || "").replace(/<[^>]+>/g, "").trim();
    const start = match.index ?? 0;
    spans.push({ start, end: start + match[0].length, href, display });
  }

  const markdown = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  for (const match of text.matchAll(markdown)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (overlaps(spans, start, end)) continue;
    spans.push({ start, end, href: match[2] || "", display: (match[1] || "").trim() });
  }

  const raw = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
  for (const match of text.matchAll(raw)) {
    const start = match.index ?? 0;
    const trimmed = trimSpan(text, start, start + match[0].length);
    if (overlaps(spans, trimmed.start, trimmed.end)) continue;
    spans.push({ ...trimmed, display: trimmed.href });
  }

  const bare = new RegExp(
    String.raw`\b(?:[a-z0-9-]+\.)+(?:${BARE_TLDS})\b(?:\/[^\s<>"']*)?`,
    "gi",
  );
  for (const match of text.matchAll(bare)) {
    const start = match.index ?? 0;
    const trimmed = trimSpan(text, start, start + match[0].length);
    if (overlaps(spans, trimmed.start, trimmed.end)) continue;
    spans.push({ ...trimmed, display: trimmed.href });
  }

  return spans;
}

function addSignal(
  signals: LinkSignal[],
  span: LinkSpan,
  id: string,
  points: number,
  params: Record<string, string>,
) {
  signals.push({ start: span.start, end: span.end, id, points, params });
}

function analyseSpan(span: LinkSpan): LinkSignal[] {
  const url = parseHref(span.href);
  if (!url) return [];
  const hostname = url.hostname.toLowerCase();
  const decoded = decodeHostname(hostname);
  const signals: LinkSignal[] = [];
  const paramsHost = { host: hostname };

  if (isIpHost(hostname)) {
    addSignal(signals, span, "link.ip", LINK_POINTS.ip, paramsHost);
  }

  const registered = registrableDomain(hostname);
  if (SHORTENERS.has(registered) || SHORTENERS.has(hostname)) {
    addSignal(signals, span, "link.shortener", LINK_POINTS.shortener, paramsHost);
  }

  const tld = hostname.split(".").filter(Boolean).at(-1) ?? "";
  const officialAnywhere = BRANDS.some((brand) => isOfficial(hostname, brand.domains));
  if (!officialAnywhere && SUSPICIOUS_TLDS.has(tld)) {
    addSignal(signals, span, "link.tld", LINK_POINTS.tld, { host: hostname, tld });
  }

  if (url.username || url.password) {
    addSignal(signals, span, "link.userinfo", LINK_POINTS.userinfo, {
      host: hostname,
      disguise: decodeURIComponent(url.username || url.password),
    });
  }

  let homoglyph = false;
  const flaggedBrands = new Set<string>();
  for (const brand of BRANDS) {
    const hit = signalsForBrand(hostname, decoded, brand);
    if (!hit) continue;
    flaggedBrands.add(brand.name);
    const params = { host: hostname, brand: brand.name };
    if (hit === "homoglyph") {
      homoglyph = true;
      addSignal(signals, span, "link.homoglyph", LINK_POINTS.homoglyph, params);
    } else if (hit === "typosquat") {
      addSignal(signals, span, "link.typosquat", LINK_POINTS.typosquat, params);
    } else {
      addSignal(signals, span, "link.lookalike", LINK_POINTS.lookalike, params);
    }
  }

  if (!homoglyph && labelsOf(decoded).some(hasMixedScript)) {
    addSignal(signals, span, "link.mixedScript", LINK_POINTS.mixedScript, paramsHost);
  }

  const inPath = pathBrand(url, hostname);
  if (inPath && !flaggedBrands.has(inPath.brand)) {
    addSignal(signals, span, "link.brandInPath", LINK_POINTS.brandInPath, {
      host: hostname,
      brand: inPath.brand,
    });
  }

  // A raw URL is its own display text. Mismatch is only meaningful when the
  // visible words name a different site, as in an HTML or Markdown link.
  if (span.display !== span.href) {
    const actual = registrableDomain(hostname);
    for (const displayHost of hostsInText(span.display)) {
      if (registrableDomain(displayHost) !== actual) {
        addSignal(signals, span, "link.mismatch", LINK_POINTS.mismatch, {
          host: hostname,
          display: displayHost.replace(/^www\./, ""),
        });
        break;
      }
    }
  }

  return signals;
}

export function analyseLinks(text: string): LinkSignal[] {
  if (!text.trim()) return [];
  return extractSpans(text).flatMap(analyseSpan);
}

export function linkHighlights(signals: readonly LinkSignal[]): Highlight[] {
  return signals.map((signal) => ({
    start: signal.start,
    end: signal.end,
    category: "link",
    reasonId: signal.id,
    params: signal.params,
  }));
}
