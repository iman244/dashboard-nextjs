import { format } from "date-fns";

/** Persian and Arabic-Indic digits to ASCII, everything else dropped. */
export const asciiDigits = (raw: string) =>
  raw
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[^0-9]/g, "");

/** Persian and Arabic-Indic digits to ASCII; everything else kept. */
const foldDigits = (raw: string) =>
  raw
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

/**
 * The ten-digit form of a national ID as a page happens to hold it.
 *
 * Iranian national IDs are always ten digits, but a spreadsheet column read
 * as a number drops the leading zeros -- step 2's Excel turns 0849290351 into
 * 849290351 -- so eight or nine digits can only mean zeros were lost.
 *
 * Digits fold but letters are never stripped: stripping `12345678A` to
 * `0012345678` would open another real person (verified 2026-09-28).
 */
export const fullNationalId = (raw: string | number | null | undefined) => {
  // Spreadsheet rows can hold the id as a number at runtime, whatever the type says.
  // Persian copy-paste and Excel also carry invisible bidi/zero-width marks
  // (ZWNJ/ZWJ/LRM/RLM, bidi embeddings/overrides, isolates, BOM) that must
  // fold away like whitespace and dashes, never count as "not a digit".
  const compact = foldDigits(String(raw ?? "")).replace(
    /[\s\-‌-‏‪-‮⁦-⁩﻿]/g,
    ""
  );
  if (!/^\d+$/.test(compact)) return compact;
  return compact.length >= 8 && compact.length < 10 ? compact.padStart(10, "0") : compact;
};

export const isNationalId = (value: string) => /^\d{10}$/.test(value);

/**
 * A route segment decoded, or left as it came when its escapes are malformed
 * (`%E0%A4%A`): the stray `%` then keeps it an invalid ID, where
 * `decodeURIComponent` would have thrown and crashed the page.
 */
export const safeDecode = (raw: string) => {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

/** The patient page for a national ID, as the console links to it. */
export const PATIENT_PATH = (nationalId: string) =>
  `/console/patients/${encodeURIComponent(fullNationalId(nationalId))}`;

/**
 * The patient page, carrying over a date window the caller was already
 * filtering by. The page reads it as plain Gregorian days; no window means
 * its own default.
 */
export const patientHref = (
  nationalId: string,
  range?: { from?: Date; to?: Date } | null
) => {
  const params = new URLSearchParams();
  if (range?.from) params.set("from", format(range.from, "yyyy-MM-dd"));
  if (range?.to) params.set("to", format(range.to, "yyyy-MM-dd"));
  const query = params.toString();
  return query ? `${PATIENT_PATH(nationalId)}?${query}` : PATIENT_PATH(nationalId);
};

/** A patient inside one campaign (a MonitoringType id). */
export const CAMPAIGN_PATIENT_PATH = (campaignId: number, nationalId: string) =>
  `/console/monitorings/${campaignId}/patients/${encodeURIComponent(fullNationalId(nationalId))}`;
