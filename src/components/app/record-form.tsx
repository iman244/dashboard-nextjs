"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { localeDigits } from "@/lib/utils";
import type { MonitoringType } from "@/data/monitoring-type/types";
import type { PatientEntry } from "@/data/patient-entry/types";
import { uploadToField } from "@/data/patient-entry/upload";
import { useCreate_PatientEntry_API } from "@/data/patient-entry/api/create";
import { useUpdate_PatientEntry_API } from "@/data/patient-entry/api/update";
import {
  SchemaForm,
  asFieldSchema,
  formProblems,
  toDigits,
  type AttachedImage,
  type SchemaFormValues,
} from "@/components/schema-form";

/** An Iranian national ID is ten digits; Django stores at most ten. */
const NATIONAL_ID_LENGTH = 10;

/** Every string in a DRF error body, flattened. */
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

/**
 * Why an upload failed, as precisely as the error allows.
 *
 * A response means Django or storage answered and said no -- pass its words
 * on. No response means the request never arrived, which on these networks is
 * usually storage being unreachable, and saying so is more use than a generic
 * "failed".
 */
const uploadError = (
  error: unknown,
  unreachable: string
): string => {
  const response = (error as { response?: { data?: unknown } })?.response;
  if (!response) return unreachable;
  const messages = serverMessages(response.data);
  return messages.length > 0 ? messages.join(" ") : unreachable;
};

const initialValues = (entry?: PatientEntry): SchemaFormValues => {
  const images: Record<string, AttachedImage[]> = {};
  for (const file of entry?.files ?? []) {
    images[file.field_key] = [
      ...(images[file.field_key] ?? []),
      {
        id: file.key,
        key: file.key,
        name: file.original_name,
        url: file.url ?? undefined,
        contentType: file.content_type,
        size: file.size,
        status: "done",
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
 * Picking an image only queues it. On submit the queue is uploaded one image
 * at a time -- sequentially, so a slow link carries one file at full speed
 * rather than five at a crawl, and each bar means something -- and the record
 * is saved only once every image has arrived. If any fail, nothing is saved:
 * the failures say why, and submitting again retries only those.
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
  const locale = useLocale();
  const queryClient = useQueryClient();

  const schema = React.useMemo(
    () => asFieldSchema(monitoring.field_schema),
    [monitoring]
  );

  // Digits only and never longer than ten, enforced as it is typed: the
  // server caps it at ten, and a longer value used to fail only at upload.
  const [nationalId, setNationalId] = React.useState(entry?.national_id ?? "");
  const [values, setValues] = React.useState<SchemaFormValues>(() =>
    initialValues(entry)
  );
  const [attempted, setAttempted] = React.useState(false);
  const [phase, setPhase] = React.useState<"idle" | "uploading" | "saving">(
    "idle"
  );
  const [uploaded, setUploaded] = React.useState({ done: 0, total: 0 });

  const create = useCreate_PatientEntry_API();
  const update = useUpdate_PatientEntry_API();
  const busy = phase !== "idle";

  /** Merge a change into one image, wherever it sits. */
  const patchImage = React.useCallback(
    (fieldKey: string, id: string, patch: Partial<AttachedImage>) =>
      setValues((current) => ({
        ...current,
        images: {
          ...current.images,
          [fieldKey]: (current.images[fieldKey] ?? []).map((image) =>
            image.id === id ? { ...image, ...patch } : image
          ),
        },
      })),
    []
  );

  const save = React.useCallback(
    (images: SchemaFormValues["images"]) => {
      const files = Object.entries(images).flatMap(([fieldKey, list]) =>
        list
          .filter((image) => image.status === "done" && image.key)
          .map((image) => ({
            field_key: fieldKey,
            key: image.key as string,
            original_name: image.name,
            content_type: image.contentType ?? "application/octet-stream",
            size: image.size ?? 0,
          }))
      );

      const done = (saved: PatientEntry) => {
        // "all", not the default "active": the pages that show these queries
        // are not mounted while this form is, and the app turns refetchOnMount
        // off, so a merely-stale list would come back showing the old rows.
        queryClient.invalidateQueries({
          queryKey: ["patient-entries"],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["patient-entry", saved.id],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["patient-records"],
          refetchType: "all",
        });
        toast.success(t("Saved"));
        onSaved();
      };
      const failed = (error: {
        response?: { status?: number; data?: unknown };
      }) => {
        setPhase("idle");
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

      setPhase("saving");
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
              national_id: nationalId,
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
      monitoring.id,
      nationalId,
      onExisting,
      onSaved,
      queryClient,
      t,
      update,
      values.digits,
    ]
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setAttempted(true);
    if (!nationalId || formProblems(schema, values).length > 0) {
      toast.error(t("FixErrors"));
      return;
    }

    // Everything not yet in storage -- the new picks, and any that failed
    // last time. Already-uploaded images are never sent twice.
    const queue = Object.entries(values.images).flatMap(([fieldKey, list]) =>
      list
        .filter((image) => image.status !== "done" && image.file)
        .map((image) => ({ fieldKey, image }))
    );

    // The final state is built alongside the React state, because the state
    // updates below are not visible inside this function until it returns.
    const final: SchemaFormValues["images"] = Object.fromEntries(
      Object.entries(values.images).map(([key, list]) => [key, [...list]])
    );
    let failures = 0;

    if (queue.length > 0) {
      setPhase("uploading");
      setUploaded({ done: 0, total: queue.length });
    }

    for (const [index, { fieldKey, image }] of queue.entries()) {
      patchImage(fieldKey, image.id, {
        status: "uploading",
        progress: 0,
        error: undefined,
      });
      try {
        const descriptor = await uploadToField({
          monitoring: monitoring.id,
          nationalId,
          fieldKey,
          file: image.file as File,
          onProgress: (percent) =>
            patchImage(fieldKey, image.id, { progress: percent }),
        });
        const result: Partial<AttachedImage> = {
          status: "done",
          progress: 100,
          key: descriptor.key,
          contentType: descriptor.content_type,
          size: descriptor.size,
          file: undefined,
        };
        patchImage(fieldKey, image.id, result);
        final[fieldKey] = final[fieldKey].map((item) =>
          item.id === image.id ? { ...item, ...result } : item
        );
      } catch (error) {
        failures += 1;
        patchImage(fieldKey, image.id, {
          status: "failed",
          error: uploadError(error, t("StorageUnreachable")),
        });
      }
      setUploaded({ done: index + 1, total: queue.length });
    }

    if (failures > 0) {
      setPhase("idle");
      toast.error(
        t("UploadsFailed", { n: localeDigits(failures, locale) })
      );
      return;
    }

    save(final);
  };

  const nationalIdProblem =
    attempted && !nationalId ? t("NationalIdRequired") : null;

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
          value={localeDigits(nationalId, locale)}
          // Fixed once a record exists: it is the record's identity, and its
          // images are already filed under it.
          readOnly={Boolean(entry)}
          disabled={busy}
          placeholder={t("NationalIdPlaceholder")}
          aria-invalid={nationalIdProblem ? true : undefined}
          onChange={(event) =>
            setNationalId(
              toDigits(event.target.value).slice(0, NATIONAL_ID_LENGTH)
            )
          }
        />
        <p className="text-muted-foreground text-xs">
          {t("NationalIdHint", {
            n: localeDigits(NATIONAL_ID_LENGTH, locale),
          })}
        </p>
        {nationalIdProblem ? (
          <p className="text-destructive text-xs" role="alert">
            {nationalIdProblem}
          </p>
        ) : null}
      </div>

      <SchemaForm
        schema={schema}
        values={values}
        onChange={setValues}
        disabled={busy}
        showErrors={attempted}
      />

      <Button type="submit" disabled={busy}>
        {busy ? <Spinner className="me-2 size-4" /> : null}
        {phase === "uploading"
          ? t("UploadingProgress", {
              done: localeDigits(uploaded.done, locale),
              total: localeDigits(uploaded.total, locale),
            })
          : phase === "saving"
            ? t("Saving")
            : entry
              ? t("SaveChanges")
              : t("AddRecord")}
      </Button>
    </form>
  );
};
