"use client";

import { use } from "react";
import { TypeForm } from "../../_builder/type-form";

const EditMonitoringTypePage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);
  return <TypeForm id={Number(id)} />;
};

export default EditMonitoringTypePage;
