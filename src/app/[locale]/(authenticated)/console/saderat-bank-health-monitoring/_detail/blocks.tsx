"use client";

import React from "react";
import { useLocale } from "next-intl";
import { AlertCircle, CheckCircle2, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCellValue } from "@/lib/utils";

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
  value: string | number | null,
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
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  }
  if (str === "بالا" || str === "high" || str.includes("abnormal")) {
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
  return null;
};

/** Blank, or the "not performed" marker the workbook writes. */
export const isBlank = (v: unknown) =>
  v === null || v === undefined || v === "" || v === "انجام نشده";

/** Answers that mean "yes, this applies to me" — the ones worth reading. */
const AFFIRMATIVE = new Set(["بله", "بلي", "بلی", "دارم", "مثبت", "yes", "y"]);

/**
 * Some workbook cells are a whole screening checklist flattened into one string:
 *
 *   "چربي خون بالا / خیر, فشارخون بالا / خیر, بيماري هاي كليوي / خیر, …"
 *
 * Eighteen question/answer pairs in a single field. Rendered as one `<Badge>`
 * that is an unreadable pill several lines tall, which is what the medical
 * history card was doing.
 *
 * Every segment must carry a separator before this claims a match — prose that
 * merely contains commas must not be torn into fake pairs.
 */
export const parseChecklist = (
  value: unknown,
): { label: string; answer: string }[] | null => {
  if (typeof value !== "string") return null;
  const parts = value
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 3) return null;

  const pairs: { label: string; answer: string }[] = [];
  for (const part of parts) {
    const i = part.lastIndexOf("/");
    if (i === -1) return null;
    const label = part.slice(0, i).trim();
    const answer = part.slice(i + 1).trim();
    if (!label || !answer) return null;
    pairs.push({ label, answer });
  }
  return pairs;
};

/**
 * A parsed checklist. Spans the full row rather than sitting in one column of
 * the section grid — eighteen rows is not a peer of a single badge — and puts
 * the affirmative answers in `destructive` so the few that matter are findable
 * without reading all of them. Negatives stay muted but present: this is a
 * clinical record, so nothing is hidden behind a summary.
 */
const ChecklistRows = ({
  pairs,
}: {
  pairs: { label: string; answer: string }[];
}) => {
  const locale = useLocale();
  return (
    <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
      {pairs.map(({ label: name, answer }) => {
        const positive = AFFIRMATIVE.has(answer.toLowerCase());
        return (
          <li
            key={name}
            className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5"
          >
            <span
              className={cn(
                "text-sm",
                positive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {formatCellValue(name, locale)}
            </span>
            <span
              className={cn(
                "shrink-0 text-xs font-medium",
                positive ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {formatCellValue(answer, locale)}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

const ChecklistItem = ({
  label,
  pairs,
}: {
  label: string;
  pairs: { label: string; answer: string }[];
}) => (
  <div className="md:col-span-2 flex flex-col gap-3 p-3 border rounded-lg">
    <div className="text-xs text-muted-foreground">{label}</div>
    <ChecklistRows pairs={pairs} />
  </div>
);

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

/**
 * One reading in a section grid: label, verdict badge, status mark, note.
 *
 * Two shapes, both step-1's. With an `icon` it is step-1's clinical-exam row
 * — the icon leading, label above the badge. Without one it is step-1's lab
 * row — label above, badge and status mark on one line. The note, when there
 * is one, sits underneath either way.
 */
export const BadgeItem = ({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string | number | null;
  note?: unknown;
  icon?: LucideIcon;
}) => {
  const locale = useLocale();

  // A flattened screening checklist is a list, not a status pill.
  const checklist = parseChecklist(value);
  if (checklist) return <ChecklistItem label={label} pairs={checklist} />;

  const noteEl = !isBlank(note) ? (
    <p className="text-xs text-muted-foreground italic whitespace-pre-line">
      {formatCellValue(note as string, locale)}
    </p>
  ) : null;

  if (Icon) {
    return (
      <div className="flex items-start gap-3 p-3 border rounded-lg">
        <Icon
          aria-hidden="true"
          className="h-5 w-5 mt-0.5 text-muted-foreground"
        />
        <div className="flex-1">
          <div className="font-medium text-sm">{label}</div>
          <Badge variant={getStatusColor(value)} className="mt-1 text-xs">
            {value != null ? formatCellValue(value, locale) : "-"}
          </Badge>
          {noteEl}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <Badge variant={getStatusColor(value)} className="text-xs">
          {value != null ? formatCellValue(value, locale) : "-"}
        </Badge>
        {getStatusIcon(value)}
      </div>
      {noteEl}
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
  const checklist = parseChecklist(value);
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
        {/* Free-text cells sometimes carry a flattened checklist too, so they
            get the same treatment rather than one long run of text. */}
        {checklist ? (
          <ChecklistRows pairs={checklist} />
        ) : (
          <p className="text-sm whitespace-pre-line">
            {formatCellValue(value as string, locale)}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
