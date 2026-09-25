"use client";

import { StaffOnly } from "@/components/app/staff-only";
import { TypeForm } from "../_builder/type-form";

const NewMonitoringTypePage = () => (
  <StaffOnly>
    <TypeForm />
  </StaffOnly>
);

export default NewMonitoringTypePage;
