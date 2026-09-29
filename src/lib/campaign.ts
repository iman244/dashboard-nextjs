import { asciiDigits, nationalIdMatches } from "./national-id.ts";

/** Where a spreadsheet keeps the national id: step_1, its summary sheet, step_2. */
export const NATIONAL_ID_COLUMNS = ["personel.کد ملی", "تجمیع نتایج.کد ملی", "کد ملی"] as const;

/**
 * The column holding the national id in these rows, if any. Only the known names count:
 * person reports search just these, and a column like «کد ملی همسر» names someone else.
 */
export const findNationalIdColumn = (rows: Record<string, unknown>[]) => {
  const keys = new Set(rows.flatMap((row) => Object.keys(row)));
  return NATIONAL_ID_COLUMNS.find((column) => keys.has(column));
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

/** Whether any of `keys` holds a value in `row`; blank or whitespace-only text does not count. */
export const hasAnyValue = (row: Record<string, unknown>, keys: readonly string[]) =>
  keys.some((key) => {
    const value = row[key];
    return value !== null && value !== undefined && String(value).trim() !== "";
  });

/** A spreadsheet cell as a number, whether stored as text or as a number. */
export const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const text = value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace("٫", ".")
    .trim();
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : undefined;
};

/**
 * Whether any cell of `row` contains `query`, ignoring case and digit script.
 * National ID cells also match with their lost leading zeros restored.
 */
export const rowMatches = (row: Record<string, unknown>, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const qDigits = asciiDigits(q);
  return Object.entries(row).some(([column, value]) => {
    if (
      (NATIONAL_ID_COLUMNS as readonly string[]).includes(column) &&
      nationalIdMatches(value as string | number | null, q)
    ) {
      return true;
    }
    const text = String(value ?? "").toLowerCase();
    return text.includes(q) || (qDigits.length > 0 && asciiDigits(text).includes(qDigits));
  });
};
