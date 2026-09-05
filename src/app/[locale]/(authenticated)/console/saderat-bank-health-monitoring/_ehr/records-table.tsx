"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import { AlertCircle, ChartLine, Eye, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, TablePagination } from "@/components/app";
import {
  appTableFeatures,
  type AppTableFeatures,
} from "@/components/app/table-features";
import type { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { cn, localeDigits } from "@/lib/utils";
import { STATUS_STYLES, StatusIcon } from "./status-icon";
import type { EhrEventItem, LabSeries, PersonEhr } from "./use-person-ehr";

/** One result, flattened out of the date it arrived on. */
type RecordRow = EhrEventItem & { date: string; sortKey: number };

const columnHelper = createColumnHelper<AppTableFeatures, RecordRow>();

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
 * Paginated and sortable like every other table in the console: this lists a
 * person's whole history across four patientType branches over three years,
 * so it has no natural bound and cannot render in full.
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

  const rows = React.useMemo<RecordRow[]>(
    () =>
      ehr.events.flatMap((event) =>
        event.items.map((item) => ({
          ...item,
          date: event.date,
          sortKey: event.sortKey,
        }))
      ),
    [ehr.events]
  );

  const columns = React.useMemo(
    () =>
      columnHelper.columns([
        // sorts on the Jalali sort key, displays the date as written — sorting
        // the `yyyy/MM/dd` string directly would order Persian digits, not dates
        columnHelper.accessor((row) => row.sortKey, {
          id: "date",
          header: tDictionary("date"),
          cell: (info) => (
            <span className="whitespace-nowrap tabular-nums">
              {localeDigits(info.row.original.date, locale)}
            </span>
          ),
        }),
        columnHelper.accessor("service", {
          header: tDictionary("serviceName"),
          cell: (info) => (
            <span className="break-words">{info.getValue()}</span>
          ),
        }),
        columnHelper.accessor("value", {
          header: tDictionary("answer"),
          cell: (info) => {
            const { status, value } = info.row.original;
            return (
              <span className="flex items-baseline gap-1.5">
                {status && <StatusIcon status={status} />}
                <span
                  className={cn(
                    "tabular-nums",
                    status && STATUS_STYLES[status].text
                  )}
                >
                  {localeDigits(value, locale) || "—"}
                </span>
              </span>
            );
          },
        }),
        columnHelper.accessor("range", {
          header: tDictionary("normalRange"),
          cell: (info) => (
            <span className="whitespace-nowrap tabular-nums text-muted-foreground">
              {info.getValue() ? localeDigits(info.getValue(), locale) : "—"}
            </span>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: t("tableActions"),
          cell: ({ row }) => (
            <span className="flex items-center gap-1">
              {row.original.kind === "lab" && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${t("viewTrend")} — ${row.original.service}`}
                  onClick={() => {
                    const series = ehr.labs.find(
                      (l) => l.service === row.original.service
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
                aria-label={`${t("viewDetails")} — ${row.original.service}`}
                onClick={() => onViewRecord(row.original.raw)}
              >
                <Eye aria-hidden="true" className="h-4 w-4" />
              </Button>
            </span>
          ),
        }),
      ]),
    [t, tDictionary, locale, ehr.labs, onSelectSeries, onViewRecord]
  );

  const table = useTable({
    features: appTableFeatures,
    columns,
    data: rows,
    initialState: {
      sorting: [{ id: "date", desc: true }],
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

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
    <div className="space-y-4">
      <DataTable table={table} columns={columns} noDataMessage={t("noRecords")} />
      <TablePagination table={table} />
    </div>
  );
};
