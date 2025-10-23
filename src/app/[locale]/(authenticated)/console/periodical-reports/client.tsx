"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePeriodicalReports } from "./provider";
import { PeriodicalReportsForm } from "./_form/periodical-reports-form";
import { RecordCountChart } from "./_charts/record-count-chart";
import { PatientCountChart } from "./_charts/patient-count-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "../electronic-health-record/_utils/format-date";
import { localeDigits } from "@/lib/utils";

const Client = (props: {
  initialValues: { fromDate: string; toDate: string };
}) => {
  const t = useTranslations("PeriodicalReports");
  const { ehrByNationalNumber_m, filters } = usePeriodicalReports();
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
        <PeriodicalReportsForm
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
                  گزارش بیماران در بازه تاریخ
                </h1>
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
              </div>
            )}
          </div>
          <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{t("chartTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <RecordCountChart data={data} />
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle>{t("patientChartTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <PatientCountChart data={data} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Client;
