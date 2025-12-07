"use client";

import React from "react";
import { useMonitoringIdRouteContext } from "../route-context";
import { useEHRByNationalNumberApi } from "@/data/electronic health record/api/EHR-by-national-number";
import { digitsEnToFa, digitsFaToEn } from "@persian-tools/persian-tools";
import { PatientType } from "@/components/app/patient-type-selector";

const PersonMonitoringPage = (
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring/[id]/[national_id]">
) => {
  const { national_id } = React.use(props.params);
  const { monitoring_query } = useMonitoringIdRouteContext();
  const { data, isPending, error } = monitoring_query;
  const today = new Date().toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  console.log({ today });

  const ehr_query = useEHRByNationalNumberApi({
    input: {
      params: {
        nationalNumber: national_id,
        fromDate: "1403/01/01",
        toDate: digitsFaToEn(today),
        patientType: PatientType.LAB,
      },
    },
  });

  const person_data = React.useMemo(() => {
    return data?.json.find(
      (item) => item["personel.کد ملی"] === parseInt(national_id)
    );
  }, [data, national_id]);

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No Data</div>;
  if (!person_data) return <div>No Person with this national id found</div>;

  return (
    <div>
      <pre>{JSON.stringify(person_data, null, 2)}</pre>
    </div>
  );
};

export default PersonMonitoringPage;
