"use client";

import React from "react";
import { useMonitoringIdRouteContext } from "../route-context";
import { useEHRByNationalNumberApi } from "@/data/electronic health record/api/EHR-by-national-number";
import { digitsFaToEn } from "@persian-tools/persian-tools";
import { PatientType } from "@/components/app/patient-type-selector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
  ReferenceArea,
} from "recharts";
import { format, newDate } from "date-fns-jalali";
import { formatCellValue } from "@/lib/utils";
import { useLocale } from "next-intl";
import {
  Activity,
  Heart,
  Droplet,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  FileText,
  Brain,
} from "lucide-react";

type LabRecord = {
  PatientType: string;
  "كد مكان": number;
  مكان: string;
  "كد استعلام": number;
  "شماره پرونده": string;
  "كد پذيرش": string;
  "كد بيمار": number;
  تاريخ: string;
  "نام بيمار": string;
  "نام خانوادگي بيمار": string;
  كدملي: string;
  سن: number;
  "نوع سن": string;
  "كد خدمت": string;
  "نام خدمت": string;
  جواب: string;
  "نرمال رنج": string | null;
  "كد ملي خدمت": string;
  "كد پزشك معالج": string;
  "نام پزشك معالج": string;
  "نظام پزشكي معالج": string;
  ReceptionServiceID: number;
};

type MonitoringData = {
  [key: string]: string | number | null;
};

const getStatusColor = (
  value: string | number | null
): "default" | "secondary" | "destructive" | "outline" => {
  if (value === null || value === undefined) return "secondary";
  const str = String(value).toLowerCase();
  if (str === "طبیعی" || str === "normal") return "default";
  if (str === "بالا" || str === "high" || str.includes("abnormal"))
    return "destructive";
  if (str === "پایین" || str === "low") return "destructive";
  return "secondary";
};

const getStatusIcon = (value: string | number | null) => {
  if (value === null || value === undefined) return null;
  const str = String(value).toLowerCase();
  if (str === "طبیعی" || str === "normal") {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  if (str === "بالا" || str === "high" || str.includes("abnormal")) {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
  return null;
};

const PersonMonitoringPage = (
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring/[id]/[national_id]">
) => {
  const { national_id } = React.use(props.params);
  const { monitoring_query } = useMonitoringIdRouteContext();
  const { data, isPending, error } = monitoring_query;
  const locale = useLocale();
  const today = new Date().toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const ehr_query = useEHRByNationalNumberApi({
    input: {
      params: {
        nationalNumber: national_id,
        fromDate: "1403/01/01",
        toDate: digitsFaToEn(today),
        patientType: PatientType.LAB,
      },
    },
  });

  const person_data = React.useMemo(() => {
    return data?.json.find(
      (item) => item["personel.کد ملی"] === parseInt(national_id)
    ) as MonitoringData | undefined;
  }, [data, national_id]);

  const labData = React.useMemo(() => {
    return (ehr_query.data as LabRecord[]) || [];
  }, [ehr_query.data]);

  // Group lab data by test name and prepare for charts
  const groupedLabData = React.useMemo(() => {
    const grouped: Record<string, LabRecord[]> = {};
    labData.forEach((record) => {
      const testName = record["نام خدمت"];
      if (!grouped[testName]) {
        grouped[testName] = [];
      }
      grouped[testName].push(record);
    });
    return grouped;
  }, [labData]);

  // Prepare chart data for key tests
  const chartData = React.useMemo(() => {
    const keyTests = ["Hb", "Hct", "W.B.C", "R.B.C", "Platelets"];
    const charts: Record<
      string,
      Array<{
        date: string;
        formattedDate: string;
        value: number;
        min: number;
        max: number;
        timestamp: number;
      }>
    > = {};

    keyTests.forEach((testName) => {
      const records = groupedLabData[testName] || [];
      const chartPoints = records
        .filter((r) => {
          const value = parseFloat(r["جواب"] || "0");
          const range = r["نرمال رنج"];
          return !isNaN(value) && value > 0 && range;
        })
        .map((r) => {
          const value = parseFloat(r["جواب"]);
          const range = r["نرمال رنج"] || "";
          const date = r["تاريخ"] || "";

          const rangeMatch = range.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
          const min = rangeMatch ? parseFloat(rangeMatch[1]) : 0;
          const max = rangeMatch ? parseFloat(rangeMatch[2]) : 0;

          const [year, month, day] = date.split("/").map(Number);
          const dateObj = newDate(year, month - 1, day);

          return {
            date,
            formattedDate: format(dateObj, "yyyy/MM/dd"),
            value,
            min,
            max,
            timestamp: dateObj.getTime(),
          };
        })
        .sort((a, b) => a.timestamp - b.timestamp);

      if (chartPoints.length > 0) {
        charts[testName] = chartPoints;
      }
    });

    return charts;
  }, [groupedLabData]);

  // Get latest lab values
  const latestLabValues = React.useMemo(() => {
    const latest: Record<string, LabRecord> = {};
    labData.forEach((record) => {
      const testName = record["نام خدمت"];
      const existing = latest[testName];
      if (!existing || record["تاريخ"] > existing["تاريخ"]) {
        latest[testName] = record;
      }
    });
    return latest;
  }, [labData]);

  if (isPending || ehr_query.isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (error || ehr_query.error) {
    return (
      <div className="text-destructive">
        Error: {error?.message || ehr_query.error?.message}
      </div>
    );
  }

  if (!person_data) {
    return <div>No Data</div>;
  }

  // Key lab tests to display
  const keyLabTests = [
    { key: "CBC/Hb", label: "هموگلوبین (Hb)" },
    { key: "CBC/Hct", label: "هماتوکریت (Hct)" },
    { key: "CBC/WBC", label: "گلبول سفید (WBC)" },
    { key: "CBC/RBC", label: "گلبول قرمز (RBC)" },
    { key: "CBC/Plat", label: "پلاکت" },
    { key: "FBS", label: "قند خون ناشتا" },
    { key: "Total Chol", label: "کلسترول کل" },
    { key: "HDL", label: "کلسترول HDL" },
    { key: "LDL", label: "کلسترول LDL" },
    { key: "TG", label: "تری گلیسیرید" },
    { key: "Hb-A1C", label: "هموگلوبین A1C" },
    { key: "TSH", label: "TSH" },
    { key: "T3", label: "T3" },
    { key: "T4", label: "T4" },
    { key: "Vit D", label: "ویتامین D" },
    { key: "Ferritin", label: "فریتین" },
    { key: "vitamin b12", label: "ویتامین B12" },
  ];

  // Clinical examination sections
  const clinicalSections = [
    { key: "قلب", label: "قلب و عروق", icon: Heart },
    { key: "گوارش", label: "گوارش", icon: Stethoscope },
    { key: "سیستم تنفسی", label: "سیستم تنفسی", icon: Activity },
    { key: "نورولوژی", label: "نورولوژی", icon: Brain },
    { key: "هماتولوژی", label: "هماتولوژی", icon: Droplet },
    { key: "اندوکرینولوژی", label: "اندوکرینولوژی", icon: TrendingUp },
    { key: "روماتولوژی", label: "روماتولوژی", icon: Stethoscope },
    {
      key: "سیستم عضلانی اسکلتی فوقانی",
      label: "سیستم عضلانی اسکلتی فوقانی",
      icon: Activity,
    },
    {
      key: "سیستم عضلانی اسکلتی تحتانی",
      label: "سیستم عضلانی اسکلتی تحتانی",
      icon: Activity,
    },
    { key: "ستون فقرات پشتی و کمری", label: "ستون فقرات", icon: Activity },
    { key: "سر و گردن", label: "سر و گردن", icon: Stethoscope },
    { key: "سایکولوژی", label: "سایکولوژی", icon: FileText },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Patient Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                {person_data["نام"]} {person_data["نام خانوادگی"]}
              </CardTitle>
              <CardDescription className="mt-2">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>
                    <strong>کد ملی:</strong>{" "}
                    {formatCellValue(national_id, locale)}
                  </span>
                  <span>
                    <strong>سن:</strong>{" "}
                    {person_data["سن"] != null
                      ? formatCellValue(person_data["سن"], locale)
                      : "-"}{" "}
                    سال
                  </span>
                  <span>
                    <strong>جنسیت:</strong>{" "}
                    {person_data["جنسیت"] != null
                      ? formatCellValue(person_data["جنسیت"], locale)
                      : "-"}
                  </span>
                  <span>
                    <strong>تاریخ معاینه:</strong>{" "}
                    {person_data["تاریخ"] != null
                      ? formatCellValue(person_data["تاریخ"], locale)
                      : "-"}
                  </span>
                </div>
              </CardDescription>
            </div>
            <Badge
              variant={getStatusColor(person_data["BMI_Group"])}
              className="text-sm"
            >
              {person_data["BMI_Group"] != null
                ? formatCellValue(person_data["BMI_Group"], locale)
                : "-"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Vital Signs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              BMI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {person_data["BMI"] != null
                ? formatCellValue(person_data["BMI"], locale)
                : "-"}
            </div>
            <Badge
              variant={getStatusColor(person_data["BMI_Group"])}
              className="mt-2"
            >
              {person_data["BMI_Group"] != null
                ? formatCellValue(person_data["BMI_Group"], locale)
                : "-"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              فشار خون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {person_data["Sys_Bp"] != null
                ? formatCellValue(person_data["Sys_Bp"], locale)
                : "-"}
              /
              {person_data["Dia_BP"] != null
                ? formatCellValue(person_data["Dia_BP"], locale)
                : "-"}
            </div>
            <Badge
              variant={getStatusColor(person_data["BP_Group"])}
              className="mt-2"
            >
              {person_data["BP_Group"] != null
                ? formatCellValue(person_data["BP_Group"], locale)
                : "-"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              نبض
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {person_data["تعداد نبض"] != null
                ? formatCellValue(person_data["تعداد نبض"], locale)
                : "-"}{" "}
              bpm
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {person_data["نبض"] != null
                ? formatCellValue(person_data["نبض"], locale)
                : "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              وزن / قد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {person_data["وزن"] != null
                ? formatCellValue(person_data["وزن"], locale)
                : "-"}{" "}
              kg /{" "}
              {person_data["قد"] != null
                ? formatCellValue(person_data["قد"], locale)
                : "-"}{" "}
              cm
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lab Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5" />
            نتایج آزمایشات
          </CardTitle>
          <CardDescription>خلاصه نتایج آزمایشات و روند تغییرات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {keyLabTests.map((test) => {
              const value = person_data[test.key];
              const status = getStatusColor(value);
              const icon = getStatusIcon(value);
              return (
                <div
                  key={test.key}
                  className="flex flex-col gap-2 p-3 border rounded-lg"
                >
                  <div className="text-xs text-muted-foreground">
                    {test.label}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={status} className="text-xs">
                      {value != null ? formatCellValue(value, locale) : "-"}
                    </Badge>
                    {icon}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lab Trends Charts */}
          {Object.keys(chartData).length > 0 && (
            <div className="space-y-6 mt-6">
              <h3 className="text-lg font-semibold">
                روند تغییرات آزمایشات کلیدی
              </h3>
              {Object.entries(chartData).map(([testName, data]) => {
                if (data.length === 0) return null;

                const chartConfig: ChartConfig = {
                  value: {
                    label: testName,
                    color: "hsl(var(--chart-1))",
                  },
                  min: {
                    label: "حداقل نرمال",
                    color: "hsl(var(--chart-2))",
                  },
                  max: {
                    label: "حداکثر نرمال",
                    color: "hsl(var(--chart-3))",
                  },
                };

                return (
                  <Card key={testName} className="p-4">
                    <CardTitle className="text-base mb-4">{testName}</CardTitle>
                    <ChartContainer config={chartConfig} className="h-[200px]">
                      <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="formattedDate"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ReferenceArea
                          y1={data[0]?.min}
                          y2={data[0]?.max}
                          fill="rgba(22, 163, 74, 0.1)"
                          stroke="none"
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="var(--color-value)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="min"
                          stroke="var(--color-min)"
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="max"
                          stroke="var(--color-max)"
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </ComposedChart>
                    </ChartContainer>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Detailed Lab Results Table */}
          {labData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">جزئیات آزمایشات</h3>
              <div className="space-y-4">
                {Object.entries(groupedLabData).map(([testName]) => {
                  const latest = latestLabValues[testName];
                  if (!latest) return null;

                  const value = parseFloat(latest["جواب"] || "0");
                  const range = latest["نرمال رنج"];
                  const isNormal = range && !isNaN(value) && value > 0;

                  return (
                    <div
                      key={testName}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{testName}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {latest["جواب"]} {range && `(${range})`}
                          </span>
                          {isNormal && getStatusIcon("طبیعی")}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        تاریخ: {latest["تاريخ"]} | پزشک:{" "}
                        {latest["نام پزشك معالج"]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clinical Examination */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            معاینات بالینی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clinicalSections.map((section) => {
              const value = person_data[section.key];
              const Icon = section.icon;
              if (!value || value === "انجام نشده") return null;

              return (
                <div
                  key={section.key}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{section.label}</div>
                    <Badge
                      variant={getStatusColor(value)}
                      className="mt-1 text-xs"
                    >
                      {value != null ? formatCellValue(value, locale) : "-"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Medical History & Recommendations */}
      {(person_data["تاریخچه قبلی پزشکی"] ||
        person_data["توصیه های عمومی"] ||
        person_data["اقدامات و مشاوره های موردنیاز"]) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {person_data["تاریخچه قبلی پزشکی"] && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  تاریخچه پزشکی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">
                  {formatCellValue(person_data["تاریخچه قبلی پزشکی"], locale)}
                </p>
              </CardContent>
            </Card>
          )}

          {person_data["توصیه های عمومی"] && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  توصیه‌های عمومی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">
                  {formatCellValue(person_data["توصیه های عمومی"], locale)}
                </p>
              </CardContent>
            </Card>
          )}

          {person_data["اقدامات و مشاوره های موردنیاز"] && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  اقدامات و مشاوره‌های موردنیاز
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">
                  {formatCellValue(
                    person_data["اقدامات و مشاوره های موردنیاز"],
                    locale
                  )}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonMonitoringPage;
