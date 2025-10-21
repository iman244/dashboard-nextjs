"use client";

import React from 'react';
import { useTranslations } from "next-intl";
import { usePatientReports } from "./provider";
import { PatientReportsForm } from "./_components/patient-reports-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const Client = () => {
  const t = useTranslations("PatientReports");
  const { ehrByNationalNumber_m, hasData } = usePatientReports();
  const { data, isPending, isError } = ehrByNationalNumber_m;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Form Section - Always visible */}
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">{t("selectPatientAndPeriod")}</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientReportsForm />
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Only visible after data is loaded */}
      {hasData && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">{t("reportResults")}</h2>
          </div>

          {isPending && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {isError && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  {t("errorMessage")}
                </div>
              </CardContent>
            </Card>
          )}

          {data && !isPending && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Chart Placeholders - Replace with actual chart components */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("totalRecords")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-center">
                    {data.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("patientInfo")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground text-center">
                    {/* Display the selected national number and date range */}
                    {t("selectedPatientAndPeriod")}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("chartPlaceholder")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted rounded flex items-center justify-center">
                    <span className="text-muted-foreground">{t("chartComingSoon")}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Client;