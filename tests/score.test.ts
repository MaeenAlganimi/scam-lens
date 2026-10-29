import { describe, expect, it } from "vitest";
import { SAMPLES } from "@/lib/samples";
import { HIGH_AT, MEDIUM_AT, analyzeMessage, bandForScore } from "@/lib/score";

describe("score", () => {
  it("uses fixed bands", () => {
    expect(bandForScore(0)).toBe("low");
    expect(bandForScore(MEDIUM_AT - 1)).toBe("low");
    expect(bandForScore(MEDIUM_AT)).toBe("medium");
    expect(bandForScore(HIGH_AT - 1)).toBe("medium");
    expect(bandForScore(HIGH_AT)).toBe("high");
    expect(bandForScore(100)).toBe("high");
  });

  it("keeps the fictional examples in stable bands", () => {
    const byId = Object.fromEntries(SAMPLES.map((sample) => [sample.id, analyzeMessage(sample.text)]));

    expect(byId["en-bank"].parts.rules).toBe(16 + 36 + 22);
    expect(byId["en-bank"].parts.links).toBe(30 + 12);
    expect(byId["en-bank"].band).toBe("high");
    expect(byId["en-bank"].score).toBeLessThanOrEqual(100);

    expect(byId["en-parcel"].parts).toMatchObject({ rules: 16, links: 18 });
    expect(byId["en-parcel"].band).toBe("medium");

    for (const id of ["en-calm", "ar-calm", "es-calm"]) {
      expect(byId[id].parts.rules).toBe(0);
      expect(byId[id].parts.links).toBe(0);
      expect(byId[id].band).toBe("low");
    }

    expect(byId["ar-bank"].band).toBe("high");
    expect(byId["es-bank"].band).toBe("high");
    expect(byId["en-bank"].highlights.length).toBeGreaterThan(0);
  });

  it("caps the displayed score at 100 and says so", () => {
    const result = analyzeMessage(
      "URGENT final notice: Chase security. Your account is suspended. Verify your password. You have won a cash prize. Pay with a gift card. http://secure-chase-login.xyz/verify",
    );
    expect(result.rawScore).toBeGreaterThan(100);
    expect(result.score).toBe(100);
    expect(result.reasons.some((reason) => reason.id === "reason.capped")).toBe(true);
  });
});
