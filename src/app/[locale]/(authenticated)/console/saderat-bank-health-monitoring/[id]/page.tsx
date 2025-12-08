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
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import React from "react";
import { TablePagination } from "./table-pagination";
import { useMonitoringIdRouteContext } from "./route-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileSearchCorner, Search, AlertCircle, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const columnHelper =
  createColumnHelper<SBHM_RetrieveSerializer["json"][number]>();

const MonitoringPage = (
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring/[id]">
) => {
  const { id: monitoring_id } = React.use(props.params);
  const locale = useLocale();
  const isRtl = locale === "fa";
  const { monitoring_query } = useMonitoringIdRouteContext();
  const [searchTerm, setSearchTerm] = React.useState("");
  const t = useTranslations("SaderatBankHealthMonitoringPage");

  const { data, isPending, error } = monitoring_query;

  const table = useReactTable({
    columns: [
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
          <Button variant={"ghost"} asChild>
            <Link href={`/console/saderat-bank-health-monitoring/${monitoring_id}/${row.original["personel.کد ملی"]}`}>
              <FileSearchCorner />
            </Link>
          </Button>
        ),
      }),
    ],
    data: data?.json || [],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, value) => {
      const firstName = String(row.getValue("نام") || "").toLowerCase();
      const lastName = String(row.getValue("نام خانوادگی") || "").toLowerCase();
      const nationalId = String(row.original["personel.کد ملی"] || "").toLowerCase();
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
        pageSize: 10,
      },
    },
  });

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <div className="flex items-center flex-col gap-3">
          <Spinner className="h-8 w-8" />
          <span className="text-muted-foreground">{t("Loading")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-destructive">{t("ErrorTitle")}</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.json || data.json.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Inbox className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">{t("EmptyStateTitle")}</p>
        <p className="text-sm text-muted-foreground">
          {t("EmptyStateDescriptionDetail")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MonitoringPage;
