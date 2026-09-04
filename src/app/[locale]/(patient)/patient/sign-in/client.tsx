"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { digitsFaToEn } from "@persian-tools/persian-tools";
import { localeDigits } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ehr_by_national_number,
  EHR_BY_NATIONAL_NUMBER_KEY,
} from "@/data/electronic health record/api/EHR-by-national-number";
import { useRouter } from "@/i18n/navigation";
import { AppRoutes } from "@/app/paths";
import { usePatientSession } from "../../provider";
import { signInProbeParams } from "../../_data/ehr-params";

export function Client() {
  const t = useTranslations("/patient/sign-in.SignInPage");
  const locale = useLocale();
  const router = useRouter();
  const { signIn } = usePatientSession();
  const [formError, setFormError] = React.useState<string | null>(null);

  // Built inside the component so the validation messages are the translated
  // ones rather than a module-level English default.
  const schema = React.useMemo(
    () =>
      z
        .object({
          nationalId: z.string().min(1, t("errors.nationalIdRequired")),
          password: z.string().min(1, t("errors.passwordRequired")),
        })
        .refine(
          (data) =>
            digitsFaToEn(data.nationalId) === digitsFaToEn(data.password),
          {
            message: t("errors.passwordMismatch"),
            path: ["password"],
          }
        ),
    [t]
  );

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nationalId: "", password: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationKey: [EHR_BY_NATIONAL_NUMBER_KEY, "patient-sign-in"],
    mutationFn: ehr_by_national_number,
  });

  const onSubmit = React.useCallback(
    (data: FormData) => {
      setFormError(null);
      const nationalId = digitsFaToEn(data.nationalId);

      mutate(
        { params: signInProbeParams(nationalId) },
        {
          onSuccess: (records) => {
            // An empty array is a real answer ("no such patient"), not a
            // failure. Collapsing the two would tell someone their id was
            // wrong when the service was simply down.
            if (records.length === 0) {
              setFormError(t("errors.noRecords"));
              return;
            }
            signIn(nationalId);
            router.replace(AppRoutes.PATIENT_RECORDS);
          },
          onError: (error) => {
            console.error("patient sign-in probe failed:", error);
            setFormError(t("errors.requestFailed"));
          },
        }
      );
    },
    [mutate, router, signIn, t]
  );

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.nationalId.label")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="numeric"
                        autoComplete="username"
                        placeholder={t("form.nationalId.placeholder")}
                        disabled={isPending}
                        value={localeDigits(field.value, locale)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.password.label")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="current-password"
                        placeholder={t("form.password.placeholder")}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-xs text-muted-foreground">{t("notice")}</p>

              {formError && (
                <p role="alert" className="text-destructive text-sm text-center">
                  {formError}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t("buttons.signingIn") : t("buttons.signIn")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
