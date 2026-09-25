"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isKnownSBHM_Type } from "@/data/saderat-bank-health-monitoring/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/app/page-header";
import { useRouter, Link } from "@/i18n/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  LIST_MONITORING_TYPE_QUERY_KEY,
  useList_MonitoringType_API,
} from "@/data/monitoring-type/api/list";
import { useCreate_MonitoringType_API } from "@/data/monitoring-type/api/create";
import { useUpdate_MonitoringType_API } from "@/data/monitoring-type/api/update";
import {
  asFieldSchema,
  EMPTY_SCHEMA,
  type FieldSchema,
} from "@/components/schema-form";
import { SchemaBuilder } from "./schema-builder";
import { SchemaPreview } from "./preview";
import { draftProblems, toPayload, withIds } from "./draft";

const LIST_PATH = "/console/monitorings";

/**
 * The create and edit screens for a monitoring type.
 *
 * One component for both: the schema an administrator can build must also be
 * one they can fix, and a builder that only exists at creation time turns a
 * mistyped label into a reason to make a whole new type.
 */
export const TypeForm = ({ id }: { id?: number }) => {
  const t = useTranslations("/console/monitorings.Builder");
  const router = useRouter();
  const queryClient = useQueryClient();

  const types = useList_MonitoringType_API({ enabled: id !== undefined });
  const existing = id !== undefined
    ? types.data?.find((candidate) => candidate.id === id)
    : undefined;

  const loading = id !== undefined && types.isPending;

  return loading ? (
    <div className="p-8">
      <Spinner className="size-5" />
    </div>
  ) : id !== undefined && !existing ? (
    <p className="text-muted-foreground p-8 text-sm">{t("NotFound")}</p>
  ) : (
    <TypeFormBody
      // Remounted once the record arrives, so its values seed useState
      // directly instead of being copied in by an effect.
      key={existing?.id ?? "new"}
      id={id}
      initialSlug={existing?.slug ?? ""}
      initialNameFa={existing?.name_fa ?? ""}
      initialNameEn={existing?.name_en ?? ""}
      initialSchema={
        // Fields arriving from the API carry no `_id`; assign one so the
        // editor rows have a stable identity to be keyed on.
        existing ? withIds(asFieldSchema(existing.field_schema)) : EMPTY_SCHEMA
      }
      onDone={() => {
        // "all": the list is not mounted on this page, and with refetchOnMount
        // off it would otherwise come back with the old names and schema.
        queryClient.invalidateQueries({
          queryKey: LIST_MONITORING_TYPE_QUERY_KEY(),
          refetchType: "all",
        });
        router.push(LIST_PATH);
      }}
      t={t}
    />
  );
};

const TypeFormBody = ({
  id,
  initialSlug,
  initialNameFa,
  initialNameEn,
  initialSchema,
  onDone,
  t,
}: {
  id?: number;
  initialSlug: string;
  initialNameFa: string;
  initialNameEn: string;
  initialSchema: FieldSchema;
  onDone: () => void;
  t: ReturnType<typeof useTranslations<"/console/monitorings.Builder">>;
}) => {
  const [slug, setSlug] = React.useState(initialSlug);
  // The dashboard routes step_1 and step_2 reports by slug, so renaming one
  // leaves those reports with no detail page. Warn, do not block: Django
  // allows it on purpose, and it may be a typo fix on an unused type.
  const renamingRoutedType =
    isKnownSBHM_Type(initialSlug) && slug !== initialSlug;
  const [nameFa, setNameFa] = React.useState(initialNameFa);
  const [nameEn, setNameEn] = React.useState(initialNameEn);
  const [schema, setSchema] = React.useState<FieldSchema>(initialSchema);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({});

  const create = useCreate_MonitoringType_API();
  const update = useUpdate_MonitoringType_API();
  const saving = create.isPending || update.isPending;

  const problems = draftProblems(schema);
  const incomplete =
    !slug.trim() || !nameFa.trim() || !nameEn.trim() || problems.length > 0;

  const onSave = React.useCallback(() => {
    setFieldErrors({});
    const payload = {
      slug: slug.trim(),
      name_fa: nameFa.trim(),
      name_en: nameEn.trim(),
      field_schema: toPayload(schema),
    };
    const handlers = {
      onSuccess: () => {
        toast.success(id === undefined ? t("Created") : t("Updated"));
        onDone();
      },
      onError: (error: {
        response?: { data?: Record<string, string[] | undefined> };
      }) => {
        const data = error.response?.data;
        if (data && typeof data === "object") {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(data).filter(([, value]) => Array.isArray(value))
            ) as Record<string, string[]>
          );
        }
        toast.error(t("SaveFailed"));
      },
    };

    if (id === undefined) {
      create.mutate({ payload }, handlers);
    } else {
      update.mutate({ pathVariables: { id }, payload }, handlers);
    }
  }, [create, id, nameEn, nameFa, onDone, schema, slug, t, update]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={id === undefined ? t("NewTitle") : t("EditTitle")}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={LIST_PATH}>
                <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
                {t("Back")}
              </Link>
            </Button>
            <Button onClick={onSave} disabled={saving || incomplete}>
              {saving ? <Spinner className="me-2 size-4" /> : null}
              {t("Save")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="type-slug">{t("Slug")}</Label>
              <Input
                id="type-slug"
                dir="ltr"
                value={slug}
                placeholder="step_3"
                onChange={(event) =>
                  setSlug(
                    event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "_")
                  )
                }
              />
              {fieldErrors.slug ? (
                <p className="text-destructive text-xs" role="alert">
                  {fieldErrors.slug.join(" ")}
                </p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="type-name-fa">{t("NameFa")}</Label>
              <Input
                id="type-name-fa"
                value={nameFa}
                onChange={(event) => setNameFa(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="type-name-en">{t("NameEn")}</Label>
              <Input
                id="type-name-en"
                dir="ltr"
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
              />
            </div>
          </div>

          {renamingRoutedType ? (
            <Alert variant="destructive">
              <TriangleAlert className="size-4" aria-hidden="true" />
              <AlertTitle>{t("SlugRenameWarningTitle")}</AlertTitle>
              <AlertDescription>
                {t("SlugRenameWarning", { slug: initialSlug })}
              </AlertDescription>
            </Alert>
          ) : null}

          <SchemaBuilder schema={schema} onChange={setSchema} />

          {problems.length > 0 ? (
            <ul className="text-destructive space-y-1 text-xs" role="alert">
              {problems.map((problem) => (
                <li key={problem.key}>
                  {t(problem.key, { field: problem.params?.field ?? "" })}
                </li>
              ))}
            </ul>
          ) : null}

          {fieldErrors.field_schema ? (
            <p className="text-destructive text-xs" role="alert">
              {fieldErrors.field_schema.join(" ")}
            </p>
          ) : null}
        </div>

        <SchemaPreview schema={schema} />
      </div>
    </div>
  );
};
