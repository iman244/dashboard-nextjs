"use client";

import React from "react";
import { useLocale } from "next-intl";
import { AlertCircle, CheckCircle2, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCellValue } from "@/lib/utils";

/**
 * The step-1 person page's presentation, extracted so step-2 can read the
 * same way.
 *
 * Deliberately a copy of step-1's markup rather than an improvement on it —
 * the point is that the two pages look alike, so this matches the original
 * classes, variants and thresholds exactly. step-1 still renders its own
 * inline copy and is untouched.
 */

export const getStatusColor = (
  value: string | number | null
): "default" | "secondary" | "destructive" | "outline" => {
  if (value === null || value === undefined) return "secondary";
  const str = String(value).toLowerCase();
  if (str === "طبیعی" || str === "طبيعي" || str === "normal") return "default";
  if (str === "بالا" || str === "high" || str.includes("abnormal"))
    return "destructive";
  if (str === "پایین" || str === "low") return "destructive";
  return "secondary";
};

export const getStatusIcon = (value: string | number | null) => {
  if (value === null || value === undefined) return null;
  const str = String(value).toLowerCase();
  if (str === "طبیعی" || str === "طبيعي" || str === "normal") {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  if (str === "بالا" || str === "high" || str.includes("abnormal")) {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
  return null;
};

/** Blank, or the "not performed" marker the workbook writes. */
export const isBlank = (v: unknown) =>
  v === null || v === undefined || v === "" || v === "انجام نشده";

/** A vital sign: big number, with its verdict underneath when there is one. */
export const StatCard = ({
  icon: Icon,
  label,
  value,
  group,
  unit,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  group?: string | number | null;
  unit?: string;
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <Icon aria-hidden="true" className="h-4 w-4" />
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {value}
        {unit ? ` ${unit}` : ""}
      </div>
      {!isBlank(group) && (
        <Badge variant={getStatusColor(group ?? null)} className="mt-2">
          {group}
        </Badge>
      )}
    </CardContent>
  </Card>
);

/** A titled section, matching step-1's Card + icon heading. */
export const SectionCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Icon aria-hidden="true" className="h-5 w-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

/** One reading in a section grid: label, verdict badge, status mark, note. */
export const BadgeItem = ({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number | null;
  note?: unknown;
}) => {
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <Badge variant={getStatusColor(value)} className="text-xs">
          {value != null ? formatCellValue(value, locale) : "-"}
        </Badge>
        {getStatusIcon(value)}
      </div>
      {!isBlank(note) && (
        <p className="text-xs text-muted-foreground italic whitespace-pre-line">
          {formatCellValue(note as string, locale)}
        </p>
      )}
    </div>
  );
};

/** Free text that deserves its own full-width card. */
export const TextCard = ({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: unknown;
}) => {
  const locale = useLocale();
  if (isBlank(value)) return null;
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon aria-hidden="true" className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-line">
          {formatCellValue(value as string, locale)}
        </p>
      </CardContent>
    </Card>
  );
};
