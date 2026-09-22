import {
  DIGIT_STRING,
  IMAGE,
  type FieldSchema,
  type FieldType,
  type SchemaField,
  type SchemaSection,
} from "@/components/schema-form";

/**
 * Editing operations on a draft schema.
 *
 * Pure functions returning new documents, so the builder's state is one
 * `useState` holding one object and every change is a replacement. Keeping
 * the rules here rather than in the components means the preview and the
 * saved payload can never be built from different logic.
 */

/**
 * Keys are machine identifiers: Django requires `^[a-z][a-z0-9_]*$`, and a
 * Persian label cannot produce one. Rather than make an administrator invent
 * a key for every field, they are assigned and stay editable in the advanced
 * row for anyone who wants a meaningful name in the stored data.
 */
export const nextKey = (existing: string[], prefix: string) => {
  let index = existing.length + 1;
  while (existing.includes(`${prefix}_${index}`)) index += 1;
  return `${prefix}_${index}`;
};

export const addField = (
  schema: FieldSchema,
  type: FieldType,
  section?: string
): FieldSchema => {
  const key = nextKey(
    schema.fields.map((field) => field.key),
    "field"
  );
  const field: SchemaField =
    type === DIGIT_STRING
      ? {
          key,
          type: DIGIT_STRING,
          label_en: "",
          label_fa: "",
          required: false,
          ...(section ? { section } : {}),
        }
      : {
          key,
          type: IMAGE,
          label_en: "",
          label_fa: "",
          required: false,
          // Many by default: an operator photographing a scan usually has
          // several frames, and being forced to pick one is the complaint.
          multiple: true,
          max_size_mb: 25,
          ...(section ? { section } : {}),
        };
  return { ...schema, fields: [...schema.fields, field] };
};

export const updateField = (
  schema: FieldSchema,
  key: string,
  patch: Partial<SchemaField>
): FieldSchema => ({
  ...schema,
  fields: schema.fields.map((field) =>
    field.key === key ? ({ ...field, ...patch } as SchemaField) : field
  ),
});

export const removeField = (schema: FieldSchema, key: string): FieldSchema => ({
  ...schema,
  fields: schema.fields.filter((field) => field.key !== key),
});

export const moveField = (
  schema: FieldSchema,
  key: string,
  delta: number
): FieldSchema => {
  const index = schema.fields.findIndex((field) => field.key === key);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= schema.fields.length) return schema;
  const fields = [...schema.fields];
  const [moved] = fields.splice(index, 1);
  fields.splice(target, 0, moved);
  return { ...schema, fields };
};

export const addSection = (schema: FieldSchema): FieldSchema => {
  const sections = schema.sections ?? [];
  const key = nextKey(
    sections.map((section) => section.key),
    "section"
  );
  const section: SchemaSection = { key, title_en: "", title_fa: "" };
  return { ...schema, sections: [...sections, section] };
};

export const updateSection = (
  schema: FieldSchema,
  key: string,
  patch: Partial<SchemaSection>
): FieldSchema => ({
  ...schema,
  sections: (schema.sections ?? []).map((section) =>
    section.key === key ? { ...section, ...patch } : section
  ),
});

/** Removing a section frees its fields rather than deleting their content. */
export const removeSection = (
  schema: FieldSchema,
  key: string
): FieldSchema => ({
  ...schema,
  sections: (schema.sections ?? []).filter((section) => section.key !== key),
  fields: schema.fields.map((field) =>
    field.section === key ? { ...field, section: undefined } : field
  ),
});

/** Problems that would make Django reject this draft, stated as message keys. */
export const draftProblems = (schema: FieldSchema) => {
  const problems: { key: string; params?: Record<string, string> }[] = [];

  for (const section of schema.sections ?? []) {
    if (!section.title_en.trim() || !section.title_fa.trim()) {
      problems.push({ key: "SectionNeedsTitles" });
      break;
    }
  }

  for (const field of schema.fields) {
    if (!field.label_en.trim() || !field.label_fa.trim()) {
      problems.push({ key: "FieldNeedsLabels" });
      break;
    }
  }

  for (const field of schema.fields) {
    if (
      field.type === DIGIT_STRING &&
      field.min_length !== undefined &&
      field.max_length !== undefined &&
      field.min_length > field.max_length
    ) {
      problems.push({ key: "MinAboveMax", params: { field: field.key } });
      break;
    }
  }

  return problems;
};

/** The payload Django stores: `{}` when nothing has been declared. */
export const toPayload = (schema: FieldSchema) =>
  schema.fields.length === 0 && (schema.sections ?? []).length === 0
    ? {}
    : {
        version: 1 as const,
        sections: schema.sections ?? [],
        fields: schema.fields,
      };
