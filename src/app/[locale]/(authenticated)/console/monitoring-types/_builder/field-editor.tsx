"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { localeDigits } from "@/lib/utils";
import {
  DIGIT_STRING,
  IMAGE,
  isMultiple,
  type FieldSchema,
  type SchemaField,
} from "@/components/schema-form";

/** A number input that yields `undefined` when cleared, never NaN or 0. */
const optionalNumber = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed.replace(/[^0-9]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export const FieldEditor = ({
  field,
  schema,
  onChange,
  onRemove,
  onMove,
}: {
  field: SchemaField;
  schema: FieldSchema;
  onChange: (patch: Partial<SchemaField>) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
}) => {
  const t = useTranslations("/console/monitoring-types.Builder");
  const locale = useLocale();
  const [advanced, setAdvanced] = React.useState(false);
  const sections = schema.sections ?? [];

  return (
    <div className="border-border space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {field.type === DIGIT_STRING ? t("TypeDigitString") : t("TypeImage")}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("MoveUp")}
            onClick={() => onMove(-1)}
          >
            <ChevronUp className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("MoveDown")}
            onClick={() => onMove(1)}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("RemoveField")}
            onClick={onRemove}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`${field.key}-label-fa`}>{t("LabelFa")}</Label>
          <Input
            id={`${field.key}-label-fa`}
            value={field.label_fa}
            onChange={(event) => onChange({ label_fa: event.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${field.key}-label-en`}>{t("LabelEn")}</Label>
          <Input
            id={`${field.key}-label-en`}
            dir="ltr"
            value={field.label_en}
            onChange={(event) => onChange({ label_en: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id={`${field.key}-required`}
            checked={Boolean(field.required)}
            onCheckedChange={(checked) => onChange({ required: checked })}
          />
          <Label htmlFor={`${field.key}-required`}>{t("Required")}</Label>
        </div>

        {field.type === IMAGE ? (
          <div className="flex items-center gap-2">
            <Switch
              id={`${field.key}-multiple`}
              checked={isMultiple(field)}
              onCheckedChange={(checked) =>
                onChange({
                  multiple: checked,
                  // A single-image field cannot also permit three.
                  max_count: checked ? field.max_count : undefined,
                })
              }
            />
            <Label htmlFor={`${field.key}-multiple`}>{t("AllowMany")}</Label>
          </div>
        ) : null}

        {sections.length > 0 ? (
          <div className="flex items-center gap-2">
            <Label htmlFor={`${field.key}-section`}>{t("Section")}</Label>
            <Select
              value={field.section ?? "__none__"}
              onValueChange={(value) =>
                onChange({ section: value === "__none__" ? undefined : value })
              }
            >
              <SelectTrigger id={`${field.key}-section`} className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("NoSection")}</SelectItem>
                {sections.map((section) => (
                  <SelectItem key={section.key} value={section.key}>
                    {locale === "fa" ? section.title_fa : section.title_en}
                    {!section.title_fa && !section.title_en
                      ? section.key
                      : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setAdvanced((current) => !current)}
      >
        {advanced ? t("HideAdvanced") : t("ShowAdvanced")}
      </Button>

      {advanced ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {field.type === DIGIT_STRING ? (
            <>
              <div className="space-y-1">
                <Label htmlFor={`${field.key}-min`}>{t("MinLength")}</Label>
                <Input
                  id={`${field.key}-min`}
                  inputMode="numeric"
                  dir="ltr"
                  value={
                    field.min_length === undefined
                      ? ""
                      : localeDigits(field.min_length, locale)
                  }
                  onChange={(event) =>
                    onChange({ min_length: optionalNumber(event.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${field.key}-max`}>{t("MaxLength")}</Label>
                <Input
                  id={`${field.key}-max`}
                  inputMode="numeric"
                  dir="ltr"
                  value={
                    field.max_length === undefined
                      ? ""
                      : localeDigits(field.max_length, locale)
                  }
                  onChange={(event) =>
                    onChange({ max_length: optionalNumber(event.target.value) })
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label htmlFor={`${field.key}-size`}>{t("MaxSizeMb")}</Label>
                <Input
                  id={`${field.key}-size`}
                  inputMode="numeric"
                  dir="ltr"
                  value={
                    field.max_size_mb === undefined
                      ? ""
                      : localeDigits(field.max_size_mb, locale)
                  }
                  onChange={(event) =>
                    onChange({
                      max_size_mb: optionalNumber(event.target.value),
                    })
                  }
                />
              </div>
              {isMultiple(field) ? (
                <div className="space-y-1">
                  <Label htmlFor={`${field.key}-count`}>{t("MaxCount")}</Label>
                  <Input
                    id={`${field.key}-count`}
                    inputMode="numeric"
                    dir="ltr"
                    value={
                      field.max_count === undefined
                        ? ""
                        : localeDigits(field.max_count, locale)
                    }
                    onChange={(event) =>
                      onChange({
                        max_count: optionalNumber(event.target.value),
                      })
                    }
                  />
                </div>
              ) : null}
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor={`${field.key}-key`}>{t("FieldKey")}</Label>
            <Input
              id={`${field.key}-key`}
              dir="ltr"
              value={field.key}
              onChange={(event) =>
                onChange({
                  // Forced into Django's shape as it is typed, rather than
                  // rejected on save with a regex nobody wants to read.
                  key: event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, "_")
                    .replace(/^[^a-z]+/, ""),
                })
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};
