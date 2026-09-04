import type { PersonEhr } from "./use-person-ehr";

/**
 * Persian spelling normalised for comparison: Arabic yeh/kaf folded to the
 * Persian letters, diacritics and ZWNJ dropped, whitespace collapsed. The two
 * systems were populated by different people and disagree on all three.
 */
export const normalizeFa = (raw: string) =>
  raw
    .toLowerCase()
    .replace(/[يى]/g, "ی") // ي/ى → ی
    .replace(/ك/g, "ک") // ك → ک
    .replace(/[ً-ٰٟ‌‏‎]/g, "")
    .replace(/[*.،,;؛:()\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Separators the excel free-text list actually uses. */
const SPLIT = /[،,;؛\n\r]+|\s[-–]\s|،/;

/**
 * The ordered tests, from `آزمایشات تکمیلی مورد نیاز` free text.
 *
 * Single characters and bare numbers are dropped — they are list bullets and
 * stray punctuation, not test names.
 */
export const parseRequestedTests = (raw: unknown): string[] => {
  const text = String(raw ?? "").trim();
  if (!text) return [];
  return Array.from(
    new Set(
      text
        .split(SPLIT)
        .map((part) => part.trim())
        .filter((part) => part.length > 1 && !/^\d+$/.test(part))
    )
  );
};

export type FollowUpItem = {
  label: string;
  /** A result for this test exists dated after the screening. */
  done: boolean;
  date?: string;
};

/**
 * Whether each ordered test has since come back.
 *
 * "Since" is measured against the campaign's own date rather than a fixed
 * cutoff, so a result predating the screening counts as history, not as
 * follow-up. Matching is substring-based in both directions because neither
 * side uses a controlled vocabulary; a test whose name cannot be matched shows
 * as outstanding, which is the safe direction to be wrong in.
 */
export const buildFollowUp = (
  requested: string[],
  ehr: PersonEhr
): FollowUpItem[] => {
  const after = [
    ...ehr.labs.flatMap((series) => series.points),
    ...ehr.reports,
  ].filter((entry) => entry.sortKey > ehr.examSortKey);

  const indexed = after.map((entry) => ({
    name: normalizeFa(entry.service),
    date: entry.date,
    sortKey: entry.sortKey,
  }));

  return requested.map((label) => {
    const needle = normalizeFa(label);
    const hits = indexed
      .filter(
        (entry) =>
          needle.length > 1 &&
          entry.name.length > 1 &&
          (entry.name.includes(needle) || needle.includes(entry.name))
      )
      .sort((a, b) => a.sortKey - b.sortKey);

    return { label, done: hits.length > 0, date: hits[0]?.date };
  });
};
