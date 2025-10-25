"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Table as TanStackTable } from "@tanstack/react-table";

interface TablePaginationProps<TData> {
  table: TanStackTable<TData>;
  formatNumber: (num: number) => string;
  pageIncrement?: number;
  showPageSizeSelector?: boolean;
  translations?: {
    showing?: string;
    rowsPerPage?: string;
    firstPage?: string;
    previousPage?: string;
    nextPage?: string;
    lastPage?: string;
    page?: string;
  };
}

/**
 * Generic table pagination component with RTL support
 * Based on EHRTablePagination but made generic for any data type
 */
export const TablePagination = <TData,>({
  table,
  formatNumber,
  pageIncrement = 10,
  showPageSizeSelector = true,
  translations = {},
}: TablePaginationProps<TData>) => {
  const defaultTranslations = {
    showing: "نمایش {start} تا {end} از {total} رکورد",
    rowsPerPage: "تعداد رکورد در صفحه",
    firstPage: "صفحه اول",
    previousPage: "صفحه قبلی",
    nextPage: "صفحه بعدی",
    lastPage: "صفحه آخر",
    page: "صفحه {current} از {total}",
  };

  const t = { ...defaultTranslations, ...translations };

  const formatShowingText = (start: number, end: number, total: number) => {
    return t.showing
      .replace("{start}", formatNumber(start))
      .replace("{end}", formatNumber(end))
      .replace("{total}", formatNumber(total));
  };

  const formatPageText = (current: number, total: number) => {
    return t.page
      .replace("{current}", formatNumber(current))
      .replace("{total}", formatNumber(total));
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2 space-x-reverse">
        <p className="text-sm text-muted-foreground">
          {formatShowingText(
            table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1,
            Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            ),
            table.getFilteredRowModel().rows.length
          )}
        </p>
      </div>

      <div className="flex items-center space-x-4 space-x-reverse">
        {showPageSizeSelector && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <p className="text-sm font-medium">{t.rowsPerPage}</p>
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
                {Array.from(
                  { length: 5 },
                  (_, i) => (i + 1) * pageIncrement
                ).map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {formatNumber(pageSize)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
            <span className="sr-only">{t.firstPage}</span>
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
            <span className="sr-only">{t.previousPage}</span>
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
            <span className="sr-only">{t.nextPage}</span>
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
            <span className="sr-only">{t.lastPage}</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <p className="text-sm font-medium">
            {formatPageText(
              table.getState().pagination.pageIndex + 1,
              table.getPageCount()
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
