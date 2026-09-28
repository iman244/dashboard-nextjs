"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/app/loading-state";
import { Link } from "@/i18n/navigation";
import { useRetrieve_SBHM_API } from "@/data/saderat-bank-health-monitoring/api/retrieve";
import { findNationalIdColumn, rowMatches } from "@/lib/campaign";
import { fullNationalId, isNationalId } from "@/lib/national-id";
import { formatCellValue, localeDigits } from "@/lib/utils";

/**
 * An upload with no chart layout: its rows, searchable, linking to each person.
 *
 * Only a cell that folds to a valid ten-digit national ID links; a blank or
 * letter-bearing ID stays plain text, as does every row of an upload with no
 * national-ID column at all.
 */
export const UploadRowsTable = ({
  uploadId,
  personHref,
}: {
  uploadId: number;
  personHref: (nid: string) => string;
}) => {
  const t = useTranslations("/console/monitorings.Campaign");
  const locale = useLocale();
  const { data, isPending, isError } = useRetrieve_SBHM_API({
    input: { pathVariables: { id: uploadId } },
  });
  const [query, setQuery] = React.useState("");
  const rows = React.useMemo(
    () => (data?.json ?? []) as unknown as Record<string, unknown>[],
    [data]
  );
  const columns = React.useMemo(
    () => [...new Set(rows.flatMap((r) => Object.keys(r)))],
    [rows]
  );
  const idColumn = React.useMemo(() => findNationalIdColumn(rows), [rows]);
  const shown = React.useMemo(
    () => rows.filter((r) => rowMatches(r, query)),
    [rows, query]
  );

  if (isPending) return <LoadingState label={t("loadingRows")} />;
  if (isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("rowsError")}
      </p>
    );
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">{t("noRows")}</p>;

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search
          aria-hidden="true"
          className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchRows")}
          className="ps-9"
          aria-label={t("searchRows")}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {t("rowCount", {
          shown: localeDigits(shown.length, locale),
          total: localeDigits(rows.length, locale),
        })}
      </p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  className="px-3 py-2 text-start font-medium whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i} className="border-t">
                {columns.map((c) => {
                  const text = formatCellValue(String(row[c] ?? ""), locale);
                  const nationalId =
                    c === idColumn
                      ? fullNationalId(row[c] as string | number | null)
                      : "";
                  return (
                    <td key={c} className="px-3 py-2 whitespace-nowrap">
                      {isNationalId(nationalId) ? (
                        <Link
                          className="text-primary underline-offset-4 hover:underline"
                          href={personHref(nationalId)}
                        >
                          {text}
                        </Link>
                      ) : (
                        text
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
