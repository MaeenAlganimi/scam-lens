import { describe, expect, it } from "vitest";
import { findRuleMatches, matchedCategories } from "@/lib/rules/engine";
import { SAMPLES } from "@/lib/samples";

describe("rule engine", () => {
  it("matches a phrase once per category and keeps the original spelling", () => {
    const matches = findRuleMatches("URGENT: please verify your password and your password again");
    expect(matchedCategories(matches)).toEqual(["urgency", "credentials"]);
    expect(matches.some((match) => match.phrase.includes("URGENT") || match.phrase.includes("urgent"))).toBe(true);
    expect(matches.filter((match) => match.category === "credentials").length).toBeGreaterThan(0);
  });

  it("does not treat ordinary plans as scam phrases", () => {
    expect(findRuleMatches("Let's walk in the park tomorrow after class.")).toEqual([]);
  });

  it("matches Spanish accents and the unaccented spelling", () => {
    const accented = matchedCategories(findRuleMatches("Verifique su contraseña en las próximas 24 horas."));
    const plain = matchedCategories(findRuleMatches("Verifique su contrasena."));
    expect(accented).toContain("credentials");
    expect(accented).toContain("urgency");
    expect(plain).toContain("credentials");
  });

  it("matches Arabic with or without diacritics", () => {
    const plain = matchedCategories(findRuleMatches("عاجل: أكد كلمة المرور"));
    const marked = matchedCategories(findRuleMatches("عَاجِل: أكد كلمة المرور فورًا"));
    expect(plain).toEqual(expect.arrayContaining(["urgency", "credentials"]));
    expect(marked).toEqual(expect.arrayContaining(["urgency", "credentials"]));
  });

  it("flags the fictional demo messages in the expected categories", () => {
    const byId = Object.fromEntries(SAMPLES.map((sample) => [sample.id, matchedCategories(findRuleMatches(sample.text))]));
    expect(byId["en-bank"]).toEqual(expect.arrayContaining(["urgency", "credentials", "impersonation"]));
    expect(byId["en-parcel"]).toEqual(["urgency"]);
    expect(byId["en-calm"]).toEqual([]);
    expect(byId["ar-bank"]).toEqual(expect.arrayContaining(["urgency", "credentials", "impersonation"]));
    expect(byId["ar-calm"]).toEqual([]);
    expect(byId["es-bank"]).toEqual(expect.arrayContaining(["urgency", "credentials", "impersonation"]));
    expect(byId["es-calm"]).toEqual([]);
  });
});
