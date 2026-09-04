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
import { Button } from "@/components/ui/button";
import { AlertCircle, ChartLine, Eye, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { cn, localeDigits } from "@/lib/utils";
import { STATUS_STYLES, StatusIcon } from "./status-icon";
import type { LabSeries, PersonEhr } from "./use-person-ehr";

/**
 * Every electronic result for this person, newest first.
 *
 * This replaced a dot plot on the same data. The plot showed only roughly
 * when things happened — dots shared one axis and a busy day collapsed into a
 * single mark — while the reading, its range and the service name all had to
 * live in a tooltip. The table states each of them outright.
 *
 * Every column is a field the response carries; nothing here is derived.
 *
 * Owns the pending and error states because it is the only thing left in the
 * card: without them a failed fetch would render an empty card, which reads
 * as "this person has no records".
 */
export const EhrRecordsTable = ({
  ehr,
  onViewRecord,
  onSelectSeries,
}: {
  ehr: PersonEhr;
  onViewRecord: (record: ElectronicHealthRecord) => void;
  onSelectSeries: (series: LabSeries) => void;
}) => {
  const t = useTranslations("/console/saderat-bank-health-monitoring.Ehr");
  // `جواب`, `نرمال رنج` and `نام خدمت` are the payload's own column names, and
  // common.dictionary is where this repo already renders them — the
  // patient-reports service table reads the same keys. Naming them anything
  // else here would invent a second vocabulary for one set of fields.
  const tDictionary = useTranslations("common.dictionary");
  const locale = useLocale();

  const rows = React.useMemo(
    () =>
      [...ehr.events]
        .sort((a, b) => b.sortKey - a.sortKey)
        .flatMap((event) =>
          event.items.map((item) => ({ ...item, date: event.date }))
        ),
    [ehr.events]
  );

  if (ehr.isPending) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (ehr.isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span>{ehr.errorMessage || t("loadError")}</span>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Inbox aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span>{t("noRecords")}</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {/* TableHead hardcodes `text-left`, a physical property, so in
              Persian every header sits opposite the cells beneath it.
              `text-start` follows the writing direction the cells already
              use. */}
          <TableRow>
            <TableHead className="text-start">{tDictionary("date")}</TableHead>
            <TableHead className="text-start">
              {tDictionary("serviceName")}
            </TableHead>
            <TableHead className="text-start">
              {tDictionary("answer")}
            </TableHead>
            <TableHead className="text-start">
              {tDictionary("normalRange")}
            </TableHead>
            <TableHead className="text-start">{t("tableActions")}</TableHead>
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
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                {row.range ? localeDigits(row.range, locale) : "—"}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1">
                  {row.kind === "lab" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${t("viewTrend")} — ${row.service}`}
                      onClick={() => {
                        const series = ehr.labs.find(
                          (l) => l.service === row.service
                        );
                        if (series) onSelectSeries(series);
                      }}
                    >
                      <ChartLine aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${t("viewDetails")} — ${row.service}`}
                    onClick={() => onViewRecord(row.raw)}
                  >
                    <Eye aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
