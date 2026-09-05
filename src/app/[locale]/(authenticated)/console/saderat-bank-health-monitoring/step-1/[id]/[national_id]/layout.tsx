import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/metadata";

/**
 * Exists only to carry metadata. `step-1/[id]/[national_id]/page.tsx` is a client
 * component, and a client component cannot export `metadata` or
 * `generateMetadata` — Next reads those on the server. A layout is the
 * documented place to put them for such a route.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string, id: string, national_id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "sbhmPerson");
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
