import React from "react";
import Client from "./client";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "patientReports");
}

const Page = async (
  props: PageProps<"/[locale]/console/patient-reports">
) => {
  const resolvedSearchParams = await props.searchParams;
  
  console.log({ resolvedSearchParams });

  const nationalNumber = Array.isArray(resolvedSearchParams.nationalNumber)
    ? resolvedSearchParams.nationalNumber[0]
    : resolvedSearchParams.nationalNumber || "";
  const fromDate = Array.isArray(resolvedSearchParams.fromDate)
    ? resolvedSearchParams.fromDate[0]
    : resolvedSearchParams.fromDate || "";
  const toDate = Array.isArray(resolvedSearchParams.toDate)
    ? resolvedSearchParams.toDate[0]
    : resolvedSearchParams.toDate || "";
  const patientType = Array.isArray(resolvedSearchParams.patientType)
    ? resolvedSearchParams.patientType[0]
    : resolvedSearchParams.patientType || "25";

  return <Client initialValues={{ nationalNumber, fromDate, toDate, patientType }} />;
};

export default Page;