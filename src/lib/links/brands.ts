/**
 * A sample of well-known organisations and the domains they actually use.
 * This is not a complete directory. A host is treated as official only when
 * it is one of these domains or a subdomain of one.
 */
export interface Brand {
  name: string;
  domains: readonly string[];
  tokens: readonly string[];
}

export const BRANDS: readonly Brand[] = [
  { name: "PayPal", domains: ["paypal.com"], tokens: ["paypal"] },
  { name: "Apple", domains: ["apple.com"], tokens: ["apple"] },
  { name: "iCloud", domains: ["icloud.com"], tokens: ["icloud"] },
  { name: "Microsoft", domains: ["microsoft.com", "office.com", "live.com"], tokens: ["microsoft"] },
  { name: "Outlook", domains: ["outlook.com"], tokens: ["outlook"] },
  { name: "Google", domains: ["google.com"], tokens: ["google"] },
  { name: "Amazon", domains: ["amazon.com"], tokens: ["amazon"] },
  { name: "Netflix", domains: ["netflix.com"], tokens: ["netflix"] },
  { name: "Facebook", domains: ["facebook.com", "fb.com"], tokens: ["facebook"] },
  { name: "Instagram", domains: ["instagram.com"], tokens: ["instagram"] },
  { name: "WhatsApp", domains: ["whatsapp.com"], tokens: ["whatsapp"] },
  { name: "Chase", domains: ["chase.com"], tokens: ["chase"] },
  { name: "Bank of America", domains: ["bankofamerica.com"], tokens: ["bankofamerica"] },
  { name: "Wells Fargo", domains: ["wellsfargo.com"], tokens: ["wellsfargo"] },
  { name: "HSBC", domains: ["hsbc.com"], tokens: ["hsbc"] },
  { name: "DHL", domains: ["dhl.com"], tokens: ["dhl"] },
  { name: "FedEx", domains: ["fedex.com"], tokens: ["fedex"] },
  { name: "UPS", domains: ["ups.com"], tokens: ["ups"] },
  { name: "USPS", domains: ["usps.com"], tokens: ["usps"] },
  { name: "IRS", domains: ["irs.gov"], tokens: ["irs"] },
  { name: "HMRC", domains: ["hmrc.gov.uk"], tokens: ["hmrc"] },
  { name: "Coinbase", domains: ["coinbase.com"], tokens: ["coinbase"] },
  { name: "Binance", domains: ["binance.com"], tokens: ["binance"] },
  { name: "Dropbox", domains: ["dropbox.com"], tokens: ["dropbox"] },
  { name: "Adobe", domains: ["adobe.com"], tokens: ["adobe"] },
  { name: "LinkedIn", domains: ["linkedin.com"], tokens: ["linkedin"] },
  { name: "Discord", domains: ["discord.com"], tokens: ["discord"] },
  { name: "Zoom", domains: ["zoom.us"], tokens: ["zoom"] },
  { name: "DocuSign", domains: ["docusign.com"], tokens: ["docusign"] },
  { name: "Spotify", domains: ["spotify.com"], tokens: ["spotify"] },
  { name: "Telegram", domains: ["telegram.org"], tokens: ["telegram"] },
  { name: "Al Rajhi Bank", domains: ["alrajhibank.com.sa"], tokens: ["alrajhi", "alrajhibank"] },
  { name: "SNB", domains: ["alahli.com"], tokens: ["alahli"] },
  { name: "STC", domains: ["stc.com.sa"], tokens: ["stc"] },
  { name: "Mobily", domains: ["mobily.com.sa"], tokens: ["mobily"] },
  { name: "Aramex", domains: ["aramex.com"], tokens: ["aramex"] },
  { name: "Emirates", domains: ["emirates.com"], tokens: ["emirates"] },
  { name: "BBVA", domains: ["bbva.com", "bbva.es"], tokens: ["bbva"] },
  { name: "Santander", domains: ["santander.com", "bancosantander.es"], tokens: ["santander"] },
  { name: "Correos", domains: ["correos.es"], tokens: ["correos"] },
  { name: "Zain", domains: ["zain.com"], tokens: ["zain"] },
  { name: "Etisalat", domains: ["etisalat.ae", "etisalat.com"], tokens: ["etisalat"] },
];

/** Endings that show up often in scam links. A heuristic, not a blocklist. */
export const SUSPICIOUS_TLDS: ReadonlySet<string> = new Set([
  "zip",
  "mov",
  "top",
  "xyz",
  "gq",
  "ml",
  "cf",
  "tk",
  "buzz",
  "work",
  "click",
  "country",
  "support",
  "loan",
  "gdn",
  "rest",
  "kim",
  "cfd",
  "sbs",
  "icu",
  "monster",
  "quest",
]);

export const SHORTENERS: ReadonlySet<string> = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "cutt.ly",
  "rb.gy",
  "tiny.cc",
  "rebrand.ly",
  "t.ly",
  "bit.do",
  "v.gd",
  "short.io",
  "s.id",
]);

/** Common multi-label public suffixes so co.uk is not treated as the brand. */
export const MULTI_PART_SUFFIXES: ReadonlySet<string> = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "gov.uk",
  "com.au",
  "com.br",
  "co.jp",
  "com.sa",
  "com.eg",
  "com.mx",
  "com.ar",
  "co.za",
  "com.tr",
  "com.sg",
  "com.ae",
]);

export const LINK_POINTS = {
  lookalike: 30,
  homoglyph: 32,
  typosquat: 30,
  mixedScript: 22,
  ip: 28,
  shortener: 18,
  tld: 12,
  mismatch: 24,
  userinfo: 26,
  brandInPath: 10,
} as const;
