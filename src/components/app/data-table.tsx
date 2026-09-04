"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReactTable, ColumnDef, RowData } from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { AppTableFeatures } from "./table-features";

interface DataTableProps<TData extends RowData, TValue> {
  table: ReactTable<AppTableFeatures, TData>;
  columns: ColumnDef<AppTableFeatures, TData, TValue>[];
  noDataMessage?: string;
  className?: string;
}

/**
 * Generic data table component with sorting capabilities
 * Similar to EHRTable but without loading/error states
 */
export const DataTable = <TData extends RowData, TValue = unknown>({ 
  table, 
  columns, 
  noDataMessage,
  className = ""
}: DataTableProps<TData, TValue>) => {
  const t = useTranslations("common.Dictionary");
  const emptyMessage = noDataMessage ?? t("NoResults");

  return (
    // overflow-x-auto per ux-guidelines #71: a wide table must scroll inside its
    // own container rather than break the page layout on narrow viewports.
    <div className={`rounded-xl border border-border bg-card ${className}`}>
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
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="border-border">
                {row.getAllCells().map((cell) => (
                  // tabular-nums so Persian digits align vertically down a
                  // column; proportional figures make a column of lab values
                  // impossible to scan for outliers.
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
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};
