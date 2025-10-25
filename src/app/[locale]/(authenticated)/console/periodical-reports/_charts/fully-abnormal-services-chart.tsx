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

interface FullyAbnormalServicesChart {
  data: ElectronicHealthRecord[];
  onServiceClick?: (serviceName: string) => void;
  selectedService?: string | null;
}

type ChartDataPoint = {
  serviceName: string;
  abnormalCount: number;
  totalCount: number;
  isSelected?: boolean;
};

const fullyAbnormalChartConfig: ChartConfig = {
  abnormalCount: {
    label: "نتایج غیرطبیعی",
    color: "#ff8c00",
  },
};

export const FullyAbnormalServicesChart: React.FC<FullyAbnormalServicesChart> = ({ 
  data, 
  onServiceClick, 
  selectedService 
}) => {
  const t = useTranslations("ServiceCountChart");

  // Process data to get fully abnormal services
  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    // Helper function to check if a value is within normal range
    const isWithinNormalRange = (value: string, normalRange: string): boolean => {
      if (!value || !normalRange) return false;
      
      // Parse normal range (e.g., "0.2-1.2")
      const rangeMatch = normalRange.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
      if (!rangeMatch) return false;
      
      const minValue = parseFloat(rangeMatch[1]);
      const maxValue = parseFloat(rangeMatch[2]);
      const testValue = parseFloat(value);
      
      return testValue >= minValue && testValue <= maxValue;
    };

    // Helper function to check if a value is empty/null/blank
    const isEmpty = (value: string | undefined | null): boolean => {
      return !value || value.trim() === "";
    };

    // Filter valid data
    const validData = data.filter(record => {
      const testResult = record["جواب"];
      const normalRange = record["نرمال رنج"];
      return !isEmpty(testResult) && !isEmpty(normalRange);
    });

    // Process valid data for bar chart
    const serviceGroups = validData.reduce((acc, record) => {
      const serviceName = record["نام خدمت"];
      const testResult = record["جواب"];
      const normalRange = record["نرمال رنج"];
      
      if (!serviceName) return acc; // Skip records without service name
      
      if (!acc[serviceName]) {
        acc[serviceName] = {
          abnormalCount: 0,
          totalCount: 0,
        };
      }
      
      acc[serviceName].totalCount++;
      
      if (!isWithinNormalRange(testResult || "", normalRange || "")) {
        acc[serviceName].abnormalCount++;
      }
      
      return acc;
    }, {} as Record<string, { abnormalCount: number; totalCount: number }>);

    // Filter services where total count equals abnormal count (fully abnormal)
    const fullyAbnormalServices = Object.entries(serviceGroups)
      .filter(([_, counts]) => counts.totalCount === counts.abnormalCount)
      .map(([serviceName, counts]) => ({
        serviceName,
        abnormalCount: counts.abnormalCount,
        totalCount: counts.totalCount,
        isSelected: serviceName === selectedService,
      } as ChartDataPoint))
      .sort((a, b) => b.totalCount - a.totalCount); // Sort by total count descending

    return fullyAbnormalServices;
  }, [data, selectedService]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        هیچ خدمتی با نتایج کاملاً غیرطبیعی یافت نشد
      </div>
    );
  }

  return (
    <div className="w-full">
      <ChartContainer config={fullyAbnormalChartConfig} className="w-full">
        <BarChart
          data={chartData}
          margin={{
            left: -30,
            right: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="serviceName"
            tickFormatter={(value) => digitsEnToFa(value)}
            textAnchor="middle"
            fontSize={12}
            tickMargin={12}
            angle={-45}
            height={80}
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
                    {t("serviceName")}: {digitsEnToFa(value as string)}
                  </span>
                )}
                formatter={(value) => {
                  return [
                    digitsEnToFa(value.toString()),
                    " ",
                    "نتایج غیرطبیعی",
                  ];
                }}
              />
            }
          />
          <Bar
            dataKey="abnormalCount"
            fill="var(--color-abnormalCount)"
            radius={[4, 4, 4, 4]}
            onClick={(data, index) => {
              if (onServiceClick && chartData[index]) {
                onServiceClick(chartData[index].serviceName);
              }
            }}
            style={{ cursor: 'pointer' }}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
};
