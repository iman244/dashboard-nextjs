"use client";

import React, { useState } from "react";
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
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

// Define the form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Client() {
  const [apiError, setApiError] = useState<JwtCreateApiError | null>(null);
  const t = useTranslations("SignInPage");

  const locale = useLocale();
  const dir = locale === "fa" ? "rtl" : "ltr";

  const { onLogin } = useOnLogin();

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
    <main className="min-h-screen flex items-center justify-center bg-background" dir={dir}>
      <div className="w-full max-w-md mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>

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

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t("buttons.signingIn") : t("buttons.signIn")}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {t("form.register.label")}
          </span>
          <Link
            href="/authentication/register"
            className="ms-2 text-primary hover:underline font-medium"
          >
            {t("form.register.link")}
          </Link>
        </div>
      </div>
    </main>
  );
}
