import type { Metadata } from "next";
import type { ReactNode } from "react";
import { sectionMetadata } from "@/lib/metadata";

/**
 * Exists only to carry metadata. `page.tsx` is a client
 * component, and a client component cannot export `metadata` or
 * `generateMetadata` — Next reads those on the server. A layout is the
 * documented place to put them for such a route.
 *
 * Not staff-only: every route left under here is a redirect (the list, the
 * step pages, and the old per-person pages all forward to `/console/monitorings`
 * or the patient page). A viewer who opens a bookmarked old link needs to land
 * on the redirect, not on "Staff access required".
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return sectionMetadata(locale, "saderatBankHealthMonitoring");
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
