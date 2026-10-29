import fs from "node:fs";
import path from "node:path";
import { isLabel, isLocale } from "../src/lib/classifier/report";
import type { TrainingRow } from "../src/lib/classifier/bayes";

export function loadUci(root = process.cwd()): {
  rows: TrainingRow[];
  rawLines: number;
  uniqueMessages: number;
} {
  const file = path.join(root, "data/sms-spam-collection/SMSSpamCollection");
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((line) => line.length > 0);
  const seen = new Set<string>();
  const rows: TrainingRow[] = [];

  lines.forEach((line, index) => {
    const tab = line.indexOf("\t");
    if (tab < 0) throw new Error(`SMS Spam Collection line ${index + 1} has no tab.`);
    const label = line.slice(0, tab).trim();
    const text = line.slice(tab + 1).replace(/\r$/, "");
    if (!isLabel(label) || !text.trim()) {
      throw new Error(`SMS Spam Collection line ${index + 1} is not ham or spam.`);
    }
    if (seen.has(text)) return;
    seen.add(text);
    rows.push({ id: `uci-${index + 1}`, label, text, language: "en" });
  });

  return { rows, rawLines: lines.length, uniqueMessages: rows.length };
}

interface HandwrittenFile {
  messages: { id: string; language: string; label: string; text: string }[];
}

export function loadHandwritten(root = process.cwd()): TrainingRow[] {
  const file = path.join(root, "data/handwritten/messages.json");
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as HandwrittenFile;
  const ids = new Set<string>();
  return parsed.messages.map((message) => {
    if (!message.id || ids.has(message.id)) throw new Error(`Bad handwritten id: ${message.id}`);
    ids.add(message.id);
    if (!isLocale(message.language) || !isLabel(message.label) || !message.text.trim()) {
      throw new Error(`Bad handwritten message: ${message.id}`);
    }
    return {
      id: message.id,
      language: message.language,
      label: message.label,
      text: message.text,
    };
  });
}
