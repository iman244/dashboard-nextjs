"use client";
import { useLocale } from "next-intl";
import { formatCellValue } from "@/lib/utils";

/** A person's row from an upload with no layout: every non-empty column. */
export const FieldList = ({ row }: { row: Record<string, unknown> }) => {
  const locale = useLocale();
  const entries = Object.entries(row).filter(([, v]) => v !== null && v !== undefined && v !== "");
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([key, value]) => (
        <div key={key} className="min-w-0">
          <dt className="text-sm text-muted-foreground">{key}</dt>
          <dd className="font-medium break-words">{formatCellValue(String(value), locale)}</dd>
        </div>
      ))}
    </dl>
  );
};
