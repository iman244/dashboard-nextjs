import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "monitorings");
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
