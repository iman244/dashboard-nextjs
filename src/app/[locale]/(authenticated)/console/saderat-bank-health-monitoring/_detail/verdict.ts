/**
 * Reading an excel cell that holds a verdict rather than a measurement.
 *
 * The vocabulary is not invented here: it is the mapping the step-1 page has
 * shipped with since before this refactor, written by someone with the real
 * workbook. It is an exact whitelist — a value that is not on it gets no tone
 * at all, so an unrecognised verdict reads as plain text rather than as
 * "normal".
 */
export type Verdict = "normal" | "abnormal" | "none";

const NORMAL = new Set(["طبیعی", "طبيعي", "normal"]);
const ABNORMAL = new Set(["بالا", "high", "پایین", "پايين", "low", "غیرطبیعی", "غيرطبيعي"]);

export const verdictOf = (value: unknown): Verdict => {
  if (value === null || value === undefined) return "none";
  const text = String(value).trim().toLowerCase();
  if (NORMAL.has(text)) return "normal";
  if (ABNORMAL.has(text) || text.includes("abnormal")) return "abnormal";
  return "none";
};
