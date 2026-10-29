import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { EvaluationReport } from "@/lib/classifier/report";

describe("documented metrics", () => {
  it("quotes the measured rates in the README and the walkthrough", () => {
    const report = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data/evaluation.json"), "utf8"),
    ) as EvaluationReport;
    const readme = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf8");
    const walkthrough = fs.readFileSync(path.join(process.cwd(), "docs/WALKTHROUGH.md"), "utf8");

    const blocks = [
      report.shippedModel.uciHoldout,
      report.uciOnlyBaseline.holdout,
      report.shippedModel.handwrittenHoldout,
      report.shippedModel.handwrittenHoldoutByLanguage.en,
      report.shippedModel.handwrittenHoldoutByLanguage.ar,
      report.shippedModel.handwrittenHoldoutByLanguage.es,
    ];

    for (const block of blocks) {
      for (const key of ["accuracy", "precision", "recall", "f1"] as const) {
        const printed = block[key].toFixed(4);
        expect(readme).toContain(printed);
        expect(walkthrough).toContain(printed);
      }
    }

    expect(readme).toContain(`UCI holdout messages: ${report.uci.test.total}`);
    expect(walkthrough).toContain(`UCI holdout messages: ${report.uci.test.total}`);
  });
});
