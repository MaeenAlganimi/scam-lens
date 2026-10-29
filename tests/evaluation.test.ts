import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildReport } from "@/lib/classifier/report";
import { SAMPLES } from "@/lib/samples";
import { loadHandwritten, loadUci } from "../scripts/loadData";

describe("training evaluation", () => {
  it("matches the committed model and the measured report", () => {
    const uci = loadUci();
    const handwritten = loadHandwritten();
    const fresh = buildReport(uci.rows, handwritten, {
      rawLines: uci.rawLines,
      uniqueMessages: uci.uniqueMessages,
    });
    const report = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/evaluation.json"), "utf8"));
    const model = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/lib/classifier/model.json"), "utf8"));

    expect(fresh.report).toEqual(report);
    expect(fresh.model).toEqual(model);
    expect(report.shippedModel.uciHoldout.count).toBeGreaterThan(100);
    expect(report.uci.duplicateLinesRemoved).toBeGreaterThan(0);
  }, 30_000);

  it("does not train on the fictional demo messages", () => {
    const handwritten = loadHandwritten();
    const texts = new Set(handwritten.map((row) => row.text));
    for (const sample of SAMPLES) {
      expect(texts.has(sample.text)).toBe(false);
    }
  });
});
