"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  jwt_create,
  JWT_CREATE_KEY,
  JwtCreateApiError,
} from "@/data/user/auth";
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
import { useOnLogin } from "./_side-effects/on-login";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

// Define the form schema. Built from `t` rather than at module scope so the
// validation messages reach the user in their own language; these render through
// <FormMessage/> and were previously hardcoded English on a Persian-first screen.
const makeLoginSchema = (t: (key: string) => string) =>
  z.object({
    username: z.string().min(1, t("validation.usernameRequired")),
    password: z.string().min(1, t("validation.passwordRequired")),
  });

type LoginFormData = z.infer<ReturnType<typeof makeLoginSchema>>;

export function Client() {
  const [apiError, setApiError] = useState<JwtCreateApiError | null>(null);
  const t = useTranslations("/authentication.SignInPage");

  const locale = useLocale();
  const dir = locale === "fa" ? "rtl" : "ltr";

  const { onLogin } = useOnLogin();

  const loginSchema = useMemo(() => makeLoginSchema(t), [t]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const { mutate, isPending, isSuccess } = useMutation({
    mutationKey: [JWT_CREATE_KEY],
    mutationFn: jwt_create,
    onSuccess: onLogin,
    onError: (error: JwtCreateApiError) => {
      console.error("Login failed:", error);
      setApiError(error);
    },
  });

  // There is no interstitial after sign-in — this card is what the user watches
  // while the console loads. So the busy state has to outlive the mutation: on
  // `isPending` alone the button would snap back to "Sign in" the instant the
  // request resolved, then sit there looking idle and clickable through the
  // whole navigation.
  const isBusy = isPending || isSuccess;

  const onSubmit = React.useCallback(
    async (data: LoginFormData) => {
      setApiError(null);
      mutate({ payload: data });
    },
    [mutate]
  );

  return (
    <AuthShell dir={dir} eyebrow={t("description")} title={t("title")}>
      <Form {...form}>
        {/* Two groups, not four equal siblings: the credential pair sits
            tight (16px), then a generous break before the submit act. */}
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4 text-start">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.username.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("form.username.placeholder")}
                      {...field}
                      autoComplete="username"
                      disabled={isBusy}
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
                      type="password"
                      placeholder={t("form.password.placeholder")}
                      {...field}
                      autoComplete="current-password"
                      disabled={isBusy}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {apiError && (
            <div
              role="alert"
              className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-start text-sm text-destructive"
            >
              {apiError.response?.data.detail}
            </div>
          )}

          {/* Success has no visual frame of its own — the card simply stays put
              until the console arrives. Sighted users read that from the button;
              this is the same news for everyone else. Nothing else announces it:
              the redirect is a client navigation the route announcer only picks
              up once the URL actually flips. */}
          <p role="status" aria-live="polite" className="sr-only">
            {isSuccess ? t("status.signedIn") : ""}
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
