import type { Metadata } from "next";
import type { ReactNode } from "react";
import { sectionMetadata } from "@/lib/metadata";

/**
 * Exists only to carry metadata. `step-2/[id]/page.tsx` is a client
 * component, and a client component cannot export `metadata` or
 * `generateMetadata` — Next reads those on the server. A layout is the
 * documented place to put them for such a route.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string, id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return sectionMetadata(locale, "sbhmStep2");
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
