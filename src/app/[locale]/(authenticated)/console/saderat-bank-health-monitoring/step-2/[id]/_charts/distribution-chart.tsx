"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { LocaleChartTooltip } from "../../../_charts/locale-tooltip";
import { CHART_TICK_FONT_SIZE } from "@/lib/chart";
import { useLocaleDigits } from "@/lib/use-locale-digits";
import type { DistributionDatum } from "../_data/use-step2-report";

const chartConfig = { value: { label: "value" } };

/**
 * One distribution as a bar chart. This is the block the step-1 page repeats
 * 22 times; here it exists once and the config array supplies the differences.
 */
export const DistributionChart = ({
  title,
  data,
  onBarClick,
}: {
  title: string;
  data: DistributionDatum[];
  onBarClick?: (name: string) => void;
}) => {
  const fmt = useLocaleDigits();

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickFormatter={fmt}
              fontSize={CHART_TICK_FONT_SIZE}
            />
            <YAxis
              tickMargin={24}
              tickFormatter={fmt}
              fontSize={CHART_TICK_FONT_SIZE}
            />
            <ChartTooltip content={<LocaleChartTooltip />} />
            <Bar
              dataKey="value"
              // One hue for every distribution, matching step-1. Each chart is a
              // single series, so colour carries no information here — the bars
              // are already told apart by the axis. Cycling chart-1..5 across
              // twenty charts implied a relationship between them that does not
              // exist, which is the pattern VIS-17 removed from step-1.
              fill="var(--chart-1)"
              barSize={40}
              onClick={(_, index) => onBarClick?.(data[index].name)}
              style={{ cursor: onBarClick ? "pointer" : undefined }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
