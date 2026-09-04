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
    <div className="rounded-md border overflow-hidden">
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
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-red-500"
              >
                خطا در بارگذاری داده‌ها:{" "}
                {error?.message}
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
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
                {t("pagination.noData")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
