"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePatientReports } from "./provider";
import { PatientReportsForm } from "./_form/patient-reports-form";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatDate, formatNumber, localeDigits } from "@/lib/utils";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import { appTableFeatures, type AppTableFeatures } from "@/components/app/table-features";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { DataTable } from "@/components/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, XIcon, ChartArea } from "lucide-react";
import { TablePagination } from "@/components/app/table-pagination";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Line, XAxis, YAxis, CartesianGrid, ReferenceArea, ComposedChart } from "recharts";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import { format, newDate } from "date-fns-jalali";
import { CHART_TICK_FONT_SIZE } from "@/lib/chart";

interface ServiceCountData {
  serviceName: string;
  /** How many times the patient received this service in the period. */
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
  locale: string,
  noResultLabel: string
) =>
  resultCount > 0 ? (
    <span>{localeDigits(value.toString(), locale)}</span>
  ) : (
    <span className="text-muted-foreground" aria-label={noResultLabel}>
      &mdash;
    </span>
  );

const columnHelper = createColumnHelper<AppTableFeatures, ServiceCountData>();

// Chart configuration for service trend
const serviceTrendChartConfig: ChartConfig = {
  testValue: {
    label: "مقدار آزمایش",
    color: "#2563eb", // Blue for test values
  },
  normalRangeMin: {
    label: "حد پایین نرمال",
    color: "#16a34a", // Green for normal range
  },
  normalRangeMax: {
    label: "حد بالای نرمال",
    color: "#16a34a", // Green for normal range
  },
  normalArea: {
    label: "محدوده طبیعی",
    color: "#16a34a", // Green for normal area
  },
  abnormalArea: {
    label: "محدوده غیرطبیعی",
    color: "#dc2626", // Red for abnormal area
  },
};

// Service Details Table Component for the sheet
export const ServiceDetailsTable: React.FC<{
  data: ElectronicHealthRecord[];
  selectedService: string;
}> = ({ data, selectedService }) => {
  const locale = useLocale();
  const tDictionary = useTranslations("common.dictionary");

  const detailsColumnHelper = createColumnHelper<AppTableFeatures, ElectronicHealthRecord>();

  const columns = React.useMemo(
    () => detailsColumnHelper.columns([
      detailsColumnHelper.accessor("تاريخ", {
        header: tDictionary("date"),
        cell: (info) => <span>{localeDigits(info.getValue(), locale)}</span>,
      }),
      detailsColumnHelper.accessor("نرمال رنج", {
        header: tDictionary("normalRange"),
        cell: (info) => (
          <span>{localeDigits(info.getValue()?.toString() || "", locale)}</span>
        ),
      }),
      detailsColumnHelper.accessor("جواب", {
        header: tDictionary("answer"),
        cell: (info) => (
          <span>{localeDigits(info.getValue()?.toString() || "", locale)}</span>
        ),
      }),
    ]),
    [tDictionary, locale, detailsColumnHelper]
  );

  // Filter records by selected service
  const filteredRecords = React.useMemo(() => {
    if (!selectedService || !data) return [];
    return data.filter((record) => record["نام خدمت"] === selectedService);
  }, [data, selectedService]);

  // Process chart data for line chart
  const chartData = React.useMemo(() => {
    if (!filteredRecords || filteredRecords.length === 0) return [];

    return filteredRecords
      .filter((record) => {
        const testResult = record["جواب"];
        const normalRange = record["نرمال رنج"];
        const date = record["تاريخ"];
        return testResult && normalRange && date;
      })
      .map((record) => {
        const testResult = parseFloat(record["جواب"] || "0");
        const normalRange = record["نرمال رنج"] || "";
        const date = record["تاريخ"] || "";

        // Parse normal range (e.g., "0.2-1.2")
        const rangeMatch = normalRange.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
        const normalRangeMin = rangeMatch ? parseFloat(rangeMatch[1]) : 0;
        const normalRangeMax = rangeMatch ? parseFloat(rangeMatch[2]) : 0;

        // Parse Jalali date string (yyyy/MM/dd)
        const [year, month, day] = date.split("/").map(Number);
        const dateObj = newDate(year, month - 1, day);

        return {
          date,
          formattedDate: format(dateObj, "yyyy/MM/dd"),
          testValue: testResult,
          normalRangeMin,
          normalRangeMax,
          timestamp: dateObj.getTime(),
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredRecords]);

  const table = useTable({
    features: appTableFeatures,
    data: filteredRecords,
    columns: columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 5,
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Line Chart */}
      {chartData.length > 0 && (
        <div className="space-y-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold">
            روند نتایج آزمایش در طول زمان
          </h3>
          <ChartContainer
            config={serviceTrendChartConfig}
            className="w-full max-w-[500px] h-64"
          >
            <ComposedChart
              data={chartData}
              margin={{
                left: -30,
                right: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="formattedDate"
                tickFormatter={(value) => digitsEnToFa(value)}
                textAnchor="middle"
                fontSize={CHART_TICK_FONT_SIZE}
                tickMargin={12}
              />
              <YAxis
                tickFormatter={(value) => digitsEnToFa(String(value ?? ""))}
                fontSize={CHART_TICK_FONT_SIZE}
                tickMargin={24}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => (
                      <span className="font-medium">
                        تاریخ: {digitsEnToFa(value as string)}
                      </span>
                    )}
                    formatter={(value, name) => {
                      const label =
                        name === "testValue"
                          ? "مقدار آزمایش"
                          : name === "normalRangeMin"
                          ? "حد پایین نرمال"
                          : "حد بالای نرمال";
                      return [digitsEnToFa(String(value ?? "")), " ", label];
                    }}
                  />
                }
              />
              {/* Test values line */}
              <Line
                type="monotone"
                dataKey="testValue"
                stroke="var(--color-testValue)"
                strokeWidth={3}
                dot={{ fill: "var(--color-testValue)", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
              {/* Normal range lines */}
              <Line
                type="monotone"
                dataKey="normalRangeMin"
                stroke="var(--color-normalRangeMin)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="normalRangeMax"
                stroke="var(--color-normalRangeMax)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              {/* Reference areas for visual indication */}
              {chartData.length > 0 && (
                <>
                  {/* Green area for normal range */}
                  <ReferenceArea
                    y1={chartData[0]?.normalRangeMin}
                    y2={chartData[0]?.normalRangeMax}
                    fill="rgba(22, 163, 74, 0.1)"
                    stroke="none"
                  />
                </>
              )}
            </ComposedChart>
          </ChartContainer>
        </div>
      )}

      {/* Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">جزئیات رکوردها</h3>
        <DataTable<ElectronicHealthRecord, string>
          table={table}
          columns={columns}
          className="text-xs"
        />
        <TablePagination
          table={table}
          showPageSizeSelector={false}
        />
      </div>
    </div>
  );
};

const Client = (props: {
  initialValues: {
    nationalNumber: string;
    fromDate: string;
    toDate: string;
    patientType: string;
  };
}) => {
  const t = useTranslations("/console/patient-reports.PatientReports");
  const tData = useTranslations("common.data");
  const tDictionary = useTranslations("common.Dictionary");
  const { ehrByNationalNumber_m, filters } = usePatientReports();
  const { data, isPending } = ehrByNationalNumber_m;
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedService, setSelectedService] = React.useState<string | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  // Process data to create aggregated service counts.
  //
  // Every service the patient received belongs in this table, not just the lab
  // tests. The endpoint returns one row per delivered service, and only lab
  // work carries جواب (result) + نرمال رنج (reference range) — a visit, an
  // ECG or an ultrasound has neither. Grouping only the records that had both
  // meant a patient whose period contained no lab work saw "no data found"
  // under a header naming them, while the API had in fact returned their
  // services. So group everything, and classify normal/abnormal over the
  // subset that can actually be classified.
  const aggregatedData = React.useMemo(() => {
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

  const columns = React.useMemo(
    () => columnHelper.columns([
      columnHelper.accessor("serviceName", {
        header: tData("serviceName"),
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor((row) => row.serviceCount, {
        id: "serviceCount",
        header: t("columnServiceCount"),
        cell: (info) => (
          <span>{localeDigits(info.getValue().toString(), locale)}</span>
        ),
      }),
      columnHelper.accessor((row) => row.normalResults, {
        id: "normalResults",
        header: t("columnNormalResults"),
        cell: (info) =>
          renderResultCount(
            info.getValue(),
            info.row.original.resultCount,
            locale,
            t("noLabResult")
          ),
      }),
      columnHelper.accessor((row) => row.abnormalResults, {
        id: "abnormalResults",
        header: t("columnAbnormalResults"),
        cell: (info) =>
          renderResultCount(
            info.getValue(),
            info.row.original.resultCount,
            locale,
            t("noLabResult")
          ),
      }),
      columnHelper.display({
        id: "actions",
        header: t("columnActions"),
        // Nothing to plot for a service with no measured results, so the row
        // gets no button rather than one that opens an empty chart.
        cell: (info) =>
          info.row.original.resultCount > 0 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedService(info.row.original.serviceName);
                  setIsSheetOpen(true);
                }}
                aria-label={t("viewServiceChart")}
              >
                <ChartArea className="h-4 w-4" />
              </Button>
            </div>
          ) : null,
      }),
    ]),
    [t, tData, locale]
  );

  const table = useTable({
    features: appTableFeatures,
    data: aggregatedData,
    columns,
    globalFilterFn: (row, columnId, value) => {
      const serviceName = row.getValue("serviceName") as string;
      return serviceName.toLowerCase().includes(value.toLowerCase());
    },
    state: {
      globalFilter: searchTerm,
    },
    onGlobalFilterChange: setSearchTerm,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="flex items-center flex-col gap-2">
          <Spinner />
          <span className="text-muted-foreground">{t("loadingMessage")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <PatientReportsForm
          initialValues={props.initialValues}
          compact={!!data}
        />
      </div>

      {data && (
        <div className="flex flex-col gap-2">
          <div>
            {filters.dateRange?.from && filters.dateRange.to && (
              <div className="flex flex-col gap-2 items-center justify-center">
                {data.length > 0 && (
                  <h2 className="text-xl font-semibold text-primary">
                    {data[0]["نام بيمار"]} {data[0]["نام خانوادگي بيمار"]}
                  </h2>
                )}
                <p className="text-muted-foreground">
                  {localeDigits(
                    formatDate(filters.dateRange?.from, locale),
                    locale
                  )}{" "}
                  -{" "}
                  {localeDigits(
                    formatDate(filters.dateRange?.to, locale),
                    locale
                  )}
                </p>
                {filters.nationalNumber && (
                  <p className="text-muted-foreground">
                    شماره ملی: {localeDigits(filters.nationalNumber, locale)}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="col-span-2">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="جستجو در نام خدمت..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                        }}
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

                  <DataTable
                    table={table}
                    columns={columns}
                  />
                  <TablePagination
                    table={table}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="max-h-[100dvh]">
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle>گزارش رکوردهای خدمت: {selectedService}</SheetTitle>
            <SheetClose aria-label={tDictionary("Close")}>
              <XIcon className="h-4 w-4" />
            </SheetClose>
          </SheetHeader>
          {selectedService && data && (
            <div className="p-4">
              <ServiceDetailsTable
                data={data}
                selectedService={selectedService}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Client;
