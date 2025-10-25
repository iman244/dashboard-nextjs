"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { DataTable, TablePagination } from "@/components/app";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, XIcon, Search } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ServiceRecordsTable } from "./service-records-table";
import { formatNumber, localeDigits } from "@/lib/utils";
import { useLocale } from "next-intl";

interface ServiceCountTableProps {
  data: ElectronicHealthRecord[];
}

interface ServiceCountData {
  serviceName: string;
  totalTests: number;
  normalResults: number;
  abnormalResults: number;
}

const columnHelper = createColumnHelper<ServiceCountData>();

export const ServiceCountTable: React.FC<ServiceCountTableProps> = ({
  data,
}) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const locale = useLocale();

  // Process data to create aggregated service counts
  const aggregatedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Helper function to check if a value is within normal range
    const isWithinNormalRange = (
      value: string,
      normalRange: string
    ): boolean => {
      if (!value || !normalRange) return false;

      // Parse normal range (e.g., "0.2-1.2")
      const rangeMatch = normalRange.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
      if (!rangeMatch) return false;

      const minValue = parseFloat(rangeMatch[1]);
      const maxValue = parseFloat(rangeMatch[2]);
      const testValue = parseFloat(value);

      return testValue >= minValue && testValue <= maxValue;
    };

    // Helper function to check if a value is empty/null/blank
    const isEmpty = (value: string | undefined | null): boolean => {
      return !value || value.trim() === "";
    };

    // Filter valid data
    const validData = data.filter((record) => {
      const testResult = record["جواب"];
      const normalRange = record["نرمال رنج"];
      return !isEmpty(testResult) && !isEmpty(normalRange);
    });

    // Group by service name and count results
    const serviceGroups = validData.reduce((acc, record) => {
      const serviceName = record["نام خدمت"];
      const testResult = record["جواب"];
      const normalRange = record["نرمال رنج"];

      if (!serviceName) return acc;

      if (!acc[serviceName]) {
        acc[serviceName] = {
          normalCount: 0,
          abnormalCount: 0,
          totalCount: 0,
        };
      }

      acc[serviceName].totalCount++;

      if (isWithinNormalRange(testResult || "", normalRange || "")) {
        acc[serviceName].normalCount++;
      } else {
        acc[serviceName].abnormalCount++;
      }

      return acc;
    }, {} as Record<string, { normalCount: number; abnormalCount: number; totalCount: number }>);

    // Convert to array format for table
    return Object.entries(serviceGroups).map(([serviceName, counts]) => ({
      serviceName,
      totalTests: counts.totalCount,
      normalResults: counts.normalCount,
      abnormalResults: counts.abnormalCount,
    }));
  }, [data]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("serviceName", {
        header: "نام خدمت",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor((row) => row.totalTests, {
        id: "totalTests",
        header: "کل آزمایش‌ها",
        cell: (info) => (
          <span>{localeDigits(info.getValue().toString(), "fa")}</span>
        ),
      }),
      columnHelper.accessor((row) => row.normalResults, {
        id: "normalResults",
        header: "تعداد جواب‌های طبیعی",
        cell: (info) => (
          <span>{localeDigits(info.getValue().toString(), "fa")}</span>
        ),
      }),
      columnHelper.accessor((row) => row.abnormalResults, {
        id: "abnormalResults",
        header: "تعداد جواب‌های غیرطبیعی",
        cell: (info) => (
          <span>{localeDigits(info.getValue().toString(), "fa")}</span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "عملیات",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedService(info.row.original.serviceName);
                setIsSheetOpen(true);
              }}
              title="مشاهده گزارش"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        ),
      }),
    ],
    []
  );

  console.log({ aggregatedData });

  const table = useReactTable({
    data: aggregatedData,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, value) => {
      const serviceName = row.getValue("serviceName") as string;
      return serviceName.toLowerCase().includes(value.toLowerCase());
    },
    state: {
      globalFilter: searchTerm,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (aggregatedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        هیچ خدمتی یافت نشد
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Search Input */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجو در نام خدمت..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          {searchTerm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="h-10"
            >
              پاک کردن
            </Button>
          )}
        </div>

        <DataTable<ServiceCountData, any> table={table} columns={columns} />
        <TablePagination
          table={table}
          formatNumber={(num: number) => formatNumber(num, locale)}
        />
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="max-h-[100dvh]">
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle>گزارش رکوردهای خدمت: {selectedService}</SheetTitle>
            <SheetClose>
              <XIcon className="h-4 w-4" />
            </SheetClose>
          </SheetHeader>
          {selectedService && (
            <div className="p-4">
              <ServiceRecordsTable
                data={data}
                selectedService={selectedService}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
