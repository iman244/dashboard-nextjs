import type { components } from "@/data/api-schema";
import type { MonitoringType } from "@/data/monitoring-type/types";

type Schemas = components["schemas"];

export type PatientEntry = Schemas["PatientEntry"];
export type PatientEntryFile = Schemas["PatientEntryFile"];
export type PatientEntry_CreateSerializer = Schemas["PatientEntryRequest"];
export type PatientEntry_PatchSerializer =
  Schemas["PatchedPatientEntryRequest"];

/**
 * What the entry endpoint accepts for one uploaded object. The browser has
 * already PUT the bytes; this is the receipt.
 */
export type FileDescriptor = Schemas["PatientEntryFileRequest"];

/**
 * One `file` field, as `field_schema` declares it.
 *
 * `openapi-typescript` renders `field_schema` as `unknown`, because Django
 * stores it as JSONB and drf-spectacular has no shape to publish. This is that
 * shape, restated for the client. It is a convenience: Django is the authority
 * and revalidates everything on presign and on save.
 */
export type FileFieldDefinition = {
  key: string;
  type: "file";
  label_en: string;
  label_fa: string;
  required?: boolean;
  multiple?: boolean;
  accept?: string[];
  max_size_mb?: number;
  max_count?: number;
};

/** The file fields of `type`, or [] when it declares none. */
export const fileFieldsOf = (
  type: Pick<MonitoringType, "field_schema"> | undefined
): FileFieldDefinition[] => {
  const document = type?.field_schema as
    | { fields?: FileFieldDefinition[] }
    | undefined;
  return (document?.fields ?? []).filter((field) => field.type === "file");
};

/** The label for the active locale, with no English fallback in `fa`. */
export const labelOf = (field: FileFieldDefinition, locale: string) =>
  locale === "fa" ? field.label_fa : field.label_en;
