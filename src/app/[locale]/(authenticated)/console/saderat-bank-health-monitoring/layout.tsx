import type { Metadata } from "next";
import type { ReactNode } from "react";
import { sectionMetadata } from "@/lib/metadata";

/**
 * Exists only to carry metadata. `page.tsx` is a client
 * component, and a client component cannot export `metadata` or
 * `generateMetadata` — Next reads those on the server. A layout is the
 * documented place to put them for such a route.
 *
 * Not staff-only: every route left under here (the list and step redirects,
 * and the old per-person pages until Task 15) is a read or a redirect, and
 * any signed-in console user can read a campaign. A viewer who opens a
 * bookmarked old link needs to land on the redirect, not on "Staff access
 * required" — the one write control on the person pages (editing a patient
 * record) already carries its own `useIsStaff()` gate.
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
