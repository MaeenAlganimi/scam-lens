import fs from "node:fs";
import path from "node:path";
import { buildReport } from "../src/lib/classifier/report";
import { loadHandwritten, loadUci } from "./loadData";

const uci = loadUci();
const handwritten = loadHandwritten();
const { model, report } = buildReport(uci.rows, handwritten, {
  rawLines: uci.rawLines,
  uniqueMessages: uci.uniqueMessages,
});

const modelPath = path.join(process.cwd(), "src/lib/classifier/model.json");
const reportPath = path.join(process.cwd(), "data/evaluation.json");
fs.writeFileSync(modelPath, `${JSON.stringify(model)}\n`);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

const shipped = report.shippedModel;
console.log(
  JSON.stringify(
    {
      vocabularySize: report.vocabularySize,
      uciHoldout: shipped.uciHoldout,
      handwrittenHoldout: shipped.handwrittenHoldout,
      byLanguage: shipped.handwrittenHoldoutByLanguage,
      baseline: report.uciOnlyBaseline.holdout,
      uciTest: report.uci.test,
      handwrittenTest: report.handwritten.test,
    },
    null,
    2,
  ),
);
