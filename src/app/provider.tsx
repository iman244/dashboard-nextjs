"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthProvider } from "./_auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Direction } from "radix-ui";

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

/**
 * `dir` is passed in rather than read from `useLocale()`, because this provider
 * lives in the ROOT layout — above `NextIntlClientProvider` — so next-intl's
 * client hooks have no context here. The root layout already resolves the
 * locale on the server; it hands the direction down.
 */
export const Provider: React.FC<
  React.PropsWithChildren<{ dir: "rtl" | "ltr" }>
> = ({ children, dir }) => {
  return (
    // Radix primitives resolve direction from this context and, for DropdownMenu
    // and Select, stamp it onto the DOM as a real dir attribute. Without a
    // provider they default to "ltr" and render an LTR island inside an RTL page
    // — which is why the logout menu and every Select laid out backwards while
    // their neighbours were fine. One provider replaces a dir prop on every
    // call site, and removes the drift between copies of that one-liner.
    <Direction.Provider dir={dir}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="bottom-center" className="toaster" />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Direction.Provider>
  );
};
