import type { Metadata } from "next";
import React from "react";
import { MonitoringIdRouteProvider } from "./route-context";
import { sectionMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return sectionMetadata(locale, "sbhmStep1");
}

const MonitoringIdLayout: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return <MonitoringIdRouteProvider>{children}</MonitoringIdRouteProvider>;
};

export default MonitoringIdLayout;
