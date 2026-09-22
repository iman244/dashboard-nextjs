"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  LIST_MONITORING_TYPE_QUERY_KEY,
  useCreate_MonitoringType_API,
  useUpdate_MonitoringType_API,
} from "@/data/monitoring-type/api";
import {
  MONITORING_TYPE_LIMITS,
  MonitoringType,
} from "@/data/monitoring-type/types";
import { LIST_SBHM_QUERY_KEY } from "@/data/saderat-bank-health-monitoring/api";
import { isKnownSBHM_Type } from "@/data/saderat-bank-health-monitoring/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

/** Django's SlugField validator, restated so the user hears about it first. */
const SLUG_PATTERN = /^[-a-zA-Z0-9_]+$/;

type FormValues = {
  slug: string;
  name_en: string;
  name_fa: string;
};

/**
 * Create and edit a monitoring type.
 *
 * One dialog for both: the two differ in title, verb and which mutation runs,
 * and nothing else. `data` decides — absent means create.
 *
 * Fully controlled rather than taking a `trigger` the way the Excel upload
 * dialog does. Edit is opened from a row action, which is outside this
 * component's tree, so a trigger could only ever serve create. One pattern for
 * both modes is less to hold in mind than two.
 */
const MonitoringTypeFormDialog = ({
  data,
  open,
  onOpenChange,
}: {
  /** The row being edited. Absent means this is a create. */
  data?: MonitoringType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const isEditing = !!data;
  const queryClient = useQueryClient();
  const t = useTranslations("/console/monitoring-types.MonitoringTypeFormDialog");
  const tDictionary = useTranslations("common.Dictionary");

  // Built here rather than at module scope so the validation messages are
  // translated. step-1 is the cautionary tale for what happens when strings
  // are written wherever they are first needed.
  const formSchema = React.useMemo(
    () =>
      z.object({
        slug: z
          .string()
          .min(1, { message: t("Form.SlugRequired") })
          .max(MONITORING_TYPE_LIMITS.slug, {
            message: t("Form.SlugTooLong", { max: MONITORING_TYPE_LIMITS.slug }),
          })
          .regex(SLUG_PATTERN, { message: t("Form.SlugPattern") }),
        name_en: z
          .string()
          .min(1, { message: t("Form.NameEnRequired") })
          .max(MONITORING_TYPE_LIMITS.name_en, {
            message: t("Form.NameTooLong", {
              max: MONITORING_TYPE_LIMITS.name_en,
            }),
          }),
        name_fa: z
          .string()
          .min(1, { message: t("Form.NameFaRequired") })
          .max(MONITORING_TYPE_LIMITS.name_fa, {
            message: t("Form.NameTooLong", {
              max: MONITORING_TYPE_LIMITS.name_fa,
            }),
          }),
      }),
    [t]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { slug: "", name_en: "", name_fa: "" },
  });

  // Server errors that do not map onto a form field (500s, timeouts, `detail`,
  // `non_field_errors`) have no FormMessage to land in, so they surface here
  // instead of being swallowed.
  const [generalErrors, setGeneralErrors] = React.useState<string[]>([]);

  // On open, not on mount: React keeps this instance alive between rows, so
  // opening row B after row A would otherwise show A's values. `reset` is
  // react-hook-form's own state, not React's, so this is the documented
  // pattern and not a setState-in-effect -- which is why the server errors
  // below are cleared in the close handler instead of here.
  React.useEffect(() => {
    if (!open) return;
    form.reset({
      slug: data?.slug ?? "",
      name_en: data?.name_en ?? "",
      name_fa: data?.name_fa ?? "",
    });
  }, [open, data, form]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setGeneralErrors([]);
    onOpenChange(next);
  };

  const { mutate: create, isPending: isCreating } =
    useCreate_MonitoringType_API();
  const { mutate: update, isPending: isUpdating } =
    useUpdate_MonitoringType_API();
  const isPending = isCreating || isUpdating;

  /**
   * Renaming a slug the dashboard has a route for.
   *
   * The backend allows this on purpose — the integer primary key is what
   * reports point at, so a rename follows through to all of them. But this
   * dashboard keys its routes and its labels on the slug, so renaming
   * `step_1` leaves every step-1 report with no detail page and no label.
   * Warn, do not block: the backend's design is deliberate and the user may
   * well be correcting a typo on a type nothing has reported against yet.
   */
  // useWatch, not form.watch: `watch` returns a function React Compiler cannot
  // memoize, so using it makes the compiler skip optimising this component
  // entirely. useWatch subscribes to the one field and keeps that off the table.
  const slugValue = useWatch({ control: form.control, name: "slug" });
  const renamingRoutedType =
    !!data && isKnownSBHM_Type(data.slug) && slugValue !== data.slug;

  const onSubmit = React.useCallback(
    (values: FormValues) => {
      setGeneralErrors([]);

      const handlers = {
        onSuccess: () => {
          toast.success(isEditing ? t("UpdatedMessage") : t("CreatedMessage"));
          queryClient.invalidateQueries({
            queryKey: LIST_MONITORING_TYPE_QUERY_KEY(),
          });
          queryClient.invalidateQueries({ queryKey: LIST_SBHM_QUERY_KEY() });
          onOpenChange(false);
        },
        onError: (error: {
          message: string;
          response?: { data?: Record<string, string[] | string> };
        }) => {
          const validFields = Object.keys(formSchema.shape);
          const unmatched: string[] = [];

          const entries = Object.entries(error.response?.data || {});
          entries.forEach(([field, message]) => {
            const text = Array.isArray(message) ? message[0] : message;
            if (validFields.includes(field)) {
              form.setError(field as keyof FormValues, {
                type: "server",
                message: text,
              });
            } else {
              unmatched.push(String(text));
            }
          });

          // A transport-level failure (500, timeout, network) carries no
          // response body at all, so it would otherwise produce silence.
          if (entries.length === 0) {
            unmatched.push(error.message || t("ErrorMessage"));
          }

          setGeneralErrors(unmatched);
        },
      };

      if (data) {
        update(
          { pathVariables: { id: data.id }, payload: values },
          handlers
        );
      } else {
        create({ payload: values }, handlers);
      }
    },
    [
      create,
      update,
      data,
      isEditing,
      form,
      formSchema,
      onOpenChange,
      queryClient,
      t,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("EditTitle") : t("CreateTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("EditDescription") : t("CreateDescription")}
          </DialogDescription>
        </DialogHeader>

        {generalErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>{t("ErrorTitle")}</AlertTitle>
            <AlertDescription>
              {generalErrors.length === 1 ? (
                generalErrors[0]
              ) : (
                <ul className="list-disc ps-4">
                  {generalErrors.map((message, i) => (
                    <li key={i}>{message}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Form.SlugLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      dir="ltr"
                      maxLength={MONITORING_TYPE_LIMITS.slug}
                      placeholder={t("Form.SlugPlaceholder")}
                    />
                  </FormControl>
                  <FormDescription>{t("Form.SlugHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renamingRoutedType && (
              <Alert variant="destructive">
                <TriangleAlert aria-hidden="true" className="h-4 w-4" />
                <AlertTitle>{t("SlugRenameWarningTitle")}</AlertTitle>
                <AlertDescription>
                  {t("SlugRenameWarning", { slug: data.slug })}
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Form.NameEnLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      dir="ltr"
                      maxLength={MONITORING_TYPE_LIMITS.name_en}
                      placeholder={t("Form.NameEnPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name_fa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Form.NameFaLabel")}</FormLabel>
                  <FormControl>
                    {/* Persian regardless of the interface language: this is
                        the Persian name, not a localised field. */}
                    <Input
                      {...field}
                      dir="rtl"
                      maxLength={MONITORING_TYPE_LIMITS.name_fa}
                      placeholder={t("Form.NameFaPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                {tDictionary("Cancel")}
              </Button>
              <Button type="submit" disabled={isPending} aria-busy={isPending}>
                {isPending && <Spinner />}
                {isEditing ? tDictionary("Save") : tDictionary("Create")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MonitoringTypeFormDialog;
