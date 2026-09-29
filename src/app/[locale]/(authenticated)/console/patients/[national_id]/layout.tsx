import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/metadata";

/**
 * Exists only to carry metadata. `page.tsx` is a client component, and a
 * client component cannot export `generateMetadata`; Next reads it on the
 * server. A layout is the documented place to put it for such a route.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; national_id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "patient");
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
