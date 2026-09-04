"use client";

import React from "react";
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
  noDataMessage = "هیچ داده‌ای موجود نیست",
  className = ""
}: DataTableProps<TData, TValue>) => {

  return (
    <div className={`rounded-md border overflow-hidden ${className}`}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead 
                  key={header.id}
                  className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2 space-x-reverse">
                    {header.isPlaceholder
                      ? null
                      : <table.FlexRender header={header} />}
                    {header.column.getCanSort() && (
                      <span className="ml-2 text-muted-foreground">
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
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
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
                {noDataMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
