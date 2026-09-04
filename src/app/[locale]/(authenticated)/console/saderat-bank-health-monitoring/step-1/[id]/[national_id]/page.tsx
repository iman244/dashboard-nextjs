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
import { formatCellValue, localeDigits } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
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
  XIcon,
  ChartArea,
} from "lucide-react";
import { toast } from "sonner";
import { usePersonEhr, type LabSeries } from "../../../_ehr/use-person-ehr";
import { EhrTrendDialog } from "../../../_ehr/trend-dialog";
import { EhrTimeline } from "../../../_ehr/timeline";
import { EhrTimelineTable } from "../../../_ehr/timeline-table";
import { PatientReportLink } from "../../../_ehr/patient-report-link";
import { useRecordDetail } from "../../../_ehr/use-record-detail";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ServiceDetailsTable } from "../../../../patient-reports/client";

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
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring/step-1/[id]/[national_id]">
) => {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<string | null>(
    null
  );
  const [serviceData, setServiceData] = React.useState<
    ElectronicHealthRecord[] | null
  >(null);
  const { national_id } = React.use(props.params);
  const { monitoring_query } = useMonitoringIdRouteContext();
  const { data, isPending, error } = monitoring_query;

  const recordDetail = useRecordDetail();

  const locale = useLocale();
  const tEhr = useTranslations("/console/saderat-bank-health-monitoring.Ehr");
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
  const { error: ehr_error } = ehr_query;

  // The shared EHR layer, alongside step-1's own ehr_query. It reads the same
  // person but classifies against `نرمال رنج` and covers imaging/pathology as
  // well, which the LAB-only query above does not.
  const ehr = usePersonEhr({
    nationalId: national_id,
    campaignDate: data?.created_at ?? "",
    enabled: Boolean(data),
  });
  const [selectedSeries, setSelectedSeries] = React.useState<LabSeries | null>(
    null
  );

  React.useEffect(() => {
    if (ehr_error) {
      toast.error("خطا در دریافت جزییات آزمایش‌ها: " + ehr_error.message);
    }
  }, [ehr_error]);

  const person_data = React.useMemo(() => {
    return data?.json.find(
      (item) => item["personel.کد ملی"] === national_id
    ) as MonitoringData | undefined;
  }, [data, national_id]);

  const labData = React.useMemo(() => {
    return ehr_query.data || [];
  }, [ehr_query.data]);

  // Group lab data by test name and prepare for charts
  const groupedLabData = React.useMemo(() => {
    const grouped: Record<string, ElectronicHealthRecord[]> = {};
    labData.forEach((record) => {
      const testName = record["نام خدمت"];
      if (!grouped[testName]) {
        grouped[testName] = [];
      }
      grouped[testName].push(record);
    });
    return grouped;
  }, [labData]);

  // Get latest lab values
  const latestLabValues = React.useMemo(() => {
    const latest: Record<string, ElectronicHealthRecord> = {};
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

  if (error) {
    return <div className="text-destructive">Error: {error?.message}</div>;
  }

  if (!person_data) {
    return <div>No Data</div>;
  }

  // All lab tests to display
  const keyLabTests = [
    { key: "CBC/Hb", label: "هموگلوبین (Hb)" },
    { key: "CBC/Hct", label: "هماتوکریت (Hct)" },
    { key: "CBC/WBC", label: "گلبول سفید (WBC)" },
    { key: "CBC/RBC", label: "گلبول قرمز (RBC)" },
    { key: "CBC/Plat", label: "پلاکت" },
    { key: "CBC/MCH", label: "MCH" },
    { key: "CBC/MCV", label: "MCV" },
    { key: "CBC/MCHC", label: "MCHC" },
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
    { key: "K", label: "پتاسیم (K)" },
    { key: "P", label: "فسفر (P)" },
    { key: "Cr", label: "کراتینین (Cr)" },
    { key: "Na", label: "سدیم (Na)" },
    { key: "ca", label: "کلسیم (Ca)" },
    { key: "Urea", label: "اوره" },
    { key: "PSA", label: "PSA" },
  ];

  // Urine analysis tests
  const urineTests = [
    { key: "U_A/Glu", label: "گلوکز" },
    { key: "U_A/RBC", label: "گلبول قرمز" },
    { key: "U_A/WBC", label: "گلبول سفید" },
    { key: "U_A/Bact", label: "باکتری" },
    { key: "U_A/Prot", label: "پروتئین" },
    { key: "U_A/Blood", label: "خون" },
    { key: "U_A/Ketone", label: "کتون" },
    { key: "U_A/crystal", label: "کریستال" },
  ];

  // Liver function tests
  const liverTests = [
    { key: "SGOT(AST)", label: "SGOT (AST)" },
    { key: "SGPT(ALT)", label: "SGPT (ALT)" },
    { key: "Alkaline Phosphatase", label: "آلکالین فسفاتاز" },
    { key: "bilirubin-direct", label: "بیلی روبین مستقیم" },
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
    { key: "علائم عمومی", label: "علائم عمومی", icon: Activity },
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


      {data && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>{tEhr("timelineTitle")}</CardTitle>
            <PatientReportLink ehr={ehr} nationalId={national_id} />
          </CardHeader>
          <CardContent className="space-y-6">
            <EhrTimeline ehr={ehr} campaignDate={data.created_at} />
            <EhrTimelineTable
              ehr={ehr}
              onViewRecord={recordDetail.open}
              onSelectSeries={setSelectedSeries}
            />
          </CardContent>
        </Card>
      )}

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
                ? formatCellValue(
                    person_data["BMI"].toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    }),
                    locale
                  )
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
              <span dir="ltr">
                {person_data["وزن"] != null
                  ? formatCellValue(person_data["وزن"], locale)
                  : "-"}{" "}
                kg
              </span>{" "}
              /{" "}
              <span dir="ltr">
                {person_data["قد"] != null
                  ? formatCellValue(person_data["قد"], locale)
                  : "-"}{" "}
                cm
              </span>
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


          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent side="bottom" className="max-h-[100dvh]">
              <SheetHeader className="flex flex-row items-center justify-between">
                <SheetTitle>گزارش رکوردهای خدمت: {selectedService}</SheetTitle>
                <SheetClose>
                  <XIcon className="h-4 w-4" />
                </SheetClose>
              </SheetHeader>
              {selectedService && serviceData && (
                <div className="p-4">
                  <ServiceDetailsTable
                    data={serviceData}
                    selectedService={selectedService}
                  />
                </div>
              )}
            </SheetContent>
          </Sheet>

          {recordDetail.modal}

          {/* Detailed Lab Results Table */}
          {labData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">جزئیات آزمایشات</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(groupedLabData).map(([testName]) => {
                  const latest = latestLabValues[testName];
                  if (!latest) return null;

                  const range = latest["نرمال رنج"];

                  return (
                    <div
                      key={testName}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{testName}</div>
                        {latest["جواب"] && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {localeDigits(latest["جواب"], locale)}{" "}
                              {range && `(${localeDigits(range, locale)})`}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          تاریخ: {formatCellValue(latest["تاريخ"], locale)} |
                          پزشک: {latest["نام پزشك معالج"]}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              recordDetail.open(latest);
                            }}
                          >
                            جزییات
                          </Button>
                          <Button
                            disabled={latest["جواب"] === null}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedService(testName);
                              setServiceData(
                                labData.filter(
                                  (item) => item["نام خدمت"] === testName
                                )
                              );
                              setIsSheetOpen(true);
                            }}
                          >
                            <ChartArea className="w-4 h-4" />
                          </Button>
                        </div>
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

      {/* Urine Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5" />
            آزمایش ادرار
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {urineTests.map((test) => {
              const value = person_data[test.key];
              const status = getStatusColor(value);
              const icon = getStatusIcon(value);
              if (!value || value === "انجام نشده") return null;
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
        </CardContent>
      </Card>

      {/* Liver Function Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            آزمایشات عملکرد کبد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {liverTests.map((test) => {
              const value = person_data[test.key];
              const status = getStatusColor(value);
              const icon = getStatusIcon(value);
              if (!value || value === "انجام نشده") return null;
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
        </CardContent>
      </Card>

      {/* Imaging and Diagnostic Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تصویربرداری و تست‌های تشخیصی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {person_data["سونوگرافی شکم و لگن"] && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium mb-2">
                  سونوگرافی شکم و لگن
                </div>
                <Badge
                  variant={getStatusColor(person_data["سونوگرافی شکم و لگن"])}
                  className="text-xs"
                >
                  {person_data["سونوگرافی شکم و لگن"] != null
                    ? formatCellValue(
                        person_data["سونوگرافی شکم و لگن"],
                        locale
                      )
                    : "-"}
                </Badge>
              </div>
            )}
            {person_data["رادیوگرافی قفسه سینه"] && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium mb-2">
                  رادیوگرافی قفسه سینه
                </div>
                <Badge
                  variant={getStatusColor(person_data["رادیوگرافی قفسه سینه"])}
                  className="text-xs"
                >
                  {person_data["رادیوگرافی قفسه سینه"] != null
                    ? formatCellValue(
                        person_data["رادیوگرافی قفسه سینه"],
                        locale
                      )
                    : "-"}
                </Badge>
              </div>
            )}
            {person_data["تفسیر الکتروکاردیوگرام"] && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium mb-2">
                  تفسیر الکتروکاردیوگرام
                </div>
                <Badge
                  variant={getStatusColor(
                    person_data["تفسیر الکتروکاردیوگرام"]
                  )}
                  className="text-xs"
                >
                  {person_data["تفسیر الکتروکاردیوگرام"] != null
                    ? formatCellValue(
                        person_data["تفسیر الکتروکاردیوگرام"],
                        locale
                      )
                    : "-"}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gender-Specific Examinations */}
      {(person_data["پستان"] ||
        person_data["تناسلی مردان"] ||
        person_data["معاینات بالینی زنان"] ||
        person_data["پاپ اسمیر"]) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              معاینات جنسیت‌محور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {person_data["پستان"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">پستان</div>
                  <Badge
                    variant={getStatusColor(person_data["پستان"])}
                    className="text-xs"
                  >
                    {person_data["پستان"] != null
                      ? formatCellValue(person_data["پستان"], locale)
                      : "-"}
                  </Badge>
                </div>
              )}
              {person_data["تناسلی مردان"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">تناسلی مردان</div>
                  <Badge
                    variant={getStatusColor(person_data["تناسلی مردان"])}
                    className="text-xs"
                  >
                    {person_data["تناسلی مردان"] != null
                      ? formatCellValue(person_data["تناسلی مردان"], locale)
                      : "-"}
                  </Badge>
                </div>
              )}
              {person_data["معاینات بالینی زنان"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    معاینات بالینی زنان
                  </div>
                  <Badge
                    variant={getStatusColor(person_data["معاینات بالینی زنان"])}
                    className="text-xs"
                  >
                    {person_data["معاینات بالینی زنان"] != null
                      ? formatCellValue(
                          person_data["معاینات بالینی زنان"],
                          locale
                        )
                      : "-"}
                  </Badge>
                </div>
              )}
              {person_data["پاپ اسمیر"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">پاپ اسمیر</div>
                  <Badge
                    variant={getStatusColor(person_data["پاپ اسمیر"])}
                    className="text-xs"
                  >
                    {person_data["پاپ اسمیر"] != null
                      ? formatCellValue(person_data["پاپ اسمیر"], locale)
                      : "-"}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ENT and Dental */}
      {(person_data["معاینه بالینی ENT"] ||
        person_data["دهان و حلق و دندان"] ||
        person_data["تعداد دندان پوسیده _ D"] ||
        person_data["تعداد دندان غیرموجود _ M"] ||
        person_data["تعداد دندان ترمیم شده _ F"]) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              معاینات ENT و دندان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {person_data["معاینه بالینی ENT"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    معاینه بالینی ENT
                  </div>
                  <Badge
                    variant={getStatusColor(person_data["معاینه بالینی ENT"])}
                    className="text-xs"
                  >
                    {person_data["معاینه بالینی ENT"] != null
                      ? formatCellValue(
                          person_data["معاینه بالینی ENT"],
                          locale
                        )
                      : "-"}
                  </Badge>
                </div>
              )}
              {person_data["دهان و حلق و دندان"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    دهان و حلق و دندان
                  </div>
                  <Badge
                    variant={getStatusColor(person_data["دهان و حلق و دندان"])}
                    className="text-xs"
                  >
                    {person_data["دهان و حلق و دندان"] != null
                      ? formatCellValue(
                          person_data["دهان و حلق و دندان"],
                          locale
                        )
                      : "-"}
                  </Badge>
                </div>
              )}
              {person_data["تعداد دندان پوسیده _ D"] != null && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    تعداد دندان پوسیده (D)
                  </div>
                  <div className="text-sm">
                    {formatCellValue(
                      person_data["تعداد دندان پوسیده _ D"],
                      locale
                    )}
                  </div>
                </div>
              )}
              {person_data["تعداد دندان غیرموجود _ M"] != null && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    تعداد دندان غیرموجود (M)
                  </div>
                  <div className="text-sm">
                    {formatCellValue(
                      person_data["تعداد دندان غیرموجود _ M"],
                      locale
                    )}
                  </div>
                </div>
              )}
              {person_data["تعداد دندان ترمیم شده _ F"] != null && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    تعداد دندان ترمیم شده (F)
                  </div>
                  <div className="text-sm">
                    {formatCellValue(
                      person_data["تعداد دندان ترمیم شده _ F"],
                      locale
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cardiac-Specific */}
      {(person_data["مشاوره قلب"] || person_data["بیماریهای عضلانی قلب"]) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              موارد قلبی خاص
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {person_data["مشاوره قلب"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">مشاوره قلب</div>
                  <Badge
                    variant={getStatusColor(person_data["مشاوره قلب"])}
                    className="text-xs"
                  >
                    {person_data["مشاوره قلب"] != null
                      ? formatCellValue(person_data["مشاوره قلب"], locale)
                      : "-"}
                  </Badge>
                </div>
              )}
              {person_data["بیماریهای عضلانی قلب"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    بیماریهای عضلانی قلب
                  </div>
                  <Badge
                    variant={getStatusColor(
                      person_data["بیماریهای عضلانی قلب"]
                    )}
                    className="text-xs"
                  >
                    {person_data["بیماریهای عضلانی قلب"] != null
                      ? formatCellValue(
                          person_data["بیماریهای عضلانی قلب"],
                          locale
                        )
                      : "-"}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Occupational Hazards */}
      {person_data["عوامل زیان آورشغلی"] && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              عوامل زیان‌آور شغلی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">
              {formatCellValue(person_data["عوامل زیان آورشغلی"], locale)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Administrative Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            اطلاعات اداری
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
            {person_data["نام پدر"] && (
              <div>
                <div className="text-muted-foreground mb-1">نام پدر</div>
                <div className="font-medium">
                  {formatCellValue(person_data["نام پدر"], locale)}
                </div>
              </div>
            )}
            {person_data["سال"] != null && (
              <div>
                <div className="text-muted-foreground mb-1">سال</div>
                <div className="font-medium">
                  {formatCellValue(person_data["سال"], locale)}
                </div>
              </div>
            )}
            {person_data["بيمه"] && (
              <div>
                <div className="text-muted-foreground mb-1">بیمه</div>
                <div className="font-medium">
                  {formatCellValue(person_data["بيمه"], locale)}
                </div>
              </div>
            )}
            {person_data["اپراتور"] && (
              <div>
                <div className="text-muted-foreground mb-1">اپراتور</div>
                <div className="font-medium">
                  {formatCellValue(person_data["اپراتور"], locale)}
                </div>
              </div>
            )}
            {person_data["نام صنعت"] && (
              <div>
                <div className="text-muted-foreground mb-1">نام صنعت</div>
                <div className="font-medium">
                  {formatCellValue(person_data["نام صنعت"], locale)}
                </div>
              </div>
            )}
            {person_data["name_goroh"] && (
              <div>
                <div className="text-muted-foreground mb-1">نام گروه</div>
                <div className="font-medium">
                  {formatCellValue(person_data["name_goroh"], locale)}
                </div>
              </div>
            )}
            {person_data["ID_SANAT"] != null && (
              <div>
                <div className="text-muted-foreground mb-1">ID صنعت</div>
                <div className="font-medium">
                  {formatCellValue(person_data["ID_SANAT"], locale)}
                </div>
              </div>
            )}
            {person_data["ID_goroh"] != null && (
              <div>
                <div className="text-muted-foreground mb-1">ID گروه</div>
                <div className="font-medium">
                  {formatCellValue(person_data["ID_goroh"], locale)}
                </div>
              </div>
            )}
            {person_data["ID_shobeh"] != null && (
              <div>
                <div className="text-muted-foreground mb-1">ID شعبه</div>
                <div className="font-medium">
                  {formatCellValue(person_data["ID_shobeh"], locale)}
                </div>
              </div>
            )}
            {person_data["کدپایش"] != null && (
              <div>
                <div className="text-muted-foreground mb-1">کد پایش</div>
                <div className="font-medium">
                  {formatCellValue(person_data["کدپایش"], locale)}
                </div>
              </div>
            )}
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


      <EhrTrendDialog
        series={selectedSeries}
        onOpenChange={(open) => {
          if (!open) setSelectedSeries(null);
        }}
      />
    </div>
  );
};

export default PersonMonitoringPage;
