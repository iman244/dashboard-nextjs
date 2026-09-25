"use client";

import { use } from "react";
import { StaffOnly } from "@/components/app/staff-only";
import { TypeForm } from "../../_builder/type-form";

const EditMonitoringTypePage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);
  return (
    <StaffOnly>
      <TypeForm id={Number(id)} />
    </StaffOnly>
  );
};

export default EditMonitoringTypePage;
