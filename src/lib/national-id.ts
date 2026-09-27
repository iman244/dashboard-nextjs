import { format } from "date-fns";
import { toDigits } from "@/components/schema-form/types";

/**
 * The ten-digit form of a national ID as a page happens to hold it.
 *
 * Iranian national IDs are always ten digits, but a spreadsheet column read
 * as a number drops the leading zeros -- step 2's Excel turns 0849290351 into
 * 849290351 -- so eight or nine digits can only mean zeros were lost.
 */
export const fullNationalId = (raw: string | number | null | undefined) => {
  // Spreadsheet rows can hold the id as a number at runtime, whatever the type says.
  const digits = toDigits(String(raw ?? ""));
  return digits.length >= 8 && digits.length < 10
    ? digits.padStart(10, "0")
    : digits;
};

export const isNationalId = (value: string) => /^\d{10}$/.test(value);

/** The patient page for a national ID, as the console links to it. */
export const PATIENT_PATH = (nationalId: string) =>
  `/console/patients/${fullNationalId(nationalId)}`;

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
