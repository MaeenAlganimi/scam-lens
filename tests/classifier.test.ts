import { describe, expect, it } from "vitest";
import { predictSpamProbability, trainModel, type TrainingRow } from "@/lib/classifier/bayes";

const rows: TrainingRow[] = [
  { id: "s1", label: "spam", language: "en", text: "lottery winner prize lottery" },
  { id: "s2", label: "spam", language: "en", text: "lottery prize claim lottery" },
  { id: "h1", label: "ham", language: "en", text: "library meeting notes library" },
  { id: "h2", label: "ham", language: "en", text: "meeting at the library tomorrow" },
];

describe("naive Bayes classifier", () => {
  const model = trainModel(rows);

  it("scores a spam-like line higher than a ham-like line", () => {
    const spam = predictSpamProbability("lottery prize", model);
    const ham = predictSpamProbability("library meeting", model);
    expect(spam).toBeGreaterThan(ham);
    expect(spam).toBeGreaterThan(0.5);
    expect(ham).toBeLessThan(0.5);
  });

  it("returns the class prior when the message has no known words", () => {
    expect(predictSpamProbability("", model)).toBeCloseTo(0.5);
    expect(predictSpamProbability("qqqq zzzz", model)).toBeCloseTo(0.5);
  });

  it("refuses a training set that is missing a class", () => {
    expect(() => trainModel(rows.filter((row) => row.label === "ham"))).toThrow(/both ham and spam/);
  });
});
