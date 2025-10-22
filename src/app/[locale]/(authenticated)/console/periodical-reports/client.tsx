"use client";

import React from 'react';
import { useTranslations } from "next-intl";
import { usePeriodicalReports } from "./provider";
import { PeriodicalReportsForm } from "./_components/periodical-reports-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const Client = (props: { initialValues: { fromDate: string; toDate: string } }) => {
  const t = useTranslations("PeriodicalReports");
  const { ehrByNationalNumber_m } = usePeriodicalReports();
  const { data, isPending, isError } = ehrByNationalNumber_m;

  console.log("ehrByNationalNumber_m", {ehrByNationalNumber_m})

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {!data ? (
        /* No Data State - Show form as centered card */
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">{t("selectPeriod")}</CardTitle>
            </CardHeader>
            <CardContent>
              <PeriodicalReportsForm initialValues={props.initialValues} />
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Data Present State - Show filter and charts */
        <div className="space-y-6">
          {/* Filter Section - Compact horizontal layout */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("filterResults")}</h3>
                <PeriodicalReportsForm 
                  initialValues={props.initialValues} 
                  compact={true}
                />
              </div>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">{t("reportResults")}</h2>
            </div>

            {/* Loading State */}
            {isPending && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
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

            {/* Error State */}
            {isError && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="text-center text-destructive">
                    {t("errorMessage")}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charts Grid - Optimized for more space */}
            {data && !isPending && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Summary Cards */}
                <Card className="md:col-span-2 lg:col-span-1">
                  <CardHeader>
                    <CardTitle>{t("totalRecords")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-center text-primary">
                      {data.length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-1">
                  <CardHeader>
                    <CardTitle>{t("dateRange")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground text-center">
                      {t("selectedPeriod")}
                    </div>
                  </CardContent>
                </Card>

                {/* Chart Placeholders - Larger for better visualization */}
                <Card className="md:col-span-2 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>{t("chartPlaceholder")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-muted rounded flex items-center justify-center">
                      <span className="text-muted-foreground">{t("chartComingSoon")}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>{t("chartPlaceholder")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-muted rounded flex items-center justify-center">
                      <span className="text-muted-foreground">{t("chartComingSoon")}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>{t("chartPlaceholder")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-muted rounded flex items-center justify-center">
                      <span className="text-muted-foreground">{t("chartComingSoon")}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>{t("chartPlaceholder")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-muted rounded flex items-center justify-center">
                      <span className="text-muted-foreground">{t("chartComingSoon")}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Client;