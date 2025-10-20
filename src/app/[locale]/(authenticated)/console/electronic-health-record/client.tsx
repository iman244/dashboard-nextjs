"use client";

import {
  ehr_by_national_number,
  EHR_BY_NATIONAL_NUMBER_KEY,
} from "@/data/electronic health record/api/EHR-by-national-number";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

// Import extracted components and utilities
import { useEHRColumns } from "./_columns";
import { EHRTable } from "./_components/ehr-table";
import { EHRTablePagination } from "./_components/ehr-table-pagination";
import { formatNumber } from "./_utils/format-numbers";

/**
 * Main EHR Client Component
 * Handles data fetching and composes sub-components
 */
const Client = () => {
  const t = useTranslations("EHRTable");
  const locale = useLocale();

  // Data fetching
  const ehrByNationalNumber_q = useQuery({
    queryKey: [EHR_BY_NATIONAL_NUMBER_KEY],
    queryFn: () =>
      ehr_by_national_number({
        params: {
          nationalNumber: "",
          fromDate: "1404/07/20",
          toDate: "1404/07/20",
          patientType: "25",
        },
      }),
  });

  // Column definitions with locale-aware formatting
  const columns = useEHRColumns(locale);

  // Table instance
  const table = useReactTable({
    data: ehrByNationalNumber_q.data || [],
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header with title and refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <Button
          onClick={() => ehrByNationalNumber_q.refetch()}
          variant="outline"
          size="sm"
          disabled={ehrByNationalNumber_q.isFetching}
          className="flex items-center space-x-2 space-x-reverse"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              ehrByNationalNumber_q.isFetching ? "animate-spin" : ""
            }`}
          />
          <span>بروزرسانی</span>
        </Button>
      </div>

      {/* Table with flex-1 to take remaining space */}
      <div className="flex-1">
        <EHRTable
          table={table}
          columns={columns}
          isLoading={ehrByNationalNumber_q.isFetching}
          isError={ehrByNationalNumber_q.isError}
          error={ehrByNationalNumber_q.error}
        />
      </div>

      {/* Pagination */}
      <EHRTablePagination
        table={table}
        formatNumber={(num) => formatNumber(num, locale)}
      />
    </div>
  );
};

export default Client;