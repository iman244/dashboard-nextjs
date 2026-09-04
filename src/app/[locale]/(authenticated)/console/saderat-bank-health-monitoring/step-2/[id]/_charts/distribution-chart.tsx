"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { LocaleChartTooltip } from "../../../_charts/locale-tooltip";
import type { DistributionDatum } from "../_data/use-step2-report";

const chartConfig = { value: { label: "value" } };

/**
 * One distribution as a bar chart. This is the block the step-1 page repeats
 * 22 times; here it exists once and the config array supplies the differences.
 */
export const DistributionChart = ({
  title,
  data,
  color,
  onBarClick,
}: {
  title: string;
  data: DistributionDatum[];
  color: 1 | 2 | 3 | 4 | 5;
  onBarClick?: (name: string) => void;
}) => {
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
              tickFormatter={(value) => digitsEnToFa(String(value ?? ""))}
              fontSize={12}
            />
            <YAxis
              tickMargin={24}
              tickFormatter={(value) => digitsEnToFa(String(value ?? ""))}
              fontSize={12}
            />
            <ChartTooltip content={<LocaleChartTooltip />} />
            <Bar
              dataKey="value"
              fill={`var(--chart-${color})`}
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
