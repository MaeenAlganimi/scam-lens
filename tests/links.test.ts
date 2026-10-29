import { domainToUnicode } from "node:url";
import { describe, expect, it } from "vitest";
import { analyseLinks } from "@/lib/links/analyse";
import { decodeHostname } from "@/lib/links/punycode";

function ids(text: string): string[] {
  return analyseLinks(text).map((signal) => signal.id);
}

describe("link analyser", () => {
  it("leaves an official brand domain alone", () => {
    expect(analyseLinks("Receipt: https://www.paypal.com/activity")).toEqual([]);
  });

  it("flags a brand name on a different domain", () => {
    const signals = analyseLinks("Open http://paypal-secure.com/login");
    expect(signals.map((signal) => signal.id)).toContain("link.lookalike");
    expect(signals.find((signal) => signal.id === "link.lookalike")?.params.brand).toBe("PayPal");
  });

  it("flags a one-character misspelling of a long brand", () => {
    expect(ids("http://paypel.com")).toContain("link.typosquat");
  });

  it("flags confusable letters, including rn and mixed alphabets", () => {
    expect(ids("http://arnazon.com")).toContain("link.homoglyph");
    const mixed = analyseLinks("http://p\u0430ypal.com/login");
    expect(mixed.map((signal) => signal.id)).toContain("link.homoglyph");
    expect(mixed.find((signal) => signal.id === "link.homoglyph")?.params.brand).toBe("PayPal");
  });

  it("flags mixed alphabets even when the name is not a known brand", () => {
    expect(ids("http://ex\u0430mple.com")).toContain("link.mixedScript");
  });

  it("flags shorteners, IP hosts, suspicious endings, mismatched text, and hidden hosts", () => {
    expect(ids("Track it at http://bit.ly/parcel-hold")).toEqual(["link.shortener"]);
    expect(ids("http://203.0.113.10/login")).toContain("link.ip");
    expect(ids("http://random-shop.xyz/item")).toContain("link.tld");
    expect(ids('<a href="http://evil.example/login">paypal.com</a>')).toContain("link.mismatch");
    const hidden = analyseLinks("http://paypal.com@203.0.113.10/secure");
    expect(hidden.map((signal) => signal.id)).toEqual(expect.arrayContaining(["link.ip", "link.userinfo"]));
  });

  it("does not treat a normal international domain as a lookalike", () => {
    expect(analyseLinks("https://bücher.de/shop")).toEqual([]);
  });

  it("decodes punycode the same way Node does", () => {
    for (const host of ["xn--bcher-kva.de", "xn--mnchen-3ya.de", "paypal.com"]) {
      expect(decodeHostname(host)).toBe(domainToUnicode(host));
    }
  });
});
