"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useDirection } from "@/lib/use-direction";
import { digitsFaToEn } from "@persian-tools/persian-tools";
import { localeDigits } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AuthShell, AuthSubmitButton } from "@/components/app/auth-shell";
import { authenticatePatient, PatientRequestError } from "@/lib/patient-session";
import { DJANGO_ADDRESS, DJANGO_API_PATH } from "@/settings";
import { useRouter } from "@/i18n/navigation";
import { AppRoutes } from "@/app/paths";
import { usePatientSession } from "../../provider";

export function Client() {
  const t = useTranslations("/patient/sign-in.SignInPage");
  const locale = useLocale();
  const dir = useDirection();
  const router = useRouter();
  const { signIn } = usePatientSession();
  const [formError, setFormError] = React.useState<string | null>(null);

  const schema = React.useMemo(
    () =>
      z.object({
        nationalId: z.string().min(1, t("errors.nationalIdRequired")),
        password: z.string().min(1, t("errors.passwordRequired")),
      }),
    [t]
  );

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nationalId: "", password: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: ({ nationalId, password }: FormData) => authenticatePatient(DJANGO_ADDRESS + DJANGO_API_PATH, digitsFaToEn(nationalId).trim(), password),
    gcTime: 0,
  });
  const [redirecting, setRedirecting] = React.useState(false);
  const isBusy = isPending || redirecting;
  const onSubmit = (data: FormData) => {
    setFormError(null);
    mutate(data, {
      onSuccess: (tokens) => {
        signIn(tokens, digitsFaToEn(data.nationalId).trim());
        setRedirecting(true);
        router.replace(AppRoutes.PATIENT_RECORDS);
      },
      onError: (error) => setFormError(t(error instanceof PatientRequestError && [400, 401, 403].includes(error.status) ? "errors.invalidCredentials" : "errors.requestFailed")),
    });
  };

  return (
    <AuthShell
      dir={dir}
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4 text-start">
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
                      disabled={isBusy}
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
                      disabled={isBusy}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Same error treatment as the staff card: a tinted block in the flow,
              not a bare red line, so it reads as part of the form. */}
          {formError && (
            <div
              role="alert"
              className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-start text-sm text-destructive"
            >
              {formError}
            </div>
          )}

          <p role="status" aria-live="polite" className="sr-only">
            {redirecting ? t("status.signedIn") : ""}
          </p>

          <AuthSubmitButton
            busy={isBusy}
            idleLabel={t("buttons.signIn")}
            busyLabel={t("buttons.signingIn")}
          />
        </form>
      </Form>
    </AuthShell>
  );
}
