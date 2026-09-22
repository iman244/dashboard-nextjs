import { digitsFaToEn } from "@persian-tools/persian-tools";

/** The two field types this version understands. Mirrors Django's schema.py. */
export const DIGIT_STRING = "digit_string" as const;
export const IMAGE = "image" as const;

export type FieldType = typeof DIGIT_STRING | typeof IMAGE;

export type SchemaSection = {
  key: string;
  title_en: string;
  title_fa: string;
};

export type SchemaField = {
  key: string;
  type: FieldType;
  label_en: string;
  label_fa: string;
  section?: string;
  required?: boolean;
  /** digit_string */
  min_length?: number;
  max_length?: number;
  /** image */
  multiple?: boolean;
  max_size_mb?: number;
  max_count?: number;
};

export type FieldSchema = {
  version: 1;
  sections?: SchemaSection[];
  fields: SchemaField[];
};

export const EMPTY_SCHEMA: FieldSchema = {
  version: 1,
  sections: [],
  fields: [],
};

/**
 * `field_schema` as the API hands it over.
 *
 * drf-spectacular publishes it as an untyped object, because Django stores it
 * as JSONB. This narrows it for the client; Django remains the authority and
 * revalidates on every write.
 */
export const asFieldSchema = (value: unknown): FieldSchema => {
  const document = value as Partial<FieldSchema> | undefined;
  return {
    version: 1,
    sections: document?.sections ?? [],
    fields: document?.fields ?? [],
  };
};

/** Images default to many; a single-image field must say so explicitly. */
export const isMultiple = (field: SchemaField) =>
  field.multiple ?? field.type === IMAGE;

/** The label for the active locale. No English fallback in Persian. */
export const labelOf = (field: SchemaField, locale: string) =>
  locale === "fa" ? field.label_fa : field.label_en;

export const titleOf = (section: SchemaSection, locale: string) =>
  locale === "fa" ? section.title_fa : section.title_en;

/**
 * Digits only, and **never** a number.
 *
 * `0012345678` is a personnel code; as a number it is `12345678`, a different
 * value. Everything here stays a string, and Persian/Arabic digits fold to
 * ASCII first because that is what an Iranian keyboard produces.
 */
export const toDigits = (raw: string) =>
  digitsFaToEn(raw).replace(/[^0-9]/g, "");

/** A validation message key and params, or null when the value is fine. */
export type FieldProblem = { key: string; params?: Record<string, string> };

export const digitStringProblem = (
  field: SchemaField,
  value: string
): FieldProblem | null => {
  if (!value) {
    return field.required ? { key: "Required" } : null;
  }
  if (field.min_length !== undefined && value.length < field.min_length) {
    return { key: "TooShort", params: { n: String(field.min_length) } };
  }
  if (field.max_length !== undefined && value.length > field.max_length) {
    return { key: "TooLong", params: { n: String(field.max_length) } };
  }
  return null;
};

/** Fields grouped under their section, plus any that belong to none. */
export const groupFields = (schema: FieldSchema) => {
  const sections = schema.sections ?? [];
  const loose = schema.fields.filter(
    (field) => !field.section || !sections.some((s) => s.key === field.section)
  );
  return {
    loose,
    grouped: sections.map((section) => ({
      section,
      fields: schema.fields.filter((field) => field.section === section.key),
    })),
  };
};
