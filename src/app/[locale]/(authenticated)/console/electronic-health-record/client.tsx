"use client";

import {
  ehr_by_national_number,
  EHR_BY_NATIONAL_NUMBER_KEY,
  EHRByNationalNumberApiResponse,
} from "@/data/electronic health record/api/EHR-by-national-number";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { digitsEnToFa, digitsFaToEn } from "@persian-tools/persian-tools";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// Column helper will be used inside the component
const columnHelper = createColumnHelper<ElectronicHealthRecord>();

// Step 7: Enhanced Loading Skeleton Component (Type-Safe)
const LoadingSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-28" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-28" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

const Client = () => {
  const t = useTranslations("EHRTable");
  const locale = useLocale();

  // Helper function to format numbers based on locale
  const formatNumber = (num: number): string => {
    return locale === "fa"
      ? digitsEnToFa(num.toString())
      : digitsFaToEn(num.toString());
  };

  // Helper function to format cell values based on locale
  const formatCellValue = (value: string | number): string => {
    return locale === "fa"
      ? digitsEnToFa(value.toString())
      : digitsFaToEn(value.toString());
  };

  // Column definitions with locale-aware formatting
  const columns = [
    columnHelper.accessor("نام بيمار", {
      header: "نام بیمار",
      cell: (info) => formatCellValue(info.getValue()),
    }),
    columnHelper.accessor("نام خانوادگي بيمار", {
      header: "نام خانوادگی",
      cell: (info) => formatCellValue(info.getValue()),
    }),
    columnHelper.accessor("كدملي", {
      header: "کد ملی",
      cell: (info) => formatCellValue(info.getValue()),
    }),
    columnHelper.accessor("سن", {
      header: "سن",
      cell: (info) => formatCellValue(info.getValue()),
    }),
    columnHelper.accessor("تاريخ", {
      header: "تاریخ",
      cell: (info) => formatCellValue(info.getValue()),
    }),
    columnHelper.accessor("نام خدمت", {
      header: "نام خدمت",
      cell: (info) => formatCellValue(info.getValue()),
    }),
    columnHelper.accessor("نام پزشك معالج", {
      header: "نام پزشک",
      cell: (info) => formatCellValue(info.getValue()),
    }),
  ];

  const ehrByNationalNumber_q = useQuery({
    queryKey: [EHR_BY_NATIONAL_NUMBER_KEY],
    queryFn: () =>
      ehr_by_national_number({
        params: {
          nationalNumber: "",
          fromDate: "1404/07/20",
          toDate: "1404/07/20",
          patientType: "25",
        },
      }),
  });

  // Step 8: Add Pagination with shadcn/ui
  const table = useReactTable({
    data: ehrByNationalNumber_q.data || [], // Use real API data, fallback to empty array
    columns: columns,
    getCoreRowModel: getCoreRowModel(), // Basic row model for rendering
    getPaginationRowModel: getPaginationRowModel(), // Add pagination support
    initialState: {
      pagination: {
        pageSize: 10, // Show 10 rows per page
      },
    },
  });

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <Button
          onClick={() => ehrByNationalNumber_q.refetch()}
          variant="outline"
          size="sm"
          disabled={ehrByNationalNumber_q.isFetching}
          className="flex items-center space-x-2 space-x-reverse"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              ehrByNationalNumber_q.isFetching ? "animate-spin" : ""
            }`}
          />
          <span>بروزرسانی</span>
        </Button>
      </div>

      {/* Step 6: Real Data Integration with Loading/Error States */}
      <div className="flex-1">
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
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
              {ehrByNationalNumber_q.isFetching ? (
                <LoadingSkeleton />
              ) : ehrByNationalNumber_q.isError ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-red-500"
                  >
                    خطا در بارگذاری داده‌ها:{" "}
                    {ehrByNationalNumber_q.error?.message}
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {t("pagination.noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Step 8: Persian/RTL Compatible Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <p className="text-sm text-muted-foreground">
            {t("pagination.showing", {
              start: formatNumber(
                table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1
              ),
              end: formatNumber(
                Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )
              ),
              total: formatNumber(table.getFilteredRowModel().rows.length),
            })}
          </p>
        </div>

        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center space-x-2 space-x-reverse">
            <p className="text-sm font-medium">{t("pagination.rowsPerPage")}</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={formatNumber(
                    table.getState().pagination.pageSize
                  )}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {formatNumber(pageSize)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom RTL Pagination */}
          <div className="flex items-center space-x-1 space-x-reverse">
            {/* First Page Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">{t("pagination.firstPage")}</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>

            {/* Previous Page Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">{t("pagination.previousPage")}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Page Numbers */}
            {Array.from({ length: table.getPageCount() }, (_, i) => {
              const pageNumber = i + 1;
              const currentPage = table.getState().pagination.pageIndex + 1;

              // Show first page, last page, current page, and pages around current page
              if (
                pageNumber === 1 ||
                pageNumber === table.getPageCount() ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => table.setPageIndex(i)}
                    className="h-8 w-8 p-0"
                  >
                    {formatNumber(pageNumber)}
                  </Button>
                );
              }

              // Show ellipsis for gaps
              if (
                pageNumber === currentPage - 2 ||
                pageNumber === currentPage + 2
              ) {
                return (
                  <span
                    key={`ellipsis-${pageNumber}`}
                    className="flex h-8 w-8 items-center justify-center"
                  >
                    <span className="text-muted-foreground">...</span>
                  </span>
                );
              }

              return null;
            })}

            {/* Next Page Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">{t("pagination.nextPage")}</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Last Page Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">{t("pagination.lastPage")}</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <p className="text-sm font-medium">
              {t("pagination.page", {
                current: formatNumber(
                  table.getState().pagination.pageIndex + 1
                ),
                total: formatNumber(table.getPageCount()),
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Client;
