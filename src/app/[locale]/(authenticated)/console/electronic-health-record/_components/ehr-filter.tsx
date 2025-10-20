"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns-jalali";
import { type DateRange } from "react-day-picker";
import { DayPicker } from "react-day-picker/persian";
import { useElectronicHealthRecord } from "../provider";

interface EHRFilterProps {
  isLoading?: boolean;
}

/**
 * EHR Filter Component
 * Provides filtering options for national number, date range, and patient type
 */
export const EHRFilter = ({ isLoading = false }: EHRFilterProps) => {
  const t = useTranslations("EHRFilter");
  const [nationalNumber, setNationalNumber] = useState("");
  const [patientType, setPatientType] = useState("2");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    console.log({ nationalNumber });
  }, [nationalNumber]);
  useEffect(() => {
    console.log({ patientType });
  }, [patientType]);
  useEffect(() => {
    console.log({ dateRange });
  }, [dateRange]);

  const { setFilters } = useElectronicHealthRecord();

  // Patient type options (you can customize these based on your requirements)
  const patientTypeOptions = [{ value: "2", label: "نوع بیمار 2" }];

  const handleSearch = () => {
    console.log({
      nationalNumber,
      fromDate: dateRange?.from ? format(dateRange.from, "yyyy/MM/dd") : "",
      toDate: dateRange?.to ? format(dateRange.to, "yyyy/MM/dd") : "",
      patientType,
    });
    // setFilters({
    //   nationalNumber: nationalNumber,
    //   fromDate: dateRange?.from ? format(dateRange.from, "yyyy/MM/dd") : "",
    //   toDate: dateRange?.to ? format(dateRange.to, "yyyy/MM/dd") : "",
    //   patientType: patientType,
    // });
  };

  const handleClear = () => {
    const clearedFilters = {
      nationalNumber: "",
      fromDate: "",
      toDate: "",
      patientType: "25",
    };
    setFilters(clearedFilters);
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* National Number Input */}
          <div className="space-y-2">
            <Label htmlFor="nationalNumber">{t("nationalNumber")}</Label>
            <Input
              id="nationalNumber"
              placeholder={t("nationalNumberPlaceholder")}
              value={nationalNumber}
              onChange={(e) => setNationalNumber(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Date Range Picker */}
          <div className="space-y-2">
            <Label>{t("dateRange")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "yyyy/MM/dd")} -{" "}
                        {format(dateRange.to, "yyyy/MM/dd")}
                      </>
                    ) : (
                      format(dateRange.from, "yyyy/MM/dd")
                    )
                  ) : (
                    <span>{t("selectDateRange")}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className="rounded-lg border shadow-sm"
                  numerals="latn"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Patient Type Selector */}
          <div className="space-y-2">
            <Label htmlFor="patientType">{t("patientType")}</Label>
            <Select value={patientType} onValueChange={setPatientType}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectPatientType")} />
              </SelectTrigger>
              <SelectContent>
                {patientTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {t("search")}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isLoading}
            >
              {t("clear")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
