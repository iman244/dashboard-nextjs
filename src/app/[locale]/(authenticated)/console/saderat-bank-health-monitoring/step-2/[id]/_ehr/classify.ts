import { digitsArToEn, digitsFaToEn } from "@persian-tools/persian-tools";
import { newDate } from "date-fns-jalali";

/**
 * Reading a lab result against its reference range.
 *
 * `نرمال رنج` is free text typed by whoever entered the result, so every
 * helper here returns null rather than guessing when it cannot parse. An
 * unparseable range makes a result `unknown`, never `normal` — the page must
 * not imply a value was checked when it was not.
 */
export type EhrStatus = "low" | "high" | "normal" | "unknown";

/** An open-ended bound is null: `<200` is `{ min: null, max: 200 }`. */
export type NormalRange = { min: number | null; max: number | null };

/** Persian and Arabic digits normalised to ASCII, decimal separator unified. */
const toAscii = (raw: string) =>
  digitsArToEn(digitsFaToEn(raw)).replace(/٫/g, ".").trim();

const NUMBER = /-?\d+(?:\.\d+)?/;

export const parseNumeric = (raw: string | null | undefined): number | null => {
  if (!raw) return null;
  const match = toAscii(raw).match(NUMBER);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
};

/**
 * Reference range from the shapes the payload actually uses:
 * `0.2-1.2`, `12.0 - 16.0`, `<200`, `>= 40`, `up to 5`.
 */
export const parseRange = (
  raw: string | null | undefined
): NormalRange | null => {
  if (!raw) return null;
  const text = toAscii(raw);

  const between = text.match(
    new RegExp(`(${NUMBER.source})\\s*[-–—]\\s*(${NUMBER.source})`)
  );
  if (between) {
    const min = Number(between[1]);
    const max = Number(between[2]);
    if (Number.isFinite(min) && Number.isFinite(max) && min <= max) {
      return { min, max };
    }
  }

  const upper = text.match(new RegExp(`(?:<=?|up to)\\s*(${NUMBER.source})`, "i"));
  if (upper) return { min: null, max: Number(upper[1]) };

  const lower = text.match(new RegExp(`>=?\\s*(${NUMBER.source})`));
  if (lower) return { min: Number(lower[1]), max: null };

  return null;
};

export const classify = (
  value: string | null | undefined,
  range: string | null | undefined
): EhrStatus => {
  const numeric = parseNumeric(value);
  const bounds = parseRange(range);
  if (numeric === null || !bounds) return "unknown";
  if (bounds.min !== null && numeric < bounds.min) return "low";
  if (bounds.max !== null && numeric > bounds.max) return "high";
  return "normal";
};

export const isAbnormal = (status: EhrStatus) =>
  status === "low" || status === "high";

/**
 * Jalali `yyyy/MM/dd` to a sortable number. Kept as integer arithmetic rather
 * than a Date so a malformed date sorts last instead of becoming NaN.
 */
export const jalaliSortKey = (raw: string | null | undefined): number => {
  if (!raw) return 0;
  const parts = toAscii(raw).split("/").map(Number);
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return 0;
  const [year, month, day] = parts;
  return year * 10000 + month * 100 + day;
};

/**
 * Jalali `yyyy/MM/dd` to epoch millis.
 *
 * jalaliSortKey orders correctly but is not linear in days — 1404/01/31 to
 * 1404/02/01 is a jump of 70 — so anything that measures *distance* between
 * dates, such as the timeline, needs this instead.
 */
export const jalaliTimestamp = (raw: string | null | undefined): number | null => {
  if (!raw) return null;
  const parts = toAscii(raw).split("/").map(Number);
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [year, month, day] = parts;
  const date = newDate(year, month - 1, day);
  const time = date.getTime();
  return Number.isFinite(time) ? time : null;
};
