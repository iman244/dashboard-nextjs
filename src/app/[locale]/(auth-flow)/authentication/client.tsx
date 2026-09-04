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
import { Button } from "@/components/ui/button";
import { useOnLogin } from "./_side-effects/on-login";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  const { mutate, isPending } = useMutation({
    mutationKey: [JWT_CREATE_KEY],
    mutationFn: jwt_create,
    onSuccess: onLogin,
    onError: (error: JwtCreateApiError) => {
      console.error("Login failed:", error);
      setApiError(error);
    },
  });

  const onSubmit = React.useCallback(
    async (data: LoginFormData) => {
      setApiError(null);
      mutate({ payload: data });
    },
    [mutate]
  );

  return (
    <main
      className="relative min-h-dvh flex items-center justify-center overflow-hidden px-4 py-24"
      dir={dir}
    >
      {/* Ambient ground: two very low-chroma orbs, no hard edges. Fixed and
          pointer-events-none so they never repaint with scrolling content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 40rem at 18% 8%, color-mix(in oklab, var(--primary) 9%, transparent), transparent 65%)," +
            "radial-gradient(48rem 34rem at 84% 92%, color-mix(in oklab, var(--chart-7) 7%, transparent), transparent 62%)",
        }}
      />

      {/* Double-bezel: an outer tray holding an inner plate, with concentric radii. */}
      <div className="w-full max-w-[26rem] rounded-[2rem] bg-foreground/[0.035] p-1.5 ring-1 ring-foreground/[0.07] backdrop-blur-sm">
        <Card className="rounded-[calc(2rem-0.375rem)] border-0 bg-card text-center shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_32px_-12px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_16px_40px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)]">
        <CardHeader className="gap-0 pb-0 pt-9">
          <span className="mx-auto mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
            {t("description")}
          </span>
          <CardTitle className="text-center! text-[1.75rem] font-bold leading-[1.15] tracking-[-0.02em]">
            {t("title")}
          </CardTitle>
          <CardDescription className="sr-only">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-7 pb-9 pt-7">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        disabled={isPending}
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
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {apiError && (
                <div className="text-destructive text-sm text-center">
                  {apiError.response?.data.detail}
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="group h-12 w-full rounded-full text-[15px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.10),0_8px_20px_-8px_color-mix(in_oklab,var(--primary)_55%,transparent)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.12),0_12px_28px_-8px_color-mix(in_oklab,var(--primary)_65%,transparent)] active:scale-[0.985]"
              >
                <span className="flex w-full items-center justify-center gap-3">
                  {isPending ? t("buttons.signingIn") : t("buttons.signIn")}
                  {!isPending && (
                    <span
                      aria-hidden="true"
                      className="flex size-7 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
                    >
                      <svg viewBox="0 0 16 16" fill="none" className="size-3.5 rtl:rotate-180">
                        <path
                          d="M2.5 8h10M9 4.5 12.5 8 9 11.5"
                          stroke="currentColor"
                          strokeWidth="1.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </span>
              </Button>
            </form>
          </Form>

        </CardContent>
        </Card>
      </div>
    </main>
  );
}
