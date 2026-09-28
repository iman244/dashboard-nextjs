import type { Metadata } from "next";
import type { ReactNode } from "react";
import { sectionMetadata } from "@/lib/metadata";

/**
 * Exists only to carry metadata: `page.tsx` is a client component, and a
 * client component cannot export `metadata` or `generateMetadata`.
 *
 * Not staff-only: any signed-in console user can read monitorings (the
 * campaign list, and a campaign's uploads and records). Routes under here
 * that write carry their own `<StaffOnly>`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return sectionMetadata(locale, "monitorings");
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
