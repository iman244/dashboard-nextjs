"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  user_create,
  USER_CREATE_KEY,
  UserCreateApiError,
} from "@/data/user/mutations";
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
import { useOnRegister } from "./_side-effects/on-register";
import { Link } from "@/i18n/navigation";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Define the form schema
const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Client() {
  const [apiError, setApiError] = useState<string | null>(null);
  const t = useTranslations("SignUpPage");
  const { onRegister } = useOnRegister();

  const locale = useLocale();
  const dir = locale === "fa" ? "rtl" : "ltr";

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationKey: [USER_CREATE_KEY],
    mutationFn: user_create,
    onSuccess: onRegister,
    onError: (error: UserCreateApiError) => {
      console.error("Registration failed:", error);
      Object.entries(error.response?.data || {}).forEach(([field, message]) => {
        if (["username", "email", "password"].includes(field)) {
          form.setError(field as "username" | "email" | "password", {
            message: message[0],
          });
        } else {
          setApiError(JSON.stringify(error.response?.data));
        }
      });
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    mutate({ payload: data });
  };

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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.email.label")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("form.email.placeholder")}
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
                  {apiError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t("buttons.signingUp") : t("buttons.signUp")}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {t("form.signIn.label")}{" "}
            </span>
            <Link
              href="/authentication"
              className="ms-2 text-primary hover:underline font-medium"
            >
              {t("form.signIn.link")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
