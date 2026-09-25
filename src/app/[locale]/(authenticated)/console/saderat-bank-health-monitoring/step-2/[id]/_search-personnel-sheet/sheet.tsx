"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { FileUser, Search, XIcon } from "lucide-react";
import { RowAction } from "@/components/app";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, TablePagination } from "@/components/app";
import { appTableFeatures } from "@/components/app/table-features";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import { localeDigits } from "@/lib/utils";
import type { SBHM_Step2Record } from "@/data/saderat-bank-health-monitoring/types";
import { PersonnelList } from "../../../_personnel/personnel-list";

const columnHelper = createColumnHelper<
  typeof appTableFeatures,
  SBHM_Step2Record
>();

export type PersonnelFilter = {
  filterFn: (record: SBHM_Step2Record) => boolean;
  description: string;
};

/**
 * The people behind a bar. Opened by clicking a chart; `filter` carries the
 * predicate for the clicked value.
 *
 * The actions column links to the per-person page, keyed on national id.
 */
export function SearchPersonnelSheet({
  open,
  onOpenChange,
  data,
  monitoringId,
  filter,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SBHM_Step2Record[];
  monitoringId: number;
  filter?: PersonnelFilter;
}) {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.SaderatBankHealthMonitoringPage"
  );
  // "Actions" is a shared column header, not an SBHM string — it lives in
  // common.Dictionary, which the monitoring index page already reads it from.
  const tDictionary = useTranslations("common.Dictionary");
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = React.useState("");

  // Cleared on close, in the event rather than an effect: setState inside an
  // effect trips react-hooks and causes a second render pass. Without this the
  // sheet reopened still filtered by the last term, silently narrowing a new
  // result set — the header said one count and the table showed another.
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) setSearchTerm("");
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const filtered = React.useMemo(
    () => (filter ? data.filter(filter.filterFn) : data),
    [data, filter]
  );

  const columns = React.useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("نام", {
          header: "نام",
          cell: (info) => `${info.getValue() ?? ""}`,
        }),
        columnHelper.accessor("نام خانوادگی", {
          header: "نام خانوادگی",
          cell: (info) => `${info.getValue() ?? ""}`,
        }),
        columnHelper.accessor("کد ملی", {
          header: "کد ملی",
          cell: (info) => localeDigits(String(info.getValue() ?? ""), locale),
        }),
        columnHelper.display({
          id: "actions",
          header: tDictionary("Actions"),
          cell: ({ row }) => {
            const nationalId = String(row.original["کد ملی"] ?? "");
            // the route keys on national id; a row without one has nowhere to go
            if (!nationalId) return null;
            return (
              <RowAction
                icon={FileUser}
                label={tDictionary("PatientRecord")}
                href={`/console/saderat-bank-health-monitoring/step-2/${monitoringId}/${nationalId}`}
                onClick={() => onOpenChange(false)}
              />
            );
          },
        }),
      ]),
    [locale, monitoringId, onOpenChange, tDictionary]
  );

  const table = useTable({
    features: appTableFeatures,
    columns,
    data: filtered,
    globalFilterFn: (row, _columnId, value) => {
      const haystack = [
        row.original["نام"],
        row.original["نام خانوادگی"],
        row.original["کد ملی"],
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ");
      return haystack.includes(String(value).toLowerCase());
    },
    state: { globalFilter: searchTerm },
    onGlobalFilterChange: setSearchTerm,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {/* dvh, not vh: on a phone vh counts the space under the browser's
          toolbar, which pushed the pagination off screen. */}
      <SheetContent side="bottom" className="h-[85dvh] flex flex-col p-4">
        <SheetHeader>
          <SheetTitle>{t("SearchPersonnel")}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {filter ? (
              <>
                <Badge variant="secondary">{filter.description}</Badge>
                {/* How many the clicked bar matched. Only shown with a filter:
                    it counts before the search box narrows things, so beside a
                    search it contradicted the pagination line below. Was also
                    a bare digit with no label. */}
                <span className="text-muted-foreground">
                  {t("MatchCount", {
                    count: localeDigits(filtered.length, locale),
                  })}
                </span>
              </>
            ) : (
              t("SearchPersonnelDescription")
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="relative">
          <Search className="absolute start-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("SearchPlaceholder")}
            className="ps-8"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearchTerm("")}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-auto sm:hidden">
          <PersonnelList
            items={table.getRowModel().rows.map((row) => {
              const nationalId = String(row.original["کد ملی"] ?? "");
              return {
                key: row.id,
                name: `${row.original["نام"] ?? ""} ${row.original["نام خانوادگی"] ?? ""}`.trim(),
                nationalId: localeDigits(nationalId, locale),
                href: nationalId
                  ? `/console/saderat-bank-health-monitoring/step-2/${monitoringId}/${nationalId}`
                  : null,
              };
            })}
            openLabel={tDictionary("PatientRecord")}
            emptyMessage={t("NoSearchResults")}
            onNavigate={() => onOpenChange(false)}
          />
        </div>

        <div className="hidden flex-1 overflow-auto sm:block">
          <DataTable
            table={table}
            columns={columns}
            noDataMessage={t("NoSearchResults")}
          />
        </div>
        <TablePagination table={table} />
      </SheetContent>
    </Sheet>
  );
}
