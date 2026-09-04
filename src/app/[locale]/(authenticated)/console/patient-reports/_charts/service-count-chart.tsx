"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import { CHART_TICK_FONT_SIZE, CHART_TICK_FONT_SIZE_SM } from "@/lib/chart";

interface ServiceCountChart {
  data: ElectronicHealthRecord[];
}

type ChartDataPoint = {
  serviceName: string;
  count: number;
};

const chartConfig: ChartConfig = {
  count: {
    label: "تعداد خدمات",
    color: "var(--chart-1)",
  },
};

export const ServiceCountChart: React.FC<ServiceCountChart> = ({ data }) => {
  const t = useTranslations("common.ServiceCountChart");

  // Process data to group by service name and count occurrences
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group records by service name and count occurrences
    const serviceGroups = data.reduce((acc, record) => {
      const serviceName = record["نام خدمت"];
      if (!serviceName) return acc; // Skip records without service name

      if (!acc[serviceName]) {
        acc[serviceName] = 0;
      }
      acc[serviceName]++;
      return acc;
    }, {} as Record<string, number>);

    // Convert to chart data format and sort by count (descending)
    return Object.entries(serviceGroups)
      .map(
        ([serviceName, count]) =>
          ({
            serviceName,
            count,
          } as ChartDataPoint)
      )
      .sort((a, b) => b.count - a.count) // Sort by count descending
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {t("noDataAvailable")}
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="w-full">
      <BarChart
        data={chartData}
        margin={{
          left: -30,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="serviceName"
          tickFormatter={(value) => digitsEnToFa(value)}
          textAnchor="middle"
          fontSize={CHART_TICK_FONT_SIZE_SM}
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
                  {t("serviceName")}: {digitsEnToFa(value as string)}
                </span>
              )}
              formatter={(value) => [
                digitsEnToFa(String(value ?? "")),
                " ",
                t("serviceCount"),
              ]}
            />
          }
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
};
