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
import { useLocale, useTranslations } from "next-intl";
import { ReactTable, RowData } from "@tanstack/react-table";
import { localeDigits } from "@/lib/utils";
import { type AppTableFeatures } from "./table-features";

interface TablePaginationProps<T extends RowData> {
  table: ReactTable<AppTableFeatures, T>;
  pageIncrement?: number;
  showPageSizeSelector?: boolean;
}

export const TablePagination = <T extends RowData,>({
  table,
  pageIncrement = 10,
  showPageSizeSelector = true,
}: TablePaginationProps<T>) => {
  const t = useTranslations("common.Dictionary");
  const locale = useLocale();
  // Pagination arrows must follow reading direction: "first page" points
  // toward the start of the text flow, which is right in RTL and left in LTR.
  const isRtl = locale === "fa";
  const FirstIcon = isRtl ? ChevronsRight : ChevronsLeft;
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const LastIcon = isRtl ? ChevronsLeft : ChevronsRight;
  return (
    // flex-wrap: at narrow widths the row's two halves together exceed the
    // container and used to push past it. Wrapping costs nothing wherever they
    // already fit.
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {t("Showing", {
            start: localeDigits(
              table.state.pagination.pageIndex *
                table.state.pagination.pageSize +
                1,
              locale
            ),
            end: localeDigits(
              Math.min(
                (table.state.pagination.pageIndex + 1) *
                  table.state.pagination.pageSize,
                table.getFilteredRowModel().rows.length
              ),
              locale
            ),
            total: localeDigits(
              table.getFilteredRowModel().rows.length,
              locale
            ),
          })}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{t("Rows per page")}</p>
            <Select
              value={`${table.state.pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={localeDigits(
                    table.state.pagination.pageSize,
                    locale
                  )}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {Array.from(
                  { length: 5 },
                  (_, i) => (i + 1) * pageIncrement
                ).map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {localeDigits(pageSize, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Custom RTL Pagination */}
        <div className="flex items-center gap-1">
          {/* First Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">{t("First page")}</span>
            <FirstIcon className="h-4 w-4" />
          </Button>

          {/* Previous Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">{t("Previous page")}</span>
            <PrevIcon className="h-4 w-4" />
          </Button>

          {/* Page Numbers */}
          {Array.from({ length: table.getPageCount() }, (_, i) => {
            const pageNumber = i + 1;
            const currentPage = table.state.pagination.pageIndex + 1;

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
                  {localeDigits(pageNumber, locale)}
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
            <span className="sr-only">{t("Next page")}</span>
            <NextIcon className="h-4 w-4" />
          </Button>

          {/* Last Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">{t("Last page")}</span>
            <LastIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">
            {t("Page", {
              current: localeDigits(
                table.state.pagination.pageIndex + 1,
                locale
              ),
              total: localeDigits(table.getPageCount(), locale),
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
