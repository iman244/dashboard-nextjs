"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { DataTable, TablePagination } from "@/components/app";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import { appTableFeatures, type AppTableFeatures } from "@/components/app/table-features";
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
import { useLocale, useTranslations } from "next-intl";

interface ServiceCountTableProps {
  data: ElectronicHealthRecord[];
}

interface ServiceCountData {
  serviceName: string;
  /** How many times this service was delivered in the period. */
  serviceCount: number;
  normalResults: number;
  abnormalResults: number;
  /**
   * Records for this service that carried both a result and a reference range.
   * Zero for services that are not lab tests (visits, imaging, ECG); those rows
   * still belong in the report, they just have nothing to classify.
   */
  resultCount: number;
}

/**
 * A normal/abnormal count only means something for a service that produced lab
 * results. Printing "۰" for an ultrasound or a visit would read as "nothing
 * abnormal" when in truth nothing was measured, so those cells get an em dash.
 */
const renderResultCount = (
  value: number,
  resultCount: number,
  noResultLabel: string
) =>
  resultCount > 0 ? (
    <span>{localeDigits(value.toString(), "fa")}</span>
  ) : (
    <span className="text-muted-foreground" aria-label={noResultLabel}>
      &mdash;
    </span>
  );

const columnHelper = createColumnHelper<AppTableFeatures, ServiceCountData>();

export const ServiceCountTable: React.FC<ServiceCountTableProps> = ({
  data,
}) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const locale = useLocale();
  const tSCT = useTranslations("/console/periodical-reports.ServiceCountTable");
  const tDictionary = useTranslations("common.Dictionary");

  // Process data to create aggregated service counts.
  //
  // Every service delivered belongs in this table, not just the lab tests. The
  // EHR endpoint returns one row per delivered service, and only lab work
  // carries جواب (result) + نرمال رنج (reference range) — a visit, an ECG
  // or an ultrasound has neither. Grouping only the records that had both hid
  // every non-lab service, and showed "no service found" for a period whose
  // records were real but contained no lab work.
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

    // Group by service name, counting every record and classifying the ones
    // that carry a result against their reference range.
    const serviceGroups = data.reduce((acc, record) => {
      const serviceName = record["نام خدمت"];
      const testResult = record["جواب"];
      const normalRange = record["نرمال رنج"];

      if (!serviceName) return acc;

      if (!acc[serviceName]) {
        acc[serviceName] = {
          normalCount: 0,
          abnormalCount: 0,
          resultCount: 0,
          totalCount: 0,
        };
      }

      acc[serviceName].totalCount++;

      if (isEmpty(testResult) || isEmpty(normalRange)) return acc;

      acc[serviceName].resultCount++;

      if (isWithinNormalRange(testResult || "", normalRange || "")) {
        acc[serviceName].normalCount++;
      } else {
        acc[serviceName].abnormalCount++;
      }

      return acc;
    }, {} as Record<string, { normalCount: number; abnormalCount: number; resultCount: number; totalCount: number }>);

    // Convert to array format for table
    return Object.entries(serviceGroups).map(([serviceName, counts]) => ({
      serviceName,
      serviceCount: counts.totalCount,
      normalResults: counts.normalCount,
      abnormalResults: counts.abnormalCount,
      resultCount: counts.resultCount,
    }));
  }, [data]);

  const columns = useMemo(
    () => columnHelper.columns([
      columnHelper.accessor("serviceName", {
        header: tSCT("columnServiceName"),
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor((row) => row.serviceCount, {
        id: "serviceCount",
        header: tSCT("columnServiceCount"),
        cell: (info) => (
          <span>{localeDigits(info.getValue().toString(), "fa")}</span>
        ),
      }),
      columnHelper.accessor((row) => row.normalResults, {
        id: "normalResults",
        header: tSCT("columnNormalResults"),
        cell: (info) =>
          renderResultCount(
            info.getValue(),
            info.row.original.resultCount,
            tSCT("noLabResult")
          ),
      }),
      columnHelper.accessor((row) => row.abnormalResults, {
        id: "abnormalResults",
        header: tSCT("columnAbnormalResults"),
        cell: (info) =>
          renderResultCount(
            info.getValue(),
            info.row.original.resultCount,
            tSCT("noLabResult")
          ),
      }),
      columnHelper.display({
        id: "actions",
        header: tSCT("columnActions"),
        // The sheet lists this service's individual records, which every
        // service has — unlike the patient report's chart, it stays available
        // for services with no measured result.
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedService(info.row.original.serviceName);
                setIsSheetOpen(true);
              }}
              aria-label={tSCT("viewServiceRecords")}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        ),
      }),
    ]),
    [tSCT]
  );

  const table = useTable({
    features: appTableFeatures,
    data: aggregatedData,
    columns: columns,
    globalFilterFn: (row, columnId, value) => {
      const serviceName = row.getValue("serviceName") as string;
      return serviceName.toLowerCase().includes(value.toLowerCase());
    },
    state: {
      globalFilter: searchTerm,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
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
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجو در نام خدمت..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pe-10"
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
        />
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="max-h-[100dvh]">
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle>گزارش رکوردهای خدمت: {selectedService}</SheetTitle>
            <SheetClose aria-label={tDictionary("Close")}>
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
