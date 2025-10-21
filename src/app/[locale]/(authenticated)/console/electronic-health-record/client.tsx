"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RefreshCw, XIcon } from "lucide-react";

// Import extracted components and utilities
import { useEHRColumns } from "./_columns";
import { EHRTable } from "./_components/ehr-table";
import { EHRTablePagination } from "./_components/ehr-table-pagination";
import { EHRFilter } from "./_components/ehr-filter";
import { EHRDetailModal } from "./_components/ehr-detail-modal";
import { formatNumber } from "./_utils/format-numbers";
import { useElectronicHealthRecord } from "./provider";
import { formatDate } from "./_utils/format-date";
import { Badge } from "@/components/ui/badge";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";

/**
 * Main EHR Client Component
 * Handles data fetching and composes sub-components
 */
const Client = () => {
  const t = useTranslations("EHRTable");
  const locale = useLocale();
  const {
    filters,
    setFilters,
    ehrByNationalNumber_m,
    callMutation,
    selectedRecord,
    setSelectedRecord,
    isDetailModalOpen,
    setIsDetailModalOpen,
  } = useElectronicHealthRecord();

  // Action handlers
  const handleViewDetails = (record: ElectronicHealthRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  // Column definitions with locale-aware formatting
  const columns = useEHRColumns({
    locale,
    onViewDetails: handleViewDetails,
  });

  // Table instance
  const table = useReactTable({
    data: ehrByNationalNumber_m.data || [],
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
      sorting: [
        {
          id: "تاريخ",
          desc: false, // Sort by date in descending order (most recent first)
        },
      ],
    },
  });

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header with title and refresh button */}
      <h2 className="text-2xl font-bold">{t("title")}</h2>

      {/* Filter Section */}

      <div className="flex items-center justify-between">
        <EHRFilter isLoading={ehrByNationalNumber_m.isPending} />
        <Button
          onClick={callMutation}
          variant="outline"
          size="sm"
          disabled={ehrByNationalNumber_m.isPending}
          className="flex items-center space-x-2 space-x-reverse"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              ehrByNationalNumber_m.isPending ? "animate-spin" : ""
            }`}
          />
          <span>بروزرسانی</span>
        </Button>
      </div>

      {(filters.nationalNumber ||
        filters.dateRange?.from ||
        filters.dateRange?.to) && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">فیلترها</span>
          {filters.nationalNumber && (
            <Badge
              variant={"secondary"}
              onClick={() => setFilters({ ...filters, nationalNumber: "" })}
              className="cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
              <span>شماره ملی: {filters.nationalNumber}</span>
            </Badge>
          )}
          {filters.dateRange?.from && filters.dateRange.to && (
            <Badge
              variant={"secondary"}
              onClick={() =>
                setFilters({
                  ...filters,
                  dateRange: { from: undefined, to: undefined },
                })
              }
              className="cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
              <span>بازه تاریخ:</span>
              <span>
                {digitsEnToFa(
                  `${formatDate(
                    filters.dateRange?.from,
                    locale
                  )} - ${formatDate(filters.dateRange?.to, locale)}`
                )}
              </span>
            </Badge>
          )}
        </div>
      )}

      {/* Table with flex-1 to take remaining space */}
      <div className="flex-1">
        <EHRTable
          table={table}
          columns={columns}
          isLoading={ehrByNationalNumber_m.isPending}
          isError={ehrByNationalNumber_m.isError}
          error={ehrByNationalNumber_m.error}
        />
      </div>

      {/* Pagination */}
      <EHRTablePagination
        table={table}
        formatNumber={(num) => formatNumber(num, locale)}
      />

      {/* Detail Modal */}
      <EHRDetailModal
        record={selectedRecord}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRecord(null);
        }}
      />
    </div>
  );
};

export default Client;
