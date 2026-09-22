import type { components } from "@/data/api-schema";

type Schemas = components["schemas"];

/**
 * A monitoring type, as the API returns it.
 *
 * Types used to be a `TextChoices` enum on the Django model; they are a table
 * now (`MonitoringType`), managed through this endpoint. That is the whole
 * reason this CRUD exists — and the reason the dashboard can no longer assume
 * it knows every type that exists. See `isKnownSBHM_Type` in
 * `data/saderat-bank-health-monitoring/types.ts`.
 */
export type MonitoringType = Schemas["MonitoringType"];

export type MonitoringType_ListSerializer = MonitoringType[];
export type MonitoringType_CreateSerializer = Schemas["MonitoringTypeRequest"];

/**
 * The update payload. PATCH rather than PUT, so every field is optional and a
 * form that submits only what changed cannot blank a field by omitting it.
 */
export type MonitoringType_PatchSerializer =
  Schemas["PatchedMonitoringTypeRequest"];

/**
 * Django's field limits, restated.
 *
 * `openapi-typescript` does not carry `maxLength` through from the schema, so
 * the generated types say `slug: string` and nothing more. These constants
 * exist so the form can give the user the limit before a round trip — the
 * server remains the enforcer, and a mismatch here surfaces as a normal field
 * error rather than as corrupt data.
 */
export const MONITORING_TYPE_LIMITS = {
  slug: 16,
  name_en: 64,
  name_fa: 64,
} as const;

/**
 * The body Django sends with a 409 on delete.
 *
 * The foreign key from a monitoring to its type is PROTECT, so deleting a type
 * that reports still point at fails. The viewset turns that into a 409 that
 * names the count, which is the one piece of information that tells the user
 * what to do next.
 */
export type MonitoringType_InUseError = {
  detail?: string;
  monitorings?: number;
};
