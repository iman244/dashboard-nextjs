import type { Metadata } from "next";
import type { ReactNode } from "react";
import { sectionMetadata } from "@/lib/metadata";

/**
 * Carries metadata only: `page.tsx` is a client component. A section, not a
 * leaf: the patient and record pages beneath it have titles of their own, and
 * a plain title here would drop the product suffix from theirs.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return sectionMetadata(locale, "campaign");
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
