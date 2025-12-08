"use client";
import { SBHM_RetrieveSerializer } from "@/data/saderat-bank-health-monitoring/types";
import { localeDigits } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import React from "react";
import { useMonitoringIdRouteContext } from "./route-context";
import { Button } from "@/components/ui/button";
import { AlertCircle, Inbox, Users, BarChart3 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { SearchPersonnelSheet } from "./_search-personnel-sheet/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { digitsEnToFa } from "@persian-tools/persian-tools";

const MonitoringPage = (
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring/[id]">
) => {
  const { id: monitoring_id } = React.use(props.params);
  const locale = useLocale();
  const { monitoring_query } = useMonitoringIdRouteContext();
  const [isSearchSheetOpen, setIsSearchSheetOpen] = React.useState(false);
  const t = useTranslations("SaderatBankHealthMonitoringPage");

  const { data, isPending, error } = monitoring_query;

  // Calculate statistics and chart data
  const reportData = React.useMemo(() => {
    if (!data?.json || data.json.length === 0) return null;

    const records = data.json;
    const totalRecords = records.length;

    // Helper to count values
    const countValues = (field: keyof SBHM_RetrieveSerializer["json"][number]) => {
      const counts: Record<string, number> = {};
      records.forEach((record) => {
        const value = record[field];
        if (value !== null && value !== undefined && value !== "") {
          const key = String(value);
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    };

    // Helper to calculate numeric statistics
    const numericStats = (field: keyof SBHM_RetrieveSerializer["json"][number]) => {
      const values = records
        .map((r) => r[field])
        .filter((v): v is number => typeof v === "number" && !isNaN(v));
      if (values.length === 0) return null;
      const sum = values.reduce((a, b) => a + b, 0);
      return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: sum / values.length,
        count: values.length,
      };
    };

    // Helper to categorize numeric values
    const categorizeNumeric = (
      field: keyof SBHM_RetrieveSerializer["json"][number],
      ranges: { label: string; min: number; max: number }[]
    ) => {
      const counts: Record<string, number> = {};
      ranges.forEach((range) => (counts[range.label] = 0));
      records.forEach((record) => {
        const value = record[field];
        if (typeof value === "number" && !isNaN(value)) {
          const range = ranges.find((r) => value >= r.min && value < r.max);
          if (range) counts[range.label]++;
        }
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    return {
      totalRecords,
      genderDistribution: countValues("جنسیت"),
      bmiGroupDistribution: countValues("BMI_Group"),
      bpGroupDistribution: countValues("BP_Group"),
      ageStats: numericStats("سن"),
      bmiStats: numericStats("BMI"),
      ageDistribution: categorizeNumeric("سن", [
        { label: "20-30", min: 20, max: 30 },
        { label: "30-40", min: 30, max: 40 },
        { label: "40-50", min: 40, max: 50 },
        { label: "50-60", min: 50, max: 60 },
        { label: "60+", min: 60, max: 200 },
      ]),
      bmiDistribution: categorizeNumeric("BMI", [
        { label: "کم‌وزن (<18.5)", min: 0, max: 18.5 },
        { label: "طبیعی (18.5-25)", min: 18.5, max: 25 },
        { label: "اضافه وزن (25-30)", min: 25, max: 30 },
        { label: "چاق (>30)", min: 30, max: 200 },
      ]),
      // Test results distributions
      fbsDistribution: countValues("FBS"),
      hba1cDistribution: countValues("Hb-A1C"),
      totalCholDistribution: countValues("Total Chol"),
      hdlDistribution: countValues("HDL"),
      ldlDistribution: countValues("LDL"),
      tgDistribution: countValues("TG"),
      tshDistribution: countValues("TSH"),
      t3Distribution: countValues("T3"),
      t4Distribution: countValues("T4"),
      vitDDistribution: countValues("Vit D"),
      vitaminB12Distribution: countValues("vitamin b12"),
      ferritinDistribution: countValues("Ferritin"),
      psaDistribution: countValues("PSA"),
      ureaDistribution: countValues("Urea"),
      caDistribution: countValues("ca"),
      // CBC distributions
      cbcHbDistribution: countValues("CBC/Hb"),
      cbcHctDistribution: countValues("CBC/Hct"),
      cbcRbcDistribution: countValues("CBC/RBC"),
      cbcWbcDistribution: countValues("CBC/WBC"),
      cbcPlatDistribution: countValues("CBC/Plat"),
      cbcMchDistribution: countValues("CBC/MCH"),
      cbcMcvDistribution: countValues("CBC/MCV"),
      cbcMchcDistribution: countValues("CBC/MCHC"),
      // Liver function
      sgotDistribution: countValues("SGOT(AST)"),
      sgptDistribution: countValues("SGPT(ALT)"),
      alkalinePhosphataseDistribution: countValues("Alkaline Phosphatase"),
      bilirubinDirectDistribution: countValues("bilirubin-direct"),
      // Kidney function
      crDistribution: countValues("Cr"),
      naDistribution: countValues("Na"),
      kDistribution: countValues("K"),
      pDistribution: countValues("P"),
      // Urine analysis
      uaGluDistribution: countValues("U_A/Glu"),
      uaRbcDistribution: countValues("U_A/RBC"),
      uaWbcDistribution: countValues("U_A/WBC"),
      uaBactDistribution: countValues("U_A/Bact"),
      uaProtDistribution: countValues("U_A/Prot"),
      uaBloodDistribution: countValues("U_A/Blood"),
      uaKetoneDistribution: countValues("U_A/Ketone"),
      uaCrystalDistribution: countValues("U_A/crystal"),
      // Clinical examination results
      heartDistribution: countValues("قلب"),
      digestiveDistribution: countValues("گوارش"),
      headNeckDistribution: countValues("سر و گردن"),
      neurologyDistribution: countValues("نورولوژی"),
      hematologyDistribution: countValues("هماتولوژی"),
      endocrinologyDistribution: countValues("اندوکرینولوژی"),
      rheumatologyDistribution: countValues("روماتولوژی"),
      psychologyDistribution: countValues("سایکولوژی"),
      respiratoryDistribution: countValues("سیستم تنفسی"),
      musculoskeletalUpperDistribution: countValues("سیستم عضلانی اسکلتی فوقانی"),
      musculoskeletalLowerDistribution: countValues("سیستم عضلانی اسکلتی تحتانی"),
      spineDistribution: countValues("ستون فقرات پشتی و کمری"),
      maleGenitalDistribution: countValues("تناسلی مردان"),
      femaleExamDistribution: countValues("معاینات بالینی زنان"),
      breastDistribution: countValues("پستان"),
      papSmearDistribution: countValues("پاپ اسمیر"),
      chestXrayDistribution: countValues("رادیوگرافی قفسه سینه"),
      entExamDistribution: countValues("معاینه بالینی ENT"),
      heartDiseaseDistribution: countValues("بیماریهای عضلانی قلب"),
      ecgInterpretationDistribution: countValues("تفسیر الکتروکاردیوگرام"),
      heartConsultationDistribution: countValues("مشاوره قلب"),
      ultrasoundDistribution: countValues("سونوگرافی شکم و لگن"),
      pulseDistribution: countValues("نبض"),
      // Administrative
      insuranceDistribution: countValues("بيمه"),
      industryDistribution: countValues("نام صنعت"),
      groupDistribution: countValues("name_goroh"),
    };
  }, [data?.json]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <div className="flex items-center flex-col gap-3">
          <Spinner className="h-8 w-8" />
          <span className="text-muted-foreground">{t("Loading")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-destructive">{t("ErrorTitle")}</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.json || data.json.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Inbox className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">{t("EmptyStateTitle")}</p>
        <p className="text-sm text-muted-foreground">
          {t("EmptyStateDescriptionDetail")}
        </p>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  // Chart configurations
  const genderChartConfig: ChartConfig = {
    value: { label: "تعداد" },
  };

  const testResultChartConfig: ChartConfig = {
    value: { label: "تعداد" },
  };

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <div className="space-y-6">
      {/* Header with Search Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h2 className="text-2xl font-bold">{t("ReportTitle") || "گزارش آماری"}</h2>
        </div>
          <Button
            variant="outline"
          onClick={() => setIsSearchSheetOpen(true)}
          >
          <Users className="h-4 w-4 ml-2" />
          {t("SearchPersonnel") || "جستجوی پرسنل"}
          </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">کل رکوردها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localeDigits(reportData.totalRecords.toString(), locale)}</div>
          </CardContent>
        </Card>
        {reportData.ageStats && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">میانگین سن</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {localeDigits(reportData.ageStats.avg.toFixed(1), locale)}
              </div>
            </CardContent>
          </Card>
        )}
        {reportData.bmiStats && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">میانگین BMI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {localeDigits(reportData.bmiStats.avg.toFixed(1), locale)}
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">تعداد مردان</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {localeDigits(
                (reportData.genderDistribution.find((g) => g.name === "مرد")?.value || 0).toString(),
                locale
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        {reportData.genderDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع جنسیت</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={genderChartConfig} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={reportData.genderDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.genderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* BMI Group Distribution */}
        {reportData.bmiGroupDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع گروه BMI</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.bmiGroupDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Blood Pressure Group */}
        {reportData.bpGroupDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع گروه فشار خون</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.bpGroupDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                    angle={45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Age Distribution */}
        {reportData.ageDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع سنی</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* FBS Distribution */}
        {reportData.fbsDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع FBS</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.fbsDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-4))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Total Cholesterol Distribution */}
        {reportData.totalCholDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع کلسترول کل</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.totalCholDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-5))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* HDL Distribution */}
        {reportData.hdlDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع HDL</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.hdlDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* LDL Distribution */}
        {reportData.ldlDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع LDL</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.ldlDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* TSH Distribution */}
        {reportData.tshDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع TSH</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.tshDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Vitamin D Distribution */}
        {reportData.vitDDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع ویتامین D</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.vitDDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-4))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Hb-A1C Distribution */}
        {reportData.hba1cDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع Hb-A1C</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.hba1cDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-5))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* TG Distribution */}
        {reportData.tgDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع TG</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.tgDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* T3 Distribution */}
        {reportData.t3Distribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع T3</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.t3Distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* T4 Distribution */}
        {reportData.t4Distribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع T4</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.t4Distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Vitamin B12 Distribution */}
        {reportData.vitaminB12Distribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع ویتامین B12</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.vitaminB12Distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-4))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Ferritin Distribution */}
        {reportData.ferritinDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع Ferritin</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.ferritinDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-5))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* PSA Distribution */}
        {reportData.psaDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع PSA</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.psaDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Urea Distribution */}
        {reportData.ureaDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع Urea</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.ureaDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* SGOT Distribution */}
        {reportData.sgotDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع SGOT (AST)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.sgotDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* SGPT Distribution */}
        {reportData.sgptDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع SGPT (ALT)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.sgptDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-4))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Creatinine Distribution */}
        {reportData.crDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع Creatinine</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.crDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-5))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* CBC/Hb Distribution */}
        {reportData.cbcHbDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع CBC/Hb</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.cbcHbDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* CBC/WBC Distribution */}
        {reportData.cbcWbcDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع CBC/WBC</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.cbcWbcDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Urine Analysis - Glucose */}
        {reportData.uaGluDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع قند ادرار</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.uaGluDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-5))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Insurance Distribution */}
        {reportData.insuranceDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>توزیع بیمه</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={testResultChartConfig} className="h-[300px]">
                <BarChart data={reportData.insuranceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => digitsEnToFa(value)}
                    fontSize={12}
                    angle={45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tickFormatter={(value) => digitsEnToFa(value.toString())} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search Personnel Sheet */}
      {data?.json && (
        <SearchPersonnelSheet
          open={isSearchSheetOpen}
          onOpenChange={setIsSearchSheetOpen}
          data={data.json}
          monitoringId={monitoring_id}
        />
      )}
    </div>
  );
};

export default MonitoringPage;
