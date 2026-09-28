"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatCellValue, localeDigits } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity,
  Heart,
  Droplet,
  TrendingUp,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Stethoscope,
  FileText,
  Brain,
} from "lucide-react";
import { hasAnyValue, toNumber } from "@/lib/campaign";
import { NoFindings } from "./no-findings";
import { Demographics } from "./demographics";

type MonitoringData = {
  [key: string]: string | number | null;
};

type ResultStatus = "high" | "low" | "normal" | "unknown";

/**
 * Single source of truth for how a result value is classified. The page used to
 * derive this inline for badge colour only; ordering and filtering now read the
 * same classification so they cannot drift apart.
 */
const getResultStatus = (value: string | number | null): ResultStatus => {
  if (value === null || value === undefined) return "unknown";
  const str = String(value).toLowerCase();
  if (str === "طبیعی" || str === "normal") return "normal";
  if (str === "بالا" || str === "high" || str.includes("abnormal")) return "high";
  if (str === "پایین" || str === "low") return "low";
  return "unknown";
};

const isAbnormal = (value: string | number | null) => {
  const status = getResultStatus(value);
  return status === "high" || status === "low";
};

/** Abnormal first, unknown next, normal last. Array.sort is stable, so the
 *  clinically meaningful ordering within each group is preserved. */
const SEVERITY_RANK: Record<ResultStatus, number> = {
  high: 0,
  low: 1,
  unknown: 2,
  normal: 3,
};

const getStatusColor = (
  value: string | number | null
): "default" | "secondary" | "destructive" | "outline" => {
  switch (getResultStatus(value)) {
    case "normal":
      return "default";
    // Both directions are abnormal and both stay visually loud; the arrow icon
    // below is what distinguishes them. Previously "low" was indistinguishable
    // from "high", though clinically they are opposite findings.
    case "high":
    case "low":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusIcon = (value: string | number | null) => {
  switch (getResultStatus(value)) {
    case "normal":
      return <CheckCircle2 className="size-4 text-success" />;
    case "high":
      return <ArrowUp className="size-4 text-destructive" />;
    case "low":
      return <ArrowDown className="size-4 text-warning" />;
    default:
      return null;
  }
};

/**
 * One person's Step 1 findings, from their upload row. The caller owns the
 * header, EHR and loading/not-found states; this renders only the findings.
 */
/**
 * The cells this layout reads as findings outside its test lists: vitals,
 * imaging, examinations, history. Administrative cells (father's name,
 * insurance, codes) are not findings.
 */
const OTHER_FINDING_KEYS = [
  "BMI",
  "BMI_Group",
  "Sys_Bp",
  "Dia_BP",
  "BP_Group",
  "قد",
  "وزن",
  "نبض",
  "تعداد نبض",
  "سونوگرافی شکم و لگن",
  "رادیوگرافی قفسه سینه",
  "تفسیر الکتروکاردیوگرام",
  "پستان",
  "تناسلی مردان",
  "معاینات بالینی زنان",
  "پاپ اسمیر",
  "معاینه بالینی ENT",
  "دهان و حلق و دندان",
  "تعداد دندان پوسیده _ D",
  "تعداد دندان غیرموجود _ M",
  "تعداد دندان ترمیم شده _ F",
  "مشاوره قلب",
  "بیماریهای عضلانی قلب",
  "عوامل زیان آورشغلی",
  "تاریخچه قبلی پزشکی",
  "توصیه های عمومی",
  "اقدامات و مشاوره های موردنیاز",
];

/** The cells the administrative card shows. */
const ADMINISTRATIVE_KEYS = [
  "نام پدر",
  "سال",
  "بيمه",
  "اپراتور",
  "نام صنعت",
  "name_goroh",
  "ID_SANAT",
  "ID_goroh",
  "ID_shobeh",
  "کدپایش",
];

export const Step1PersonSections = ({ row }: { row: MonitoringData }) => {
  const locale = useLocale();
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.PersonRecord"
  );
  // Defaults to off: nothing is hidden from a clinician unless they ask.
  const [abnormalOnly, setAbnormalOnly] = React.useState(false);

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

  // Order abnormal results first within a group. Reads row through the
  // same classifier the badges use, so ordering can never disagree with colour.
  const bySeverity = <T extends { key: string }>(a: T, b: T) =>
    SEVERITY_RANK[getResultStatus(row[a.key])] -
    SEVERITY_RANK[getResultStatus(row[b.key])];

  const visible = <T extends { key: string }>(tests: T[]) =>
    [...tests]
      .sort(bySeverity)
      .filter((test) => !abnormalOnly || isAbnormal(row[test.key]));

  // Every abnormal finding on the record, for the summary at the top.
  const abnormalFindings = [
    ...keyLabTests,
    ...urineTests,
    ...liverTests,
    ...clinicalSections,
  ].filter((test) => isAbnormal(row[test.key]));

  // A row with no findings would otherwise show a card of dashes under an
  // "all clear" summary.
  const findingKeys = [
    ...keyLabTests,
    ...urineTests,
    ...liverTests,
    ...clinicalSections,
  ].map((test) => test.key);

  // Administrative Information: shown with or without findings.
  const administrative = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          اطلاعات اداری
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
          {row["نام پدر"] && (
            <div>
              <div className="text-muted-foreground mb-1">نام پدر</div>
              <div className="font-medium">
                {formatCellValue(row["نام پدر"], locale)}
              </div>
            </div>
          )}
          {row["سال"] != null && (
            <div>
              <div className="text-muted-foreground mb-1">سال</div>
              <div className="font-medium">
                {formatCellValue(row["سال"], locale)}
              </div>
            </div>
          )}
          {row["بيمه"] && (
            <div>
              <div className="text-muted-foreground mb-1">بیمه</div>
              <div className="font-medium">
                {formatCellValue(row["بيمه"], locale)}
              </div>
            </div>
          )}
          {row["اپراتور"] && (
            <div>
              <div className="text-muted-foreground mb-1">اپراتور</div>
              <div className="font-medium">
                {formatCellValue(row["اپراتور"], locale)}
              </div>
            </div>
          )}
          {row["نام صنعت"] && (
            <div>
              <div className="text-muted-foreground mb-1">نام صنعت</div>
              <div className="font-medium">
                {formatCellValue(row["نام صنعت"], locale)}
              </div>
            </div>
          )}
          {row["name_goroh"] && (
            <div>
              <div className="text-muted-foreground mb-1">نام گروه</div>
              <div className="font-medium">
                {formatCellValue(row["name_goroh"], locale)}
              </div>
            </div>
          )}
          {row["ID_SANAT"] != null && (
            <div>
              <div className="text-muted-foreground mb-1">ID صنعت</div>
              <div className="font-medium">
                {formatCellValue(row["ID_SANAT"], locale)}
              </div>
            </div>
          )}
          {row["ID_goroh"] != null && (
            <div>
              <div className="text-muted-foreground mb-1">ID گروه</div>
              <div className="font-medium">
                {formatCellValue(row["ID_goroh"], locale)}
              </div>
            </div>
          )}
          {row["ID_shobeh"] != null && (
            <div>
              <div className="text-muted-foreground mb-1">ID شعبه</div>
              <div className="font-medium">
                {formatCellValue(row["ID_shobeh"], locale)}
              </div>
            </div>
          )}
          {row["کدپایش"] != null && (
            <div>
              <div className="text-muted-foreground mb-1">کد پایش</div>
              <div className="font-medium">
                {formatCellValue(row["کدپایش"], locale)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Leads every branch; it is not a finding, so it never decides NoFindings.
  const demographics = (
    <Demographics row={row} fields={["age", "gender", "examDate"]} />
  );

  if (!hasAnyValue(row, [...findingKeys, ...OTHER_FINDING_KEYS])) {
    return (
      <div className="space-y-6">
        {demographics}
        <NoFindings />
        {hasAnyValue(row, ADMINISTRATIVE_KEYS) && administrative}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {demographics}
      {/* Abnormal findings summary. The classification already existed and drove
          only badge colour; this is the question a clinician opens the record to
          ask, so it leads rather than being buried among ~50 equal-weight tiles. */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {abnormalFindings.length > 0 ? (
              <AlertCircle className="size-5 text-destructive" />
            ) : (
              <CheckCircle2 className="size-5 text-success" />
            )}
            <CardTitle>
              {t("AbnormalFindings", {
                count: localeDigits(abnormalFindings.length, locale),
              })}
            </CardTitle>
          </div>
          {abnormalFindings.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {abnormalFindings.map((finding) => (
                <Badge
                  key={finding.key}
                  variant="destructive"
                  className="text-xs"
                >
                  {finding.label}
                  <span className="ps-1">
                    {getResultStatus(row[finding.key]) === "high"
                      ? "↑"
                      : "↓"}
                  </span>
                </Badge>
              ))}
            </div>
          )}
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
              {formatCellValue(
                toNumber(row["BMI"])?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                }) ?? String(row["BMI"] ?? "-"),
                locale
              )}
            </div>
            <Badge
              variant={getStatusColor(row["BMI_Group"])}
              className="mt-2"
            >
              {row["BMI_Group"] != null
                ? formatCellValue(row["BMI_Group"], locale)
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
              {row["Sys_Bp"] != null
                ? formatCellValue(row["Sys_Bp"], locale)
                : "-"}
              /
              {row["Dia_BP"] != null
                ? formatCellValue(row["Dia_BP"], locale)
                : "-"}
            </div>
            <Badge
              variant={getStatusColor(row["BP_Group"])}
              className="mt-2"
            >
              {row["BP_Group"] != null
                ? formatCellValue(row["BP_Group"], locale)
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
              {row["تعداد نبض"] != null
                ? formatCellValue(row["تعداد نبض"], locale)
                : "-"}{" "}
              bpm
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {row["نبض"] != null
                ? formatCellValue(row["نبض"], locale)
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
                {row["وزن"] != null
                  ? formatCellValue(row["وزن"], locale)
                  : "-"}{" "}
                kg
              </span>{" "}
              /{" "}
              <span dir="ltr">
                {row["قد"] != null
                  ? formatCellValue(row["قد"], locale)
                  : "-"}{" "}
                cm
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters the test sections below (lab, clinical, urine, liver), so it
          sits at their head, not in the summary above. */}
      <label className="flex items-center justify-end gap-2 text-sm">
        <Switch
          checked={abnormalOnly}
          onCheckedChange={setAbnormalOnly}
          aria-label={t("ShowAbnormalOnly")}
        />
        {t("ShowAbnormalOnly")}
      </label>

      {/* Lab Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5" />
            نتایج آزمایشات
          </CardTitle>
          <CardDescription>خلاصه نتایج آزمایشات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visible(keyLabTests).map((test) => {
              const value = row[test.key];
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
            {visible(clinicalSections).map((section) => {
              const value = row[section.key];
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
            {visible(urineTests).map((test) => {
              const value = row[test.key];
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
            {visible(liverTests).map((test) => {
              const value = row[test.key];
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
            {row["سونوگرافی شکم و لگن"] && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium mb-2">
                  سونوگرافی شکم و لگن
                </div>
                <Badge
                  variant={getStatusColor(row["سونوگرافی شکم و لگن"])}
                  className="text-xs"
                >
                  {row["سونوگرافی شکم و لگن"] != null
                    ? formatCellValue(
                        row["سونوگرافی شکم و لگن"],
                        locale
                      )
                    : "-"}
                </Badge>
              </div>
            )}
            {row["رادیوگرافی قفسه سینه"] && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium mb-2">
                  رادیوگرافی قفسه سینه
                </div>
                <Badge
                  variant={getStatusColor(row["رادیوگرافی قفسه سینه"])}
                  className="text-xs"
                >
                  {row["رادیوگرافی قفسه سینه"] != null
                    ? formatCellValue(
                        row["رادیوگرافی قفسه سینه"],
                        locale
                      )
                    : "-"}
                </Badge>
              </div>
            )}
            {row["تفسیر الکتروکاردیوگرام"] && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium mb-2">
                  تفسیر الکتروکاردیوگرام
                </div>
                <Badge
                  variant={getStatusColor(
                    row["تفسیر الکتروکاردیوگرام"]
                  )}
                  className="text-xs"
                >
                  {row["تفسیر الکتروکاردیوگرام"] != null
                    ? formatCellValue(
                        row["تفسیر الکتروکاردیوگرام"],
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
      {(row["پستان"] ||
        row["تناسلی مردان"] ||
        row["معاینات بالینی زنان"] ||
        row["پاپ اسمیر"]) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              معاینات جنسیت‌محور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {row["پستان"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">پستان</div>
                  <Badge
                    variant={getStatusColor(row["پستان"])}
                    className="text-xs"
                  >
                    {row["پستان"] != null
                      ? formatCellValue(row["پستان"], locale)
                      : "-"}
                  </Badge>
                </div>
              )}
              {row["تناسلی مردان"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">تناسلی مردان</div>
                  <Badge
                    variant={getStatusColor(row["تناسلی مردان"])}
                    className="text-xs"
                  >
                    {row["تناسلی مردان"] != null
                      ? formatCellValue(row["تناسلی مردان"], locale)
                      : "-"}
                  </Badge>
                </div>
              )}
              {row["معاینات بالینی زنان"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    معاینات بالینی زنان
                  </div>
                  <Badge
                    variant={getStatusColor(row["معاینات بالینی زنان"])}
                    className="text-xs"
                  >
                    {row["معاینات بالینی زنان"] != null
                      ? formatCellValue(
                          row["معاینات بالینی زنان"],
                          locale
                        )
                      : "-"}
                  </Badge>
                </div>
              )}
              {row["پاپ اسمیر"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">پاپ اسمیر</div>
                  <Badge
                    variant={getStatusColor(row["پاپ اسمیر"])}
                    className="text-xs"
                  >
                    {row["پاپ اسمیر"] != null
                      ? formatCellValue(row["پاپ اسمیر"], locale)
                      : "-"}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ENT and Dental */}
      {(row["معاینه بالینی ENT"] ||
        row["دهان و حلق و دندان"] ||
        row["تعداد دندان پوسیده _ D"] ||
        row["تعداد دندان غیرموجود _ M"] ||
        row["تعداد دندان ترمیم شده _ F"]) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              معاینات ENT و دندان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {row["معاینه بالینی ENT"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    معاینه بالینی ENT
                  </div>
                  <Badge
                    variant={getStatusColor(row["معاینه بالینی ENT"])}
                    className="text-xs"
                  >
                    {row["معاینه بالینی ENT"] != null
                      ? formatCellValue(
                          row["معاینه بالینی ENT"],
                          locale
                        )
                      : "-"}
                  </Badge>
                </div>
              )}
              {row["دهان و حلق و دندان"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    دهان و حلق و دندان
                  </div>
                  <Badge
                    variant={getStatusColor(row["دهان و حلق و دندان"])}
                    className="text-xs"
                  >
                    {row["دهان و حلق و دندان"] != null
                      ? formatCellValue(
                          row["دهان و حلق و دندان"],
                          locale
                        )
                      : "-"}
                  </Badge>
                </div>
              )}
              {row["تعداد دندان پوسیده _ D"] != null && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    تعداد دندان پوسیده (D)
                  </div>
                  <div className="text-sm">
                    {formatCellValue(
                      row["تعداد دندان پوسیده _ D"],
                      locale
                    )}
                  </div>
                </div>
              )}
              {row["تعداد دندان غیرموجود _ M"] != null && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    تعداد دندان غیرموجود (M)
                  </div>
                  <div className="text-sm">
                    {formatCellValue(
                      row["تعداد دندان غیرموجود _ M"],
                      locale
                    )}
                  </div>
                </div>
              )}
              {row["تعداد دندان ترمیم شده _ F"] != null && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    تعداد دندان ترمیم شده (F)
                  </div>
                  <div className="text-sm">
                    {formatCellValue(
                      row["تعداد دندان ترمیم شده _ F"],
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
      {(row["مشاوره قلب"] || row["بیماریهای عضلانی قلب"]) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              موارد قلبی خاص
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {row["مشاوره قلب"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">مشاوره قلب</div>
                  <Badge
                    variant={getStatusColor(row["مشاوره قلب"])}
                    className="text-xs"
                  >
                    {row["مشاوره قلب"] != null
                      ? formatCellValue(row["مشاوره قلب"], locale)
                      : "-"}
                  </Badge>
                </div>
              )}
              {row["بیماریهای عضلانی قلب"] && (
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    بیماریهای عضلانی قلب
                  </div>
                  <Badge
                    variant={getStatusColor(
                      row["بیماریهای عضلانی قلب"]
                    )}
                    className="text-xs"
                  >
                    {row["بیماریهای عضلانی قلب"] != null
                      ? formatCellValue(
                          row["بیماریهای عضلانی قلب"],
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
      {row["عوامل زیان آورشغلی"] && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              عوامل زیان‌آور شغلی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">
              {formatCellValue(row["عوامل زیان آورشغلی"], locale)}
            </p>
          </CardContent>
        </Card>
      )}

      {administrative}

      {/* Medical History & Recommendations */}
      {(row["تاریخچه قبلی پزشکی"] ||
        row["توصیه های عمومی"] ||
        row["اقدامات و مشاوره های موردنیاز"]) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {row["تاریخچه قبلی پزشکی"] && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  تاریخچه پزشکی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">
                  {formatCellValue(row["تاریخچه قبلی پزشکی"], locale)}
                </p>
              </CardContent>
            </Card>
          )}

          {row["توصیه های عمومی"] && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  توصیه‌های عمومی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">
                  {formatCellValue(row["توصیه های عمومی"], locale)}
                </p>
              </CardContent>
            </Card>
          )}

          {row["اقدامات و مشاوره های موردنیاز"] && (
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
                    row["اقدامات و مشاوره های موردنیاز"],
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
