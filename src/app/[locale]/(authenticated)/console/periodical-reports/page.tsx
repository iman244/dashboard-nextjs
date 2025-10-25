import React from "react";
import Client from "./client";

const Page = async (
  props: PageProps<"/[locale]/console/periodical-reports">
) => {

  const resolvedSearchParams = await props.searchParams;

  console.log({ resolvedSearchParams });
  
  const fromDate = Array.isArray(resolvedSearchParams.fromDate)
    ? resolvedSearchParams.fromDate[0]
    : resolvedSearchParams.fromDate || "";
  const toDate = Array.isArray(resolvedSearchParams.toDate)
    ? resolvedSearchParams.toDate[0]
    : resolvedSearchParams.toDate || "";
  const patientType = Array.isArray(resolvedSearchParams.patientType)
    ? resolvedSearchParams.patientType[0]
    : resolvedSearchParams.patientType || "25";

  return <Client initialValues={{ patientType, fromDate, toDate }} />;
};

export default Page;
