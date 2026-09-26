"use client";

import React from "react";
import { useRouter } from "@/i18n/navigation";
import { AppRoutes } from "@/app/paths";
import Loading from "@/app/loading";
import { usePatientSession } from "../../provider";
import { PatientSessionStatus } from "../../type";

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { status } = usePatientSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === PatientSessionStatus.Unauthenticated) {
      router.replace(AppRoutes.PATIENT_SIGN_IN);
    }
  }, [status, router]);

  // Mount the records query only after the patient session has hydrated.
  if (status !== PatientSessionStatus.Authenticated) {
    return <Loading />;
  }

  return <>{children}</>;
};

export default Layout;
