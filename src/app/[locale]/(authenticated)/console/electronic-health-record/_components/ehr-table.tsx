import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReactTable, ColumnDef } from "@tanstack/react-table";
import { type AppTableFeatures } from "@/components/app/table-features";
import { useTranslations } from "next-intl";
import { LoadingSkeleton } from "./loading-skeleton";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import React from "react";

interface EHRTableProps {
  table: ReactTable<AppTableFeatures, ElectronicHealthRecord>;
  columns: ColumnDef<AppTableFeatures, ElectronicHealthRecord>[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
}

/**
 * EHR Table component with loading, error, and data states
 */
export const EHRTable = ({ table, columns, isLoading, isError, error }: EHRTableProps) => {
  const t = useTranslations("/console/electronic-health-record.EHRTable");

  return (
    // aria-busy per ux-guidelines #78, overflow-x-auto per #71.
    <div
      className="rounded-xl border border-border bg-card"
      aria-busy={isLoading || undefined}
    >
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`h-10 text-xs font-medium tracking-wide text-muted-foreground ${
                    header.column.getCanSort() ? "cursor-pointer select-none" : ""
                  }`}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {header.isPlaceholder
                      ? null
                      : <table.FlexRender header={header} />}
                    {header.column.getCanSort() && (
                      <span className="ms-2 text-muted-foreground">
                        {{
                          asc: <ArrowUp className="h-3 w-3" />,
                          desc: <ArrowDown className="h-3 w-3" />,
                        }[header.column.getIsSorted() as string] ?? (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton columnCount={columns.length} />
          ) : isError ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {/* text-destructive rather than a hardcoded text-red-500, so the
                    error tracks the theme in both light and dark. */}
                <span className="text-destructive">
                  خطا در بارگذاری داده‌ها: {error?.message}
                </span>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="border-border">
                {row.getAllCells().map((cell) => (
                  // tabular-nums so Persian digits align down the column.
                  <TableCell key={cell.id} className="py-3 tabular-nums">
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {t("pagination.noData")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};
