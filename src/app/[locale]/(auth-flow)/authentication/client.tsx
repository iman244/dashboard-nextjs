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
      className="min-h-screen flex items-center justify-center bg-background"
      dir={dir}
    >
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-center! text-2xl font-bold">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-center! text-muted-foreground">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

        </CardContent>
      </Card>
    </main>
  );
}
