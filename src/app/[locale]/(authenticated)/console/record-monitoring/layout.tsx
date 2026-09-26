import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/metadata";
import { StaffOnlyConsoleSection } from "@/components/app/staff-only-console-section";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "recordMonitoring");
}

export default function Layout({ children }: { children: ReactNode }) {
  return <StaffOnlyConsoleSection>{children}</StaffOnlyConsoleSection>;
}
