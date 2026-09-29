"use client";

import { useLocale, useTranslations } from "next-intl";
import { hasAnyValue } from "@/lib/campaign";
import { formatCellValue, formatDate, localeDigits } from "@/lib/utils";

/** The spreadsheet columns a person header used to show, by message key. */
const COLUMNS = {
  age: "سن",
  gender: "جنسیت",
  examDate: "تاریخ",
} as const;

export type DemographicField = keyof typeof COLUMNS;

/** An upload stores a date cell as ISO text; anything else is shown as typed. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ][\d:.]+)?$/;

/**
 * Age, gender and (for Step 1) the exam date, as one muted line of label:
 * value pairs. Only the fields the row holds are shown, and nothing at all when
 * it holds none. Not a finding: a row with only these still says it has none.
 */
export const Demographics = ({
  row,
  fields,
}: {
  row: Record<string, unknown>;
  fields: readonly DemographicField[];
}) => {
  const t = useTranslations("/console/monitorings.CampaignPatient.demographics");
  const locale = useLocale();

  const present = fields.filter((field) => hasAnyValue(row, [COLUMNS[field]]));
  if (present.length === 0) return null;

  const show = (field: DemographicField) => {
    const text = String(row[COLUMNS[field]]).trim();
    if (field === "examDate" && ISO_DATE.test(text)) {
      const date = new Date(text.replace(" ", "T"));
      // date-fns-jalali prints Latin digits; the locale picks the script.
      if (!Number.isNaN(date.getTime())) return localeDigits(formatDate(date, locale), locale);
    }
    return formatCellValue(text, locale);
  };

  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {present.map((field) => (
        <div key={field} className="flex gap-1">
          <dt>{t(field)}:</dt>
          <dd>{show(field)}</dd>
        </div>
      ))}
    </dl>
  );
};
