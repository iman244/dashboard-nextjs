"use client";
import React from "react";
import { Step1Report } from "../../../monitorings/_reports/step-1-report";

// Until the old step routes become redirects to the campaign page.
export default function Page(
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring/step-1/[id]">
) {
  const { id } = React.use(props.params);
  return (
    <Step1Report
      uploadId={Number(id)}
      personHref={(nid) =>
        `/console/saderat-bank-health-monitoring/step-1/${id}/${nid}`
      }
    />
  );
}
