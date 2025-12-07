"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SBHM_RetrieveSerializer } from "@/data/saderat-bank-health-monitoring/types";
import { cn, localeDigits } from "@/lib/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useLocale } from "next-intl";
import React from "react";
import { TablePagination } from "./table-pagination";
import { useMonitoringIdRouteContext } from "./route-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileSearchCorner } from "lucide-react";

const columnHelper =
  createColumnHelper<SBHM_RetrieveSerializer["json"][number]>();

const MonitoringPage = (
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring/[id]">
) => {
  const { id: monitoring_id } = React.use(props.params);
  const locale = useLocale();
  const isRtl = locale === "fa";
  const { monitoring_query } = useMonitoringIdRouteContext();

  const { data, isPending, error } = monitoring_query;

  const table = useReactTable({
    columns: [
      columnHelper.accessor("نام", {
        header: "نام",
        cell: (info) => `${info.getValue()}`,
      }),
      columnHelper.accessor("نام خانوادگی", {
        header: "نام خانوادگی",
        cell: (info) => `${info.getValue()}`,
      }),
      columnHelper.accessor((row) => row["personel.کد ملی"], {
        id: "personel.کد ملی",
        header: "کد ملی",
        cell: (info) => {
          const value = String(info.getValue() || "");
          return localeDigits(value, locale);
        },
      }),
      columnHelper.display({
        header: "عملیات",
        cell: ({ row }) => (
          <Button variant={"ghost"} asChild>
            <Link href={`/console/saderat-bank-health-monitoring/${monitoring_id}/${row.original["personel.کد ملی"]}`}>
              <FileSearchCorner />
            </Link>
          </Button>
        ),
      }),
    ],
    data: data?.json || [],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    // state: {
    //     columnFilters,
    //   },
  });

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No Data</div>;

  return (
    <div className="space-y-4">
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(isRtl ? "text-right" : "text-left")}
                  >
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TablePagination table={table} />
    </div>
  );
};

export default MonitoringPage;
