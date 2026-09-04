"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, XIcon } from "lucide-react";
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
 * Rows are not links: step-2 has no per-person page. step-1 has [national_id]
 * and does link. If step-2 gains that page, the name cell is where it goes.
 */
export function SearchPersonnelSheet({
  open,
  onOpenChange,
  data,
  filter,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SBHM_Step2Record[];
  filter?: PersonnelFilter;
}) {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.SaderatBankHealthMonitoringPage"
  );
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = React.useState("");

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
      ]),
    [locale]
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col p-4">
        <SheetHeader>
          <SheetTitle>{t("SearchPersonnel")}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {filter ? (
              <Badge variant="secondary">{filter.description}</Badge>
            ) : (
              t("SearchPersonnelDescription")
            )}
            <span className="text-muted-foreground">
              {localeDigits(filtered.length, locale)}
            </span>
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

        <div className="flex-1 overflow-auto">
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
