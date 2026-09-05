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
  const dir = useDirection();
  const router = useRouter();
  const { signIn } = usePatientSession();
  const [formError, setFormError] = React.useState<string | null>(null);

  // Built inside the component so the validation messages are the translated
  // ones rather than a module-level English default.
  //
  // Only presence is validated here. Whether the password matches is checked in
  // onSubmit and reported as one generic form-level failure, because a
  // field-level "this must equal your national id" would just be the hint again.
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
    mutationKey: [EHR_BY_NATIONAL_NUMBER_KEY, "patient-sign-in"],
    mutationFn: ehr_by_national_number,
  });

  // Held separately from `isPending` rather than derived from `isSuccess`: this
  // request succeeds even when it finds no records, which is a rejected sign-in,
  // not a redirect. Only the branch that actually navigates sets this — and it
  // must stay set through the navigation, since this card is what the patient
  // watches while their records load.
  const [redirecting, setRedirecting] = React.useState(false);
  const isBusy = isPending || redirecting;

  const onSubmit = React.useCallback(
    (data: FormData) => {
      setFormError(null);
      const nationalId = digitsFaToEn(data.nationalId);

      // Wrong password and unknown id give the same answer, as on any sign-in
      // page. Checked here rather than in the schema so it reads as a rejected
      // login instead of a form-validation hint, and still sends no request.
      if (nationalId !== digitsFaToEn(data.password)) {
        setFormError(t("errors.invalidCredentials"));
        return;
      }

      mutate(
        { params: signInProbeParams(nationalId) },
        {
          onSuccess: (records) => {
            // Nothing found reads as bad credentials, not as "no such patient" —
            // a normal sign-in does not confirm which accounts exist. A failed
            // request stays distinct, so a dead upstream is not blamed on the
            // person typing.
            if (records.length === 0) {
              setFormError(t("errors.invalidCredentials"));
              return;
            }
            signIn(nationalId);
            setRedirecting(true);
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
