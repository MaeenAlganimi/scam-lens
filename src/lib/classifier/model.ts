import raw from "@/lib/classifier/model.json";
import { predictSpamProbability, type BayesModel } from "@/lib/classifier/bayes";

export const model = raw as BayesModel;

export function spamProbability(text: string): number {
  return predictSpamProbability(text, model);
}
