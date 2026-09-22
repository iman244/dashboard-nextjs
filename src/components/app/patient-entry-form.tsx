"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { digitsFaToEn } from "@persian-tools/persian-tools";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type { MonitoringType } from "@/data/monitoring-type/types";
import type { PatientEntry } from "@/data/patient-entry/types";
import { uploadToField } from "@/data/patient-entry/upload";
import { useList_PatientEntry_API } from "@/data/patient-entry/api/list";
import { useCreate_PatientEntry_API } from "@/data/patient-entry/api/create";
import { useUpdate_PatientEntry_API } from "@/data/patient-entry/api/update";
import {
  SchemaForm,
  asFieldSchema,
  type AttachedImage,
  type FieldSchema,
  type SchemaField,
  type SchemaFormValues,
} from "@/components/schema-form";

/**
 * One patient's entry, rendered from the monitoring type's schema.
 *
 * Lives here rather than beside a route because two screens use it: the
 * dedicated recording page, and the shortcut dialog on the monitoring list
 * where the batch is already chosen.
 *
 * The same `SchemaForm` the builder previews. The only thing this screen adds
 * is where the bytes go: `uploadToField` presigns and PUTs to object storage,
 * where the preview merely made a blob URL.
 */
const EntryFields = ({
  monitoring,
  nationalId,
  schema,
  entry,
  onSaved,
}: {
  monitoring: number;
  nationalId: string;
  schema: FieldSchema;
  entry?: PatientEntry;
  onSaved: () => void;
}) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.PatientEntryDialog"
  );

  // Seeded from the looked-up entry; this component is remounted by `key`
  // when that changes, so no effect copies server state into state.
  const [values, setValues] = React.useState<SchemaFormValues>(() => {
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
  });

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
        monitoring,
        nationalId,
        fieldKey: field.key,
        file,
        onProgress,
      });
      // The S3 key is the identity: it is unique per object and it is what the
      // save payload carries back to Django, along with the true size that
      // Django re-checks against the bucket.
      return {
        id: descriptor.key,
        name: descriptor.original_name,
        contentType: descriptor.content_type,
        size: descriptor.size,
      };
    },
    [monitoring, nationalId]
  );

  const onSave = React.useCallback(() => {
    const files = Object.entries(values.images).flatMap(([fieldKey, images]) =>
      images.map((image) => ({
        field_key: fieldKey,
        key: image.id,
        original_name: image.name,
        content_type: image.contentType ?? "application/octet-stream",
        size: image.size ?? 0,
      }))
    );

    const handlers = {
      onSuccess: () => {
        toast.success(t("Saved"));
        onSaved();
      },
      onError: () => toast.error(t("SaveFailed")),
    };

    if (entry) {
      update.mutate(
        { id: entry.id, payload: { values: values.digits, files } },
        handlers
      );
    } else {
      create.mutate(
        {
          payload: {
            monitoring,
            national_id: nationalId,
            values: values.digits,
            files,
          },
        },
        handlers
      );
    }
  }, [create, entry, monitoring, nationalId, onSaved, t, update, values]);

  return (
    <div className="space-y-6">
      <SchemaForm
        schema={schema}
        values={values}
        onChange={setValues}
        onAddImage={onAddImage}
        disabled={saving}
      />
      <Button type="button" onClick={onSave} disabled={saving}>
        {saving ? <Spinner className="me-2 size-4" /> : null}
        {t("Save")}
      </Button>
    </div>
  );
};

export const EntryForm = ({
  monitoring,
  type,
}: {
  monitoring: number;
  type?: MonitoringType;
}) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.PatientEntryDialog"
  );

  const [nationalId, setNationalId] = React.useState("");
  // Folded before it is used for anything: a Persian keyboard produces ۰۱۲ and
  // Django stores 012, so an unfolded lookup misses the row that exists.
  const folded = digitsFaToEn(nationalId).trim();

  const schema = React.useMemo(
    () => asFieldSchema(type?.field_schema),
    [type]
  );

  const lookup = useList_PatientEntry_API({
    monitoring,
    nationalId: folded.length > 0 ? folded : undefined,
  });
  const entry = folded.length > 0 ? lookup.data?.[0] : undefined;

  if (schema.fields.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("NoFields")}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="entry-national-id">{t("NationalId")}</Label>
        <Input
          id="entry-national-id"
          dir="ltr"
          inputMode="numeric"
          autoComplete="off"
          value={nationalId}
          placeholder={t("NationalIdPlaceholder")}
          onChange={(event) => setNationalId(event.target.value)}
        />
      </div>

      {folded.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("EnterNationalId")}</p>
      ) : lookup.isPending ? (
        <Spinner className="size-4" />
      ) : (
        <EntryFields
          key={entry?.id ?? `new-${folded}`}
          monitoring={monitoring}
          nationalId={folded}
          schema={schema}
          entry={entry}
          onSaved={() => lookup.refetch()}
        />
      )}
    </div>
  );
};
