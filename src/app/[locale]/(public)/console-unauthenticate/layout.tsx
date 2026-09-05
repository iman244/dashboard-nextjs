import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/metadata";

/**
 * Exists only to carry metadata. `page.tsx` is a client
 * component, and a client component cannot export `metadata` or
 * `generateMetadata` — Next reads those on the server. A layout is the
 * documented place to put them for such a route.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    ...(await pageMetadata(locale, "redirecting")),
    // Not a destination: it exists to bounce the visitor onward, and it says
    // something untrue ("you are signed in") to anyone who lands on it cold.
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
