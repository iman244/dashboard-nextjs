"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SBHM_RetrieveSerializer } from "@/data/saderat-bank-health-monitoring/types";
import { cn, localeDigits } from "@/lib/utils";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import { appTableFeatures, type AppTableFeatures } from "@/components/app/table-features";
import { useLocale, useTranslations } from "next-intl";
import React from "react";
import { TablePagination } from "../table-pagination";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileSearchCorner, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const columnHelper =
  createColumnHelper<AppTableFeatures, SBHM_RetrieveSerializer["json"][number]>();

interface SearchPersonnelSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SBHM_RetrieveSerializer["json"];
  monitoringId: string;
  filterFn?: (record: SBHM_RetrieveSerializer["json"][number]) => boolean;
  filterDescription?: string;
}

export function SearchPersonnelSheet({
  open,
  onOpenChange,
  data,
  monitoringId,
  filterFn,
  filterDescription,
}: SearchPersonnelSheetProps) {
  const locale = useLocale();
  const isRtl = locale === "fa";
  const [searchTerm, setSearchTerm] = React.useState("");
  const t = useTranslations("/console/saderat-bank-health-monitoring.SaderatBankHealthMonitoringPage");

  // Apply filter if provided
  const filteredData = React.useMemo(() => {
    let result = data || [];
    if (filterFn) {
      result = result.filter(filterFn);
    }
    return result;
  }, [data, filterFn]);

  const table = useTable({
    features: appTableFeatures,
    columns: columnHelper.columns([
      columnHelper.accessor("نام", {
        header: "نام",
        cell: (info) => `${info.getValue()}`,
      }),
      columnHelper.accessor("نام خانوادگی", {
        header: "نام خانوادگی",
        cell: (info) => `${info.getValue()}`,
      }),
      columnHelper.accessor((row) => row["personel.کد ملی"], {
        id: "personel.کد ملی",
        header: "کد ملی",
        cell: (info) => {
          const value = String(info.getValue() || "");
          return localeDigits(value, locale);
        },
      }),
      columnHelper.display({
        header: "عملیات",
        cell: ({ row }) => (
          <Button variant={"ghost"} asChild size="sm">
            <Link
              href={`/console/saderat-bank-health-monitoring/step-1/${monitoringId}/${row.original["personel.کد ملی"]}`}
              onClick={() => onOpenChange(false)}
            >
              <FileSearchCorner className="h-4 w-4" />
            </Link>
          </Button>
        ),
      }),
    ]),
    data: filteredData,
    globalFilterFn: (row, columnId, value) => {
      const firstName = String(row.getValue("نام") || "").toLowerCase();
      const lastName = String(row.getValue("نام خانوادگی") || "").toLowerCase();
      const nationalId = String(
        row.original["personel.کد ملی"] || ""
      ).toLowerCase();
      const searchValue = value.toLowerCase();

      return (
        firstName.includes(searchValue) ||
        lastName.includes(searchValue) ||
        nationalId.includes(searchValue)
      );
    },
    state: {
      globalFilter: searchTerm,
    },
    onGlobalFilterChange: setSearchTerm,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col p-4">
        <SheetHeader>
          <SheetTitle>{t("SearchPersonnel") || "جستجوی پرسنل"}</SheetTitle>
          <SheetDescription>
            {filterDescription || t("SearchPersonnelDescription") ||
              "جستجو و مشاهده جزئیات پرسنل"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto space-y-4 mt-4">
          {/* Search Input */}
          <div className="flex items-center gap-2 space-x-reverse">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("SearchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
              >
                {t("ClearSearch")}
              </Button>
            )}
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(isRtl ? "text-right" : "text-left")}
                      >
                        {header.isPlaceholder
                          ? null
                          : <table.FlexRender header={header} />}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={table.getAllColumns().length}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t("NoResults") || "نتیجه‌ای یافت نشد"}
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getAllCells().map((cell) => (
                        <TableCell key={cell.id}>
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination table={table} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

