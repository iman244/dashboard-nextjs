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

interface ServiceCountChart {
  data: ElectronicHealthRecord[];
  onServiceClick?: (serviceName: string) => void;
  selectedService?: string | null;
}

type ChartDataPoint = {
  serviceName: string;
  normalCount: number;
  abnormalCount: number;
  totalCount: number;
  isSelected?: boolean;
};

const serviceChartConfig: ChartConfig = {
  normalCount: {
    label: "نتایج طبیعی",
    color: "#000000",
  },
  abnormalCount: {
    label: "نتایج غیرطبیعی",
    color: "#ff8c00",
  },
};


export const ServiceCountChart: React.FC<ServiceCountChart> = ({ 
  data, 
  onServiceClick, 
  selectedService 
}) => {
  const t = useTranslations("ServiceCountChart");

  // Process data to get mixed results only
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
          normalCount: 0,
          abnormalCount: 0,
          totalCount: 0,
        };
      }
      
      acc[serviceName].totalCount++;
      
      if (isWithinNormalRange(testResult || "", normalRange || "")) {
        acc[serviceName].normalCount++;
      } else {
        acc[serviceName].abnormalCount++;
      }
      
      return acc;
    }, {} as Record<string, { normalCount: number; abnormalCount: number; totalCount: number }>);

    // Filter services with mixed results (exclude fully abnormal services)
    const mixedResultsData = Object.entries(serviceGroups)
      .filter(([, counts]) => counts.totalCount !== counts.abnormalCount) // Exclude fully abnormal
      .map(([serviceName, counts]) => ({
        serviceName,
        ...counts,
        isSelected: serviceName === selectedService,
      } as ChartDataPoint))
      .sort((a, b) => b.totalCount - a.totalCount); // Sort by total count descending

    return mixedResultsData;
  }, [data, selectedService]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        هیچ خدمتی با نتایج مختلط یافت نشد
      </div>
    );
  }

  return (
    <div className="w-full">
      <ChartContainer config={serviceChartConfig} className="w-full">
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
            tickMargin={36}
            angle={-90}
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
                formatter={(value, name) => {
                  const label = name === "normalCount" ? "نتایج طبیعی" : "نتایج غیرطبیعی";
                  return [
                    digitsEnToFa(value.toString()),
                    " ",
                    label,
                  ];
                }}
              />
            }
          />
          <Bar
            dataKey="normalCount"
            stackId="a"
            fill="var(--color-normalCount)"
            radius={[0, 0, 0, 0]}
            onClick={(data, index) => {
              if (onServiceClick && chartData[index]) {
                onServiceClick(chartData[index].serviceName);
              }
            }}
            style={{ cursor: 'pointer' }}
          />
          <Bar
            dataKey="abnormalCount"
            stackId="a"
            fill="var(--color-abnormalCount)"
            radius={[4, 4, 0, 0]}
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

// {/* Missing Data Pie Chart */}
// {missingData.length > 0 && (
//   <div>
//     <h3 className="text-lg font-semibold mb-4">داده‌های ناقص</h3>
//     <ChartContainer config={missingDataChartConfig} className="w-full max-w-md mx-auto">
//       <PieChart>
//         <Pie
//           data={missingData}
//           cx="50%"
//           cy="50%"
//           labelLine={false}
//           label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//           outerRadius={80}
//           fill="#8884d8"
//           dataKey="value"
//         >
//           {missingData.map((entry, index) => (
//             <Cell key={`cell-${index}`} fill={entry.color} />
//           ))}
//         </Pie>
//         <ChartTooltip
//           content={
//             <ChartTooltipContent
//               formatter={(value) => [
//                 digitsEnToFa(value.toString()),
//                 " رکورد"
//               ]}
//             />
//           }
//         />
//       </PieChart>
//     </ChartContainer>
//   </div>
// )}