"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { digitsFaToEn } from "@persian-tools/persian-tools";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type { MonitoringType } from "@/data/monitoring-type/types";
import type { PatientEntry } from "@/data/patient-entry/types";
import { uploadToField } from "@/data/patient-entry/upload";
import { useCreate_PatientEntry_API } from "@/data/patient-entry/api/create";
import { useUpdate_PatientEntry_API } from "@/data/patient-entry/api/update";
import {
  SchemaForm,
  asFieldSchema,
  formProblems,
  type AttachedImage,
  type SchemaField,
  type SchemaFormValues,
} from "@/components/schema-form";

/** Every string in a DRF error body, flattened, for a toast description. */
const serverMessages = (data: unknown): string[] => {
  if (!data || typeof data !== "object") return [];
  return Object.values(data as Record<string, unknown>).flatMap((value) =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : typeof value === "string"
        ? [value]
        : []
  );
};

const initialValues = (entry?: PatientEntry): SchemaFormValues => {
  const images: Record<string, AttachedImage[]> = {};
  for (const file of entry?.files ?? []) {
    images[file.field_key] = [
      ...(images[file.field_key] ?? []),
      {
        id: file.key,
        name: file.original_name,
        url: file.url ?? undefined,
        contentType: file.content_type,
        size: file.size,
      },
    ];
  }
  return {
    digits: (entry?.values as Record<string, string> | undefined) ?? {},
    images,
  };
};

/**
 * One patient's record, on a page of its own.
 *
 * Create and edit share this component. On create, every field is visible
 * from the start and the image pickers are disabled until there is a national
 * ID to file uploads under. Nothing is looked up while the ID is being typed:
 * the previous version queried on every keystroke and rebuilt the form each
 * time, so the fields flashed in and out. An ID that already has a record is
 * caught by the server's 409 on save, which then opens that record instead.
 */
export const RecordForm = ({
  monitoring,
  entry,
  onSaved,
  onExisting,
}: {
  monitoring: MonitoringType;
  /** Present when editing; its national ID is then fixed. */
  entry?: PatientEntry;
  onSaved: () => void;
  /** Called with the id of the record that already holds this national ID. */
  onExisting: (id: number) => void;
}) => {
  const t = useTranslations("/console/monitorings.Records");
  const queryClient = useQueryClient();

  const schema = React.useMemo(
    () => asFieldSchema(monitoring.field_schema),
    [monitoring]
  );

  const [nationalId, setNationalId] = React.useState(entry?.national_id ?? "");
  const [values, setValues] = React.useState<SchemaFormValues>(() =>
    initialValues(entry)
  );
  const [attempted, setAttempted] = React.useState(false);

  // Folded before use: a Persian keyboard types ۰۱۲, Django stores 012.
  const folded = digitsFaToEn(nationalId).replace(/[^0-9]/g, "");

  const create = useCreate_PatientEntry_API();
  const update = useUpdate_PatientEntry_API();
  const saving = create.isPending || update.isPending;

  const onAddImage = React.useCallback(
    async (
      field: SchemaField,
      file: File,
      onProgress: (percent: number) => void
    ): Promise<AttachedImage> => {
      const descriptor = await uploadToField({
        monitoring: monitoring.id,
        nationalId: folded,
        fieldKey: field.key,
        file,
        onProgress,
      });
      return {
        id: descriptor.key,
        name: descriptor.original_name,
        url: URL.createObjectURL(file),
        contentType: descriptor.content_type,
        size: descriptor.size,
      };
    },
    [folded, monitoring.id]
  );

  const onSubmit = React.useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      setAttempted(true);
      if (!folded || formProblems(schema, values).length > 0) {
        toast.error(t("FixErrors"));
        return;
      }

      const files = Object.entries(values.images).flatMap(([fieldKey, list]) =>
        list.map((image) => ({
          field_key: fieldKey,
          key: image.id,
          original_name: image.name,
          content_type: image.contentType ?? "application/octet-stream",
          size: image.size ?? 0,
        }))
      );

      const done = () => {
        queryClient.invalidateQueries({ queryKey: ["patient-entries"] });
        toast.success(t("Saved"));
        onSaved();
      };
      const failed = (error: {
        response?: { status?: number; data?: unknown };
      }) => {
        const data = error.response?.data as { id?: number } | undefined;
        if (error.response?.status === 409 && data?.id) {
          toast.info(t("AlreadyExists"));
          onExisting(data.id);
          return;
        }
        toast.error(t("SaveFailed"), {
          description: serverMessages(error.response?.data).join(" "),
        });
      };

      if (entry) {
        update.mutate(
          { id: entry.id, payload: { values: values.digits, files } },
          { onSuccess: done, onError: failed }
        );
      } else {
        create.mutate(
          {
            payload: {
              monitoring: monitoring.id,
              national_id: folded,
              values: values.digits,
              files,
            },
          },
          { onSuccess: done, onError: failed }
        );
      }
    },
    [
      create,
      entry,
      folded,
      monitoring.id,
      onExisting,
      onSaved,
      queryClient,
      schema,
      t,
      update,
      values,
    ]
  );

  const nationalIdMissing = attempted && !folded;

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-8" noValidate>
      <div className="space-y-2">
        <Label htmlFor="record-national-id">
          {t("NationalId")}
          <span className="text-destructive ms-1" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="record-national-id"
          dir="ltr"
          className="text-start"
          inputMode="numeric"
          autoComplete="off"
          value={nationalId}
          // Fixed once a record exists: it is the record's identity, and the
          // uploads already made are filed under it.
          readOnly={Boolean(entry)}
          disabled={saving}
          placeholder={t("NationalIdPlaceholder")}
          aria-invalid={nationalIdMissing ? true : undefined}
          onChange={(event) => setNationalId(event.target.value)}
        />
        {nationalIdMissing ? (
          <p className="text-destructive text-xs" role="alert">
            {t("NationalIdRequired")}
          </p>
        ) : null}
      </div>

      <SchemaForm
        schema={schema}
        values={values}
        onChange={setValues}
        onAddImage={onAddImage}
        disabled={saving}
        showErrors={attempted}
        imagesDisabledHint={folded ? undefined : t("EnterNationalIdFirst")}
      />

      <Button type="submit" disabled={saving}>
        {saving ? <Spinner className="me-2 size-4" /> : null}
        {entry ? t("SaveChanges") : t("AddRecord")}
      </Button>
    </form>
  );
};
