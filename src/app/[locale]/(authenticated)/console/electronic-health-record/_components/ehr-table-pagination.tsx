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
import { useTranslations } from "next-intl";
import { Table as TanStackTable } from "@tanstack/react-table";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";

interface EHRTablePaginationProps {
  table: TanStackTable<ElectronicHealthRecord>;
  formatNumber: (num: number) => string;
  pageIncrement?: number;
  showPageSizeSelector?: boolean;
}

/**
 * EHR Table pagination component with RTL support
 */
export const EHRTablePagination = ({
  table,
  formatNumber,
  pageIncrement = 10,
  showPageSizeSelector = true,
}: EHRTablePaginationProps) => {
  const t = useTranslations("EHRTable");

  return (
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
        {showPageSizeSelector && (
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
              current: formatNumber(table.getState().pagination.pageIndex + 1),
              total: formatNumber(table.getPageCount()),
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
