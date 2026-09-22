import type { Metadata } from "next";
import type { ReactNode } from "react";
import { sectionMetadata } from "@/lib/metadata";

/**
 * Exists only to carry metadata: `page.tsx` is a client component, and a
 * client component cannot export `metadata` or `generateMetadata`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return sectionMetadata(locale, "monitoringTypes");
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
