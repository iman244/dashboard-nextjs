"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePatientReports } from "./provider";
import { PatientReportsForm } from "./_form/patient-reports-form";
import { ServiceCountChart } from "./_charts/service-count-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "../electronic-health-record/_utils/format-date";
import { localeDigits } from "@/lib/utils";

const Client = (props: {
  initialValues: { nationalNumber: string; fromDate: string; toDate: string };
}) => {
  const t = useTranslations("PatientReports");
  const { ehrByNationalNumber_m, filters } = usePatientReports();
  const { data, isPending } = ehrByNationalNumber_m;
  const locale = useLocale();
  console.log("ehrByNationalNumber_m", { ehrByNationalNumber_m });

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
                <h1 className="text-2xl font-bold">
                  گزارش بیمار در بازه تاریخ
                </h1>
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
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{t("totalRecords")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-center">
                    {data.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{t("patientInfo")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground text-center">
                    {t("selectedPatientAndPeriod")}
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{t("serviceChartTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ServiceCountChart data={data} />
                </CardContent>
              </Card>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Client;
