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

/** Both bounds are always present — the only parsed form is `min-max`. */
export type NormalRange = { min: number; max: number };

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
 * Reference range, from the one shape the payload is known to use: two
 * numbers separated by a dash, `0.2-1.2` or `12.0 - 16.0`.
 *
 * Only this form is read. Open-ended shapes such as `<200` or `>=40` are
 * plausible and were drafted here, then removed: nothing in the codebase or
 * in a sampled response shows the EHR writes them, and this file must not
 * guess at a format it has not seen. The dash form is not a guess — it is the
 * pattern the existing patient-reports and step-1 pages already parse, written
 * by someone with access to real data.
 *
 * Anything unrecognised returns null and the result reads `unknown`, which the
 * page counts and displays separately. So an unhandled format shows up as a
 * visible tally of unread results, never as a silent pass. Adding a form later
 * is one branch here.
 */
export const parseRange = (
  raw: string | null | undefined
): NormalRange | null => {
  if (!raw) return null;

  const between = toAscii(raw).match(
    new RegExp(`(${NUMBER.source})\\s*[-–—]\\s*(${NUMBER.source})`)
  );
  if (!between) return null;

  const min = Number(between[1]);
  const max = Number(between[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) return null;
  return { min, max };
};

export const classify = (
  value: string | null | undefined,
  range: string | null | undefined
): EhrStatus => {
  const numeric = parseNumeric(value);
  const bounds = parseRange(range);
  if (numeric === null || !bounds) return "unknown";
  if (numeric < bounds.min) return "low";
  if (numeric > bounds.max) return "high";
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
