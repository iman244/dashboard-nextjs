"use client";

import React from "react";
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { formatCellValue } from "@/lib/utils";

export const useGenericTableColumns = <TData,>(
  config: {
    columns: Array<{
      key: keyof TData;
      header: string;
      cell?: (value: unknown, row: TData, locale: string) => React.ReactNode;
      enableSorting?: boolean;
      width?: string;
    }>;
    locale: string;
    actions?: {
      header: string;
      cell: (row: TData) => React.ReactNode;
    };
  }
): ColumnDef<TData>[] => {
  const columnHelper = createColumnHelper<TData>();

  return React.useMemo(() => {
    const baseColumns: ColumnDef<TData>[] = config.columns.map((col) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const columnDef = columnHelper.accessor(col.key as any, {
        header: col.header,
        enableSorting: col.enableSorting ?? true,
        cell: col.cell 
          ? (info) => col.cell!(info.getValue(), info.row.original, config.locale)
          : (info) => formatCellValue(String(info.getValue()), config.locale),
      });

      if (col.width) {
        Object.assign(columnDef, { size: col.width });
      }

      return columnDef;
    });

    // Add actions column if provided
    if (config.actions) {
      const actionsColumn = columnHelper.display({
        id: "actions",
        header: config.actions.header,
        cell: ({ row }) => config.actions!.cell(row.original),
      });

      return [...baseColumns, actionsColumn];
    }

    return baseColumns;
  }, [config.columns, config.locale, config.actions, columnHelper]);
};
