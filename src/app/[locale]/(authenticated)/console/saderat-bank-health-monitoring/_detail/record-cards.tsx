"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, localeDigits } from "@/lib/utils";
import { verdictOf } from "./verdict";

export const isEmpty = (v: unknown) =>
  v === null || v === undefined || v === "";

/**
 * A group of excel columns, rendered as one card.
 *
 * `fields` is typed against the step's own record, so a column that stops
 * existing upstream is a compile error rather than a blank card.
 */
export type FieldGroup<K extends string> = {
  titleKey: string;
  fields: K[];
};

/** One field, its paired note when the step has one, and its verdict tone. */
const FieldRow = ({
  label,
  value,
  note,
  locale,
}: {
  label: string;
  value: unknown;
  note?: unknown;
  locale: string;
}) => {
  const verdict = verdictOf(value);
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        {verdict === "normal" && (
          <CheckCircle2
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          />
        )}
        {verdict === "abnormal" && (
          <AlertCircle
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-destructive"
          />
        )}
        <span
          className={cn(
            "text-sm",
            verdict === "abnormal" && "font-medium text-destructive"
          )}
        >
          {localeDigits(String(value), locale)}
        </span>
      </span>
      {!isEmpty(note) && (
        <span className="text-xs text-muted-foreground italic">
          {localeDigits(String(note), locale)}
        </span>
      )}
    </div>
  );
};

/**
 * The person view, for either step.
 *
 * Both steps read the same way — the same grid, cards, rows and verdict marks
 * — and differ only in the config they pass. Where their columns diverge, the
 * groups diverge; the presentation does not.
 */
export const RecordCards = <K extends string>({
  groups,
  record,
  noteKeyFor,
}: {
  groups: FieldGroup<K>[];
  record: Record<string, unknown>;
  /** Step-2 pairs `توضیحات X` notes to their field; step-1 has no notes. */
  noteKeyFor?: (field: K) => K | undefined;
}) => {
  const t = useTranslations("/console/saderat-bank-health-monitoring.Detail");
  const locale = useLocale();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((group) => {
        // only fields this person actually has
        const rows = group.fields.filter((f) => !isEmpty(record[f]));
        if (rows.length === 0) return null;
        return (
          <Card key={group.titleKey}>
            <CardHeader>
              <CardTitle>{t(group.titleKey)}</CardTitle>
            </CardHeader>
            <CardContent>
              {rows.map((field) => {
                const noteKey = noteKeyFor?.(field);
                return (
                  <FieldRow
                    key={field}
                    label={field}
                    value={record[field]}
                    note={noteKey ? record[noteKey] : undefined}
                    locale={locale}
                  />
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
