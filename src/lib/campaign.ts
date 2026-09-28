import { asciiDigits } from "./national-id.ts";

/** Where a spreadsheet keeps the national id: step_1, its summary sheet, step_2. */
export const NATIONAL_ID_COLUMNS = ["personel.کد ملی", "تجمیع نتایج.کد ملی", "کد ملی"] as const;

/** The column holding the national id in these rows, if any. */
export const findNationalIdColumn = (rows: Record<string, unknown>[]) => {
  const keys = new Set(rows.flatMap((row) => Object.keys(row)));
  return (
    NATIONAL_ID_COLUMNS.find((column) => keys.has(column)) ??
    [...keys].find((key) => key.includes("کد ملی"))
  );
};

/** One campaign's uploads, newest first. `type` is the campaign's slug. */
export const campaignUploads = <U extends { type: string; created_at: string; id: number }>(
  uploads: U[],
  slug: string
) =>
  uploads
    .filter((upload) => upload.type === slug)
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);

/** The upload to show: the requested one if it is in the list, else the newest. */
export const pickUpload = <U extends { id: number }>(uploads: U[], requested: string | null) => {
  const found = requested === null ? undefined : uploads.find((u) => String(u.id) === requested);
  return {
    selected: found ?? uploads[0],
    requestedMissing: requested !== null && found === undefined,
  };
};

/** Whether any cell of `row` contains `query`, ignoring case and digit script. */
export const rowMatches = (row: Record<string, unknown>, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const qDigits = asciiDigits(q);
  return Object.values(row).some((value) => {
    const text = String(value ?? "").toLowerCase();
    return text.includes(q) || (qDigits.length > 0 && asciiDigits(text).includes(qDigits));
  });
};
