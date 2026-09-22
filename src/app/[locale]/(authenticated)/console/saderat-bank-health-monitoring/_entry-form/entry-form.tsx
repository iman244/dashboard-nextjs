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
import {
  fileFieldsOf,
  type FileDescriptor,
  type FileFieldDefinition,
  type PatientEntry,
} from "@/data/patient-entry/types";
import { useList_PatientEntry_API } from "@/data/patient-entry/api/list";
import { useCreate_PatientEntry_API } from "@/data/patient-entry/api/create";
import { useUpdate_PatientEntry_API } from "@/data/patient-entry/api/update";
import { FileField } from "./file-field";

/**
 * The fields of one patient's entry.
 *
 * Split from `EntryForm` and remounted by `key` whenever the looked-up entry
 * changes, so the stored file list seeds `useState` directly. Adopting server
 * state in an effect instead would trip `react-hooks/set-state-in-effect`,
 * and the lint baseline is frozen.
 */
const EntryFields = ({
  monitoring,
  nationalId,
  fields,
  entry,
  onSaved,
}: {
  monitoring: number;
  nationalId: string;
  fields: FileFieldDefinition[];
  entry?: PatientEntry;
  onSaved: () => void;
}) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.PatientEntryDialog"
  );

  const [files, setFiles] = React.useState<FileDescriptor[]>(() =>
    (entry?.files ?? []).map((file) => ({
      field_key: file.field_key,
      key: file.key,
      original_name: file.original_name,
      content_type: file.content_type,
      size: file.size,
    }))
  );

  const create = useCreate_PatientEntry_API();
  const update = useUpdate_PatientEntry_API();
  const saving = create.isPending || update.isPending;

  const onSave = React.useCallback(() => {
    const handlers = {
      onSuccess: () => {
        toast.success(t("Saved"));
        onSaved();
      },
      onError: () => toast.error(t("SaveFailed")),
    };

    if (entry) {
      update.mutate({ id: entry.id, payload: { files } }, handlers);
    } else {
      create.mutate(
        { payload: { monitoring, national_id: nationalId, files } },
        handlers
      );
    }
  }, [create, entry, files, monitoring, nationalId, onSaved, t, update]);

  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <FileField
          key={field.key}
          field={field}
          monitoring={monitoring}
          nationalId={nationalId}
          disabled={saving}
          value={files.filter((file) => file.field_key === field.key)}
          onChange={(next) =>
            setFiles((current) => [
              ...current.filter((file) => file.field_key !== field.key),
              ...next,
            ])
          }
        />
      ))}

      <Button type="button" onClick={onSave} disabled={saving}>
        {saving ? <Spinner className="me-2 size-4" /> : null}
        {t("Save")}
      </Button>
    </div>
  );
};

export type EntryFormProps = {
  monitoring: number;
  type?: MonitoringType;
};

/**
 * Collects a national id, then renders the file fields this monitoring's type
 * declares.
 *
 * The id is folded to ASCII digits before it is used for anything, because a
 * Persian keyboard produces ۰۱۲ and Django stores 012 -- an unfolded lookup
 * would miss the row that exists and then create a second one.
 */
export const EntryForm = ({ monitoring, type }: EntryFormProps) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.PatientEntryDialog"
  );

  const [nationalId, setNationalId] = React.useState("");
  const folded = digitsFaToEn(nationalId).trim();

  const fields = React.useMemo(() => fileFieldsOf(type), [type]);

  const lookup = useList_PatientEntry_API({
    monitoring,
    nationalId: folded.length > 0 ? folded : undefined,
  });
  const entry = folded.length > 0 ? lookup.data?.[0] : undefined;

  if (fields.length === 0) {
    // A type with no declared fields is an ordinary state, not a failure.
    return <p className="text-muted-foreground text-sm">{t("NoFields")}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="entry-national-id">{t("NationalId")}</Label>
        <Input
          id="entry-national-id"
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
          // Remount when the looked-up entry changes, so the stored file list
          // seeds state without an effect.
          key={entry?.id ?? `new-${folded}`}
          monitoring={monitoring}
          nationalId={folded}
          fields={fields}
          entry={entry}
          onSaved={() => lookup.refetch()}
        />
      )}
    </div>
  );
};
