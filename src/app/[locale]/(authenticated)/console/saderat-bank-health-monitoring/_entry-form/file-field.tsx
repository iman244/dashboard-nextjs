"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localeDigits } from "@/lib/utils";
import { uploadToField } from "@/data/patient-entry/upload";
import {
  labelOf,
  type FileDescriptor,
  type FileFieldDefinition,
} from "@/data/patient-entry/types";

export type FileFieldProps = {
  field: FileFieldDefinition;
  monitoring: number;
  nationalId: string;
  value: FileDescriptor[];
  onChange: (next: FileDescriptor[]) => void;
  disabled?: boolean;
};

/**
 * One declared `file` field: a picker constrained by `accept`, the files
 * already attached, and per-file upload progress.
 *
 * Controlled -- the parent owns the whole descriptor list, because the entry
 * is saved as one payload and a field that kept its own copy would drift.
 */
export const FileField = ({
  field,
  monitoring,
  nationalId,
  value,
  onChange,
  disabled,
}: FileFieldProps) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.PatientEntryDialog"
  );
  const locale = useLocale();
  const [progress, setProgress] = React.useState<Record<string, number>>({});
  const [error, setError] = React.useState<string | null>(null);

  const atCapacity =
    field.max_count !== undefined && value.length >= field.max_count;

  const onPick = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(event.target.files ?? []);
      // Cleared straight away so picking the same file twice still fires.
      event.target.value = "";
      if (picked.length === 0) return;
      setError(null);

      let next = value;
      for (const file of picked) {
        try {
          const descriptor = await uploadToField({
            monitoring,
            nationalId,
            fieldKey: field.key,
            file,
            onProgress: (percent) =>
              setProgress((current) => ({ ...current, [file.name]: percent })),
          });
          next = [...next, descriptor];
          onChange(next);
        } catch {
          // Django's message is the precise one but it is not translated;
          // show a localized line rather than leaking an English string.
          setError(t("UploadFailed", { name: file.name }));
        } finally {
          setProgress((current) => {
            const remaining = { ...current };
            delete remaining[file.name];
            return remaining;
          });
        }
      }
    },
    [field.key, monitoring, nationalId, onChange, t, value]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={`field-${field.key}`}>
        {labelOf(field, locale)}
        {field.required ? (
          <span className="text-destructive ms-1" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>

      <Input
        id={`field-${field.key}`}
        type="file"
        multiple={field.multiple}
        accept={field.accept?.join(",")}
        onChange={onPick}
        disabled={disabled || atCapacity}
      />

      {field.max_size_mb ? (
        <p className="text-muted-foreground text-xs">
          {t("MaxSize", { size: localeDigits(field.max_size_mb, locale) })}
        </p>
      ) : null}

      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="space-y-1">
        {value.map((descriptor) => (
          <li
            key={descriptor.key}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="truncate">{descriptor.original_name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("RemoveFile", { name: descriptor.original_name })}
              disabled={disabled}
              onClick={() =>
                onChange(value.filter((item) => item.key !== descriptor.key))
              }
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </li>
        ))}
        {Object.entries(progress).map(([name, percent]) => (
          <li key={name} className="text-muted-foreground text-sm">
            {name} — {localeDigits(percent, locale)}%
          </li>
        ))}
      </ul>
    </div>
  );
};
