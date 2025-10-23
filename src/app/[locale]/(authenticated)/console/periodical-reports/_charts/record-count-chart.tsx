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
import { format, newDate } from "date-fns-jalali";
import { digitsEnToFa } from "@persian-tools/persian-tools";

interface RecordCountChart {
  data: ElectronicHealthRecord[];
}

type ChartDataPoint = {
  date: string;
  count: number;
  formattedDate: string;
  timestamp: number;
};

const chartConfig: ChartConfig = {
  count: {
    label: "تعداد رکوردها",
    color: "hsl(var(--chart-1))",
  },
};

export const RecordCountChart: React.FC<RecordCountChart> = ({ data }) => {
  const t = useTranslations("RecordCountChart");

  // Process data to group by date and count records
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group records by date
    const dateGroups = data.reduce((acc, record) => {
      const date = record["تاريخ"];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {} as Record<string, number>);

    // Convert to chart data format and sort by date
    return Object.entries(dateGroups)
      .map(([date, count]) => {
        // Parse Jalali date string (yyyy/MM/dd) using date-fns-jalali
        const [year, month, day] = date.split("/").map(Number);
        const dateObj = newDate(year, month - 1, day);

        return {
          date,
          count,
          formattedDate: format(dateObj, "yyyy/MM/dd"),
          timestamp: dateObj.getTime(),
        } as ChartDataPoint;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
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
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="formattedDate"
          tickFormatter={(value) => digitsEnToFa(value)}
          textAnchor="middle"
          fontSize={12}
          tickMargin={12}
        />
        <YAxis
          tickFormatter={(value) => digitsEnToFa(value.toString())}
          fontSize={12}
          tickMargin={24}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => (
                <span className="font-medium">
                  {t("date")}: {digitsEnToFa(value as string)}
                </span>
              )}
              formatter={(value) => [
                digitsEnToFa(value.toString()),
                " ",
                t("recordCount"),
              ]}
            />
          }
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
};
