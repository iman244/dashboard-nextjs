"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, localeDigits } from "@/lib/utils";
import { STATUS_STYLES, StatusIcon } from "./status-icon";
import type { PersonEhr } from "./use-person-ehr";

/**
 * Every point on the timeline, written out.
 *
 * The plot answers "when", and only roughly — dots sit on a shared axis and a
 * busy day collapses into one mark. This is the same events read exactly:
 * newest first, matching the reports card, with the before/after split the
 * red rule shows spatially stated per row.
 */
export const EhrTimelineTable = ({ ehr }: { ehr: PersonEhr }) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.Ehr"
  );
  const locale = useLocale();

  const rows = React.useMemo(
    () =>
      [...ehr.events]
        .sort((a, b) => b.sortKey - a.sortKey)
        .flatMap((event) =>
          event.items.map((item) => ({ ...item, date: event.date, sortKey: event.sortKey }))
        ),
    [ehr.events]
  );

  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("tableDate")}</TableHead>
            <TableHead>{t("tableService")}</TableHead>
            <TableHead>{t("tableResult")}</TableHead>
            <TableHead>{t("tableWhen")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={`${row.date}-${row.service}-${i}`}>
              <TableCell className="whitespace-nowrap tabular-nums">
                {localeDigits(row.date, locale)}
              </TableCell>
              <TableCell className="max-w-[16rem] break-words">
                {row.service}
              </TableCell>
              <TableCell className="max-w-[20rem] break-words">
                <span className="flex items-baseline gap-1.5">
                  {row.status && <StatusIcon status={row.status} />}
                  <span
                    className={cn(
                      "tabular-nums",
                      row.status && STATUS_STYLES[row.status].text
                    )}
                  >
                    {localeDigits(row.value, locale) || "—"}
                  </span>
                  {row.range && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      ({localeDigits(row.range, locale)})
                    </span>
                  )}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.sortKey > ehr.examSortKey ? (
                  <Badge variant="secondary">{t("afterScreening")}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("beforeScreening")}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
