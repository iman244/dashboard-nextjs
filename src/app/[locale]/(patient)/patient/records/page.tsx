import { Metadata } from "next";
import React from "react";
import Client from "./client";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "patientRecords");
}

const Page = () => {
  return <Client />;
};

export default Page;
