"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useSWRMutation from "swr/mutation";
import Link from "next/link";
import {
  user_create,
  USER_CREATE_KEY,
  UserCreateApiError,
  UserCreateApiPayload,
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

// Define the form schema
const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

// SWR mutation function
async function registerUser(url: string, { arg }: { arg: UserCreateApiPayload }) {
  return user_create({ payload: arg });
}

export default function Client() {
  const [apiError, setApiError] = useState<UserCreateApiError | null>(null);

  const { onRegister } = useOnRegister();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const { trigger, isMutating } = useSWRMutation(USER_CREATE_KEY, registerUser, {
    onSuccess: onRegister,
    onError: (error: UserCreateApiError) => {
      console.error("Registration failed:", error);
      setApiError(error);
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    
    // Prepare payload for API (exclude confirmPassword)
    const { ...payload } = data;
    
    // Convert empty email to undefined
    const apiPayload: UserCreateApiPayload = {
      ...payload,
      email: payload.email || undefined,
    };
    
    trigger(apiPayload);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">
            Enter your details to create a new account
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
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
                {apiError.response?.data.username?.[0] ||
                 apiError.response?.data.email?.[0] ||
                 apiError.response?.data.password?.[0] ||
                 "Registration failed. Please try again."}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isMutating}>
              {isMutating ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link 
            href="/authentication" 
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}