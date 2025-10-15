"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useSWRMutation from "swr/mutation";
import Link from "next/link";
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

// Define the form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// SWR mutation function
async function loginUser(url: string, { arg }: { arg: LoginFormData }) {
  return jwt_create({ payload: arg });
}

export function Client() {
  const [apiError, setApiError] = useState<JwtCreateApiError | null>(null);

  const { onLogin } = useOnLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const { trigger, isMutating } = useSWRMutation(JWT_CREATE_KEY, loginUser, {
    onSuccess: onLogin,
    onError: (error: JwtCreateApiError) => {
      console.error("Login failed:", error);
      setApiError(error);
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    trigger(data);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">
            Enter your credentials to sign in
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your username"
                      {...field}
                      disabled={isMutating}
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                      disabled={isMutating}
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

            <Button type="submit" className="w-full" disabled={isMutating}>
              {isMutating ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link 
            href="/authentication/register" 
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
