"use client";
import React from "react";
import { Step2Report } from "../../../monitorings/_reports/step-2-report";

// Until the old step routes become redirects to the campaign page.
export default function Page(
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring/step-2/[id]">
) {
  const { id } = React.use(props.params);
  return (
    <Step2Report
      uploadId={Number(id)}
      personHref={(nid) =>
        `/console/saderat-bank-health-monitoring/step-2/${id}/${nid}`
      }
    />
  );
}
