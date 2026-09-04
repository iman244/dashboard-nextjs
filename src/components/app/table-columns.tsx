"use client";

import React from "react";
import { createColumnHelper, ColumnDef, RowData } from "@tanstack/react-table";
import { formatCellValue } from "@/lib/utils";
import { type AppTableFeatures } from "./table-features";

export const useGenericTableColumns = <TData extends RowData,>(
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
): ColumnDef<AppTableFeatures, TData>[] => {
  const columnHelper = createColumnHelper<AppTableFeatures, TData>();

  return React.useMemo(() => {
    const baseColumns: ColumnDef<AppTableFeatures, TData>[] = config.columns.map((col) => {
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

      return columnHelper.columns([...baseColumns, actionsColumn]);
    }

    return columnHelper.columns(baseColumns);
  }, [config.columns, config.locale, config.actions, columnHelper]);
};
